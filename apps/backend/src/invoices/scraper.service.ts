import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);

    private findChromiumExecutable(): string | undefined {
        const candidates = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/usr/bin/chromium',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
        ].filter(Boolean) as string[];

        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                this.logger.log(`Found browser at: ${candidate}`);
                return candidate;
            }
        }

        this.logger.warn('No system browser found — letting Puppeteer use its bundled Chromium');
        return undefined;
    }

    async scrapeInvoice(url: string) {
        this.logger.log(`Starting scrape for URL: ${url}`);

        let browser;
        try {
            const executablePath = this.findChromiumExecutable();
            browser = await puppeteer.launch({
                headless: 'new' as any,
                executablePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });

            const page = await browser.newPage();

            // Set user agent to avoid bot detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            this.logger.log('Navigating to page...');
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Extract content
            const content = await page.content();
            this.logger.log(`Page content length: ${content.length}`);
            const $ = cheerio.load(content);

            // Implement parsing logic for SEFAZ PR
            const accessKey = this.extractAccessKey($);
            const totalValue = this.extractTotalValue($);
            const establishmentName = this.extractEstablishmentName($);
            const storeCnpj = this.extractCnpj($);
            const storeAddress = this.extractAddress($);
            const date = this.extractDate($);
            const items = this.extractItems($);
            const discount = this.extractDiscount($);
            const { paymentMethod, amountPaid } = this.extractPayment($);

            this.logger.log(`Extracted data: ${JSON.stringify({ accessKey, totalValue, establishmentName, storeCnpj, date, itemsCount: items.length })}`);

            const data = {
                url,
                accessKey: accessKey || `KEY-${Date.now()}`,
                totalValue,
                establishmentName,
                storeCnpj,
                storeAddress,
                date: date || new Date(),
                items,
                discount,
                amountToPay: totalValue,
                paymentMethod,
                amountPaid,
            };

            return data;
        } catch (error) {
            this.logger.error(`Error scraping invoice: ${error.message}`, error.stack);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    private extractAccessKey($: cheerio.CheerioAPI): string | null {
        // Chave de acesso: <span class="chave">...</span>
        const keyText = $('.chave').text().replace(/\s/g, '');
        return keyText.length === 44 ? keyText : null;
    }

    private extractTotalValue($: cheerio.CheerioAPI): number {
        const candidates: number[] = [];

        // 1. Procura em .txtTit3 com label "Vl. Total" ou "Valor Total"
        //    Usa o ÚLTIMO .valor do elemento (após o label) para evitar pegar contagens como "5 itens"
        $('.txtTit3').each((_i, el) => {
            const text = $(el).text();
            const isTotal = text.includes('Vl. Total') || text.includes('Valor Total');
            const isPagar = text.includes('Valor a Pagar') && !text.includes('via') && !text.includes('parcial');
            if (isTotal || isPagar) {
                // Pega o ÚLTIMO .valor (após o label), não o primeiro (que pode ser contagem de itens)
                const valorEls = $(el).find('.valor');
                const valStr = valorEls.last().text() || valorEls.first().text()
                    || $(el).find('.totalNumb').last().text();
                if (valStr) {
                    const candidate = this.parseBrNumber(valStr);
                    // Filtra valores muito pequenos (ex: "5 itens") — total real é sempre >= 1 real
                    if (candidate >= 1) candidates.push(candidate);
                }
            }
        });

        if (candidates.length > 0) {
            return Math.max(...candidates);
        }

        // 2. Fallback: .txtMax (valor em destaque, ex: total grande no topo da página)
        const txtMax = $('.txtMax').first().text();
        if (txtMax) {
            const v = this.parseBrNumber(txtMax);
            if (v >= 1) return v;
        }

        // 3. Fallback regex direto no texto da página
        //    Procura por "Vl. Total" ou "Valor Total" seguido de um valor em reais
        const bodyText = $.text();
        const patterns = [
            /Vl\.\s*Total\s*[:\-]?\s*R?\$?\s*([\d.,]+)/i,
            /Valor\s+Total\s*[:\-]?\s*R?\$?\s*([\d.,]+)/i,
        ];
        for (const pattern of patterns) {
            const matches = [...bodyText.matchAll(new RegExp(pattern.source, 'gi'))];
            // Pega o ÚLTIMO match (o total real costuma aparecer por último na página)
            if (matches.length > 0) {
                const last = matches[matches.length - 1];
                const v = this.parseBrNumber(last[1]);
                if (v >= 1) return v;
            }
        }

        return 0;
    }

    private extractEstablishmentName($: cheerio.CheerioAPI): string {
        return $('.txtTopo').first().text().trim() || $('.txtCenter').first().text().trim() || 'Estabelecimento Desconhecido';
    }

    private extractCnpj($: cheerio.CheerioAPI): string {
        // Try to find CNPJ formatted as XX.XXX.XXX/XXXX-XX in page text
        const bodyText = $.text();
        const cnpjMatch = bodyText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
        return cnpjMatch ? cnpjMatch[0] : '';
    }

    private extractAddress($: cheerio.CheerioAPI): string {
        // SEFAZ PR typically has address in the second or third .txtTopo block
        const blocks: string[] = [];
        $('.txtTopo').each((_i, el) => {
            const txt = $(el).text().trim();
            if (txt) blocks.push(txt);
        });
        // First block is usually the store name; subsequent ones may be address
        if (blocks.length > 1) return blocks.slice(1).join(', ');
        // Fallback: look for address-like patterns in the body text (CEP or street abbreviations)
        const bodyText = $.text();
        const cepMatch = bodyText.match(/CEP:?\s*[\d]{5}-?[\d]{3}/i);
        if (cepMatch) {
            const idx = bodyText.indexOf(cepMatch[0]);
            return bodyText.substring(Math.max(0, idx - 120), idx + cepMatch[0].length).replace(/\s+/g, ' ').trim();
        }
        return '';
    }

    private extractDiscount($: cheerio.CheerioAPI): number {
        let discount = 0;
        $('.txtTit3').each((_i, el) => {
            const text = $(el).text();
            if (text.includes('Desconto') || text.includes('desconto')) {
                const valStr = $(el).find('.valor').first().text();
                if (valStr) {
                    const v = this.parseBrNumber(valStr);
                    if (v > 0) discount = v;
                }
            }
        });
        return discount;
    }

    private extractPayment($: cheerio.CheerioAPI): { paymentMethod: string; amountPaid: number } {
        let paymentMethod = '';
        let amountPaid = 0;

        $('.txtTit3').each((_i, el) => {
            const text = $(el).text();
            if (text.includes('Tipo de Pagamento') || text.includes('Forma de Pagamento') || text.includes('Pagamento')) {
                // Look for the payment label text inside the element
                const label = $(el).find('.txtTit').text().trim() || $(el).find('span').not('.valor').first().text().trim();
                if (label && !paymentMethod) paymentMethod = label;
            }
            if (text.includes('Valor Pago') || text.includes('Troco')) {
                const valStr = $(el).find('.valor').first().text();
                if (valStr) {
                    const v = this.parseBrNumber(valStr);
                    if (v > 0 && !amountPaid) amountPaid = v;
                }
            }
        });

        // Fallback: look for payment keywords in any text node
        if (!paymentMethod) {
            const bodyText = $.text();
            for (const keyword of ['Cartão de Débito', 'Cartão de Crédito', 'Dinheiro', 'PIX', 'Vale Alimentação', 'Vale Refeição']) {
                if (bodyText.includes(keyword)) { paymentMethod = keyword; break; }
            }
        }

        return { paymentMethod, amountPaid };
    }

    private extractDate($: cheerio.CheerioAPI): Date | null {
        // Emissão: 08/02/2026 09:26:22
        // Find text containing "Emissão:"
        const bodyText = $.text();
        const match = bodyText.match(/Emissão:\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2}:\d{2})/);
        if (match) {
            const [_, datePart, timePart] = match;
            // Parse DD/MM/YYYY HH:mm:ss
            const [day, month, year] = datePart.split('/').map(Number);
            const [hour, minute, second] = timePart.split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute, second);
        }
        return null;
    }

    private extractItems($: cheerio.CheerioAPI) {
        const items: any[] = [];
        // Rows with id starting with "Item"
        $('tr[id^="Item"]').each((i, el) => {
            try {
                const description = $(el).find('.txtTit2').first().text().trim();
                const codeText = $(el).find('.RCod').text().trim(); // (Código: 123)
                const qtdText = $(el).find('.Rqtd').text().trim(); // Qtde.:1
                const unText = $(el).find('.RUN').text().trim(); // UN: UND or UN: KG
                const unitPriceText = $(el).find('.RvlUnit').text().trim(); // Vl. Unit.: 15,49
                const totalText = $(el).find('.valor').first().text().trim(); // in right column

                const code = codeText.match(/\(Código:\s*(\w+)\)/)?.[1] || `ITEM-${i}`;
                const quantity = this.parseBrNumber(qtdText.replace('Qtde.:', ''));
                const unit = unText.replace('UN:', '').trim();
                const unitPrice = this.parseBrNumber(unitPriceText.replace('Vl. Unit.:', ''));
                const totalPrice = this.parseBrNumber(totalText);

                if (description) {
                    items.push({
                        description,
                        code,
                        quantity,
                        unit,
                        unitPrice,
                        totalPrice
                    });
                }
            } catch (e) {
                this.logger.warn(`Failed to parse item row ${i}: ${e.message}`);
            }
        });

        return items;
    }

    private parseBrNumber(str: string): number {
        if (!str) return 0;
        // Remove 'R$', spaces, convert comma to dot
        const clean = str.replace(/[R$\s.]/g, '').replace(',', '.').trim();
        return parseFloat(clean) || 0;
    }
}
