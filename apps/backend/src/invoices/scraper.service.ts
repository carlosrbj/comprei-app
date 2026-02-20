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
            const date = this.extractDate($);
            const items = this.extractItems($);

            this.logger.log(`Extracted data: ${JSON.stringify({ accessKey, totalValue, establishmentName, date, itemsCount: items.length })}`);

            const data = {
                url,
                accessKey: accessKey || `KEY-${Date.now()}`,
                totalValue,
                establishmentName,
                date: date || new Date(),
                items
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
        // Coleta TODOS os candidatos a total e usa o maior valor.
        // Isso evita que valores parciais de pagamento (ex: "Valor a Pagar via Cartão: R$ 11,59")
        // sobrescrevam o total correto quando múltiplos elementos correspondem ao seletor.
        const candidates: number[] = [];

        $('.txtTit3').each((i, el) => {
            const text = $(el).text();
            const isTotal = text.includes('Vl. Total') || text.includes('Valor Total');
            const isPagar = text.includes('Valor a Pagar') && !text.includes('via') && !text.includes('parcial');
            if (isTotal || isPagar) {
                // Pega apenas o PRIMEIRO .valor dentro do elemento (evita concatenação)
                const valStr = $(el).find('.valor').first().text()
                    || $(el).find('.totalNumb').first().text();
                if (valStr) {
                    const candidate = this.parseBrNumber(valStr);
                    if (candidate > 0) candidates.push(candidate);
                }
            }
        });

        // Usa o maior valor entre os candidatos (o total da nota é sempre >= qualquer sub-valor)
        if (candidates.length > 0) {
            return Math.max(...candidates);
        }

        // Fallback: elemento com classe .txtMax (valor em destaque no topo)
        const txtMax = $('.txtMax').first().text();
        if (txtMax) {
            const v = this.parseBrNumber(txtMax);
            if (v > 0) return v;
        }

        return 0;
    }

    private extractEstablishmentName($: cheerio.CheerioAPI): string {
        // Usually at the top, class txtTopo
        return $('.txtTopo').first().text().trim() || $('.txtCenter').first().text().trim() || 'Estabelecimento Desconhecido';
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
                const totalText = $(el).find('.valor').text().trim(); // in right column

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
