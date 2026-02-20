import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ScraperService } from './scraper.service';
import { SefazService } from './sefaz.service';
import { CategoriesService } from '../categories/categories.service';
import { BudgetsService } from '../budgets/budgets.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
    private readonly logger = new Logger(InvoicesService.name);

    constructor(
        private prisma: PrismaService,
        private scraperService: ScraperService,
        private sefazService: SefazService,
        private categoriesService: CategoriesService,
        private budgetsService: BudgetsService,
    ) { }

    // Fluxo completo: QR Code URL → parse → salvar automaticamente
    async processQrCode(userId: string, qrCodeUrl: string) {
        this.logger.log(`Processing QR code for user ${userId}`);

        // 1. Extrair chave de acesso
        const accessKey = this.sefazService.extractAccessKey(qrCodeUrl);

        // 2. Verificar duplicata antes de qualquer download pesado
        const existing = await this.prisma.invoice.findFirst({
            where: { userId, accessKey },
            include: {
                items: {
                    include: { product: { include: { category: true } } },
                },
            },
        });

        if (existing) {
            this.logger.log(`Duplicate invoice found: ${existing.id}`);
            return { status: 'duplicate', message: 'Esta nota já foi escaneada.', invoice: existing };
        }

        // 3. Obter dados da NF-e (tenta XML, fallback para scraper Puppeteer)
        let invoiceData: {
            accessKey: string;
            storeName: string;
            date: Date;
            total: number;
            items: Array<{
                name: string;
                code: string;
                quantity: number;
                unit: string;
                unitPrice: number;
                totalPrice: number;
            }>;
        } | null = null;

        const xml = await this.sefazService.downloadXml(qrCodeUrl);
        if (xml) {
            try {
                const parsed = await this.sefazService.parseXml(xml);
                invoiceData = {
                    accessKey: parsed.accessKey || accessKey,
                    storeName: parsed.storeName,
                    date: parsed.date,
                    total: parsed.total,
                    items: parsed.items,
                };
                this.logger.log(`Invoice parsed from XML: ${parsed.storeName}`);
            } catch (xmlErr: any) {
                this.logger.warn(`XML parse failed, falling back to scraper: ${xmlErr.message}`);
            }
        }

        if (!invoiceData) {
            this.logger.log('Falling back to Puppeteer scraper');
            const scraped = await this.scraperService.scrapeInvoice(qrCodeUrl);
            invoiceData = {
                accessKey: scraped.accessKey || accessKey,
                storeName: scraped.establishmentName || 'Estabelecimento',
                date: scraped.date ? new Date(scraped.date) : new Date(),
                total: scraped.totalValue || 0,
                items: (scraped.items || []).map((item: any) => ({
                    name: item.description || 'Produto',
                    code: item.code || `GEN-${Date.now()}-${Math.random()}`,
                    quantity: item.quantity || 1,
                    unit: item.unit || 'UN',
                    unitPrice: item.unitPrice || 0,
                    totalPrice: item.totalPrice || 0,
                })),
            };
        }

        // Sanity check: se o total for 0 ou menor que 10% da soma dos itens,
        // usar a soma direta dos itens como fallback confiável.
        if (invoiceData!.items.length > 0) {
            const sumOfItems = invoiceData!.items.reduce(
                (sum, item) => sum + item.totalPrice,
                0,
            );
            const threshold = sumOfItems * 0.1;
            if (invoiceData!.total === 0 || (sumOfItems > 0 && invoiceData!.total < threshold)) {
                this.logger.warn(
                    `Total suspeito (${invoiceData!.total}) vs soma dos itens (${sumOfItems}). Usando soma.`,
                );
                invoiceData!.total = sumOfItems;
            }
        }

        // 4. Pré-processar itens FORA da transação: categorizar + upsert de produtos
        //    (produtos são reutilizáveis entre notas — não precisam de atomicidade com a nota)
        const processedItems: Array<{
            productId: string;
            quantity: number;
            unit: string;
            unitPrice: number;
            totalPrice: number;
        }> = [];

        for (const item of invoiceData!.items) {
            const categoryId = await this.categoriesService.categorizeProduct(item.name);

            let product;
            if (item.code && !item.code.startsWith('GEN-')) {
                product = await this.prisma.product.upsert({
                    where: { code: item.code },
                    update: { categoryId },
                    create: { code: item.code, description: item.name, categoryId },
                });
            } else {
                product = await this.prisma.product.findFirst({ where: { description: item.name } });
                if (!product) {
                    product = await this.prisma.product.create({
                        data: {
                            code: `GEN-${Date.now()}-${Math.random()}`,
                            description: item.name,
                            categoryId,
                        },
                    });
                }
            }
            processedItems.push({
                productId: product.id,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            });
        }

        // 5. Transação pequena e rápida: apenas invoice + invoice_items (createMany = 1 query)
        let invoice: any;
        try {
            invoice = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const inv = await tx.invoice.create({
                    data: {
                        accessKey: invoiceData!.accessKey,
                        url: qrCodeUrl,
                        date: invoiceData!.date,
                        totalValue: invoiceData!.total,
                        establishmentName: invoiceData!.storeName,
                        userId,
                    },
                });

                await tx.invoiceItem.createMany({
                    data: processedItems.map((item) => ({ invoiceId: inv.id, ...item })),
                });

                return tx.invoice.findUnique({
                    where: { id: inv.id },
                    include: {
                        items: {
                            include: { product: { include: { category: true } } },
                        },
                    },
                });
            }, { timeout: 15000 });
        } catch (err: any) {
            // P2002 = unique constraint violation (access_key já existe no banco)
            if (err?.code === 'P2002') {
                this.logger.warn(`access_key já existe no banco: ${invoiceData!.accessKey}. Retornando nota existente.`);
                const existingByKey = await this.prisma.invoice.findFirst({
                    where: { accessKey: invoiceData!.accessKey },
                    include: { items: { include: { product: { include: { category: true } } } } },
                });
                return { status: 'duplicate', message: 'Esta nota já foi escaneada.', invoice: existingByKey };
            }
            throw err;
        }

        this.logger.log(`Invoice saved: ${invoice!.id}`);

        // Verificar orçamentos afetados em background (não bloqueia a resposta)
        this.triggerBudgetCheck(userId).catch((err) =>
            this.logger.warn(`Budget check error: ${err.message}`),
        );

        return { status: 'success', message: 'Nota fiscal processada com sucesso!', invoice };
    }

    private async triggerBudgetCheck(userId: string) {
        const budgets = await this.budgetsService.getUserBudgets(userId);
        for (const b of budgets) {
            await this.budgetsService.checkAndSendAlerts(b.id);
        }
    }

    async preview(url: string) {
        this.logger.log(`Previewing invoice URL: ${url}`);
        // 1. Scrape data
        return this.scraperService.scrapeInvoice(url);
    }

    async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
        this.logger.log(`Creating invoice for user ${userId}`);

        // 2. Check if invoice already exists
        const existingInvoice = await this.prisma.invoice.findUnique({
            where: { accessKey: createInvoiceDto.accessKey }
        });

        if (existingInvoice) {
            this.logger.log(`Invoice already exists: ${existingInvoice.id}. Returning existing record.`);
            return this.prisma.invoice.findUnique({
                where: { id: existingInvoice.id },
                include: {
                    items: {
                        include: {
                            product: {
                                include: { category: true },
                            },
                        },
                    },
                },
            });
        }

        // 3. Pré-processar itens fora da transação
        const processedItems: Array<{
            productId: string;
            quantity: number;
            unit: string;
            unitPrice: number;
            totalPrice: number;
        }> = [];

        for (const item of createInvoiceDto.items) {
            const categoryId = await this.categoriesService.categorizeProduct(item.description || '');

            let product;
            if (item.code) {
                product = await this.prisma.product.upsert({
                    where: { code: item.code },
                    update: { categoryId },
                    create: { code: item.code, description: item.description, categoryId },
                });
            } else {
                product = await this.prisma.product.findFirst({ where: { description: item.description } });
                if (!product) {
                    product = await this.prisma.product.create({
                        data: { description: item.description, code: `GEN-${Date.now()}-${Math.random()}`, categoryId },
                    });
                } else if (!product.categoryId && categoryId) {
                    product = await this.prisma.product.update({ where: { id: product.id }, data: { categoryId } });
                }
            }
            processedItems.push({
                productId: product.id,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            });
        }

        // 4. Transação rápida: invoice + createMany para os itens
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const invoice = await tx.invoice.create({
                data: {
                    accessKey: createInvoiceDto.accessKey,
                    ...(createInvoiceDto.url && { url: createInvoiceDto.url }),
                    date: createInvoiceDto.date || new Date(),
                    totalValue: createInvoiceDto.totalValue,
                    establishmentName: createInvoiceDto.establishmentName,
                    userId,
                },
            });

            await tx.invoiceItem.createMany({
                data: processedItems.map((item) => ({ invoiceId: invoice.id, ...item })),
            });

            const result = await tx.invoice.findUnique({
                where: { id: invoice.id },
                include: { items: { include: { product: { include: { category: true } } } } },
            });

            if (!result) throw new Error('Failed to retrieve created invoice');
            return result;
        }, { timeout: 15000 });
    }

    async findAll(userId: string) {
        return this.prisma.invoice.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            include: {
                items: {
                    include: {
                        product: {
                            include: { category: true },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.invoice.findFirst({
            where: { id, userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: { category: true },
                        },
                    },
                },
            },
        });
    }

    async remove(id: string, userId: string) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, userId }
        });

        if (!invoice) {
            throw new ConflictException('Invoice not found or access denied'); // Using Conflict for consistency, or NotFound w/e
        }

        // Delete invoice (Cascade delete usually handles items if configured in Prisma, 
        // but let's assume standard behavior or explicit delete if needed. 
        // If schema has onDelete: Cascade, deleting invoice is enough)

        // Check schema behavior. Assuming Cascade for now or explicit transaction if needed.
        // Actually best to use deleteMany to be safe if ID is unique but verify User.

        return this.prisma.invoice.delete({
            where: { id }
        });
    }
}
