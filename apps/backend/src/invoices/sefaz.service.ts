import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export interface ParsedInvoiceItem {
  name: string;
  code: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedInvoice {
  accessKey: string;
  storeName: string;
  storeCnpj: string;
  storeAddress: string;
  date: Date;
  total: number;
  items: ParsedInvoiceItem[];
  source: 'xml' | 'scraper';
}

@Injectable()
export class SefazService {
  private readonly logger = new Logger(SefazService.name);

  // Mapear código UF para URL da SEFAZ (consulta NFC-e)
  private readonly SEFAZ_NFCE_URLS: Record<string, string> = {
    '35': 'https://www.nfce.fazenda.sp.gov.br/consulta',
    '33': 'https://www.nfce.fazenda.rj.gov.br/consulta',
    '41': 'https://www.nfce.fazenda.pr.gov.br/nfce/consulta',
    '31': 'https://nfce.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
    '43': 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
    '53': 'https://www.sefaz.df.gov.br/NFCE/consulta.aspx',
    '51': 'https://www.sefaz.mt.gov.br/nfce/consultanfce',
    '52': 'https://www.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe.aspx',
    '50': 'https://www.dfe.ms.gov.br/nfce/qrcode',
    '29': 'https://nfce.sefaz.ba.gov.br/servicos/nfce/default.aspx',
    '23': 'https://nfce.sefaz.ce.gov.br/pages/showNFCe.html',
    '25': 'https://www.sefaz.pb.gov.br/nfce/consulta',
    '26': 'https://nfce.sefaz.pe.gov.br/nfce-web/consultarNFCe',
    '21': 'https://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.do',
    '22': 'https://nfce.sefaz.pi.gov.br/nfce/consulta',
    '24': 'https://nfce.set.rn.gov.br/consultarNFCe.aspx',
    '27': 'https://www.sefaz.al.gov.br/nfce/consulta',
    '28': 'https://nfce.sefaz.se.gov.br/consulta-nfce/consulta.jsp',
    '15': 'https://www.sefa.pa.gov.br/nfce/consulta',
    '13': 'https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.html',
    '11': 'https://www.sefin.ro.gov.br/nfce/consulta',
    '14': 'https://www.sefaz.rr.gov.br/nfce/servlet/wp_consulta_nfce',
    '16': 'https://www.sefaz.ap.gov.br/nfce/consultanfce',
    '17': 'https://www.sefaz.to.gov.br/nfce/consulta.jsf',
    '12': 'https://www.sefaznet.ac.gov.br/nfce/consulta',
    '42': 'https://www.sef.sc.gov.br/nfce/consulta',
    '32': 'https://nfe.fazenda.es.gov.br/nfce',
  };

  // Extrair chave de acesso da URL do QR code
  extractAccessKey(qrCodeUrl: string): string {
    // Formato: ...?p=CHAVE44DIGITOS|...
    const match = qrCodeUrl.match(/[?&]p=([0-9]{44})/);
    if (match) return match[1];

    // Fallback: chave pura de 44 dígitos
    const pureKey = qrCodeUrl.match(/\b([0-9]{44})\b/);
    if (pureKey) return pureKey[1];

    throw new BadRequestException(
      'QR code inválido — chave de acesso não encontrada.',
    );
  }

  // Validar chave de acesso
  validateAccessKey(key: string): boolean {
    return key.length === 44 && /^\d+$/.test(key);
  }

  // Decompor chave de acesso
  parseAccessKey(key: string) {
    return {
      uf: key.substring(0, 2),
      yearMonth: key.substring(2, 6),
      cnpj: key.substring(6, 20),
      model: key.substring(20, 22), // 55=NFe, 65=NFCe
      series: key.substring(22, 25),
      number: key.substring(25, 34),
    };
  }

  // Tentar download do XML da SEFAZ
  async downloadXml(qrCodeUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(qrCodeUrl, {
        timeout: 12000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 CompreiApp/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml',
        },
        responseType: 'text',
      });

      const html: string = response.data;

      // Tentar extrair bloco XML do nfeProc embutido na página
      const xmlMatch = html.match(/<nfeProc[\s\S]*?<\/nfeProc>/i);
      if (xmlMatch) return xmlMatch[0];

      const nfeMatch = html.match(/<NFe[\s\S]*?<\/NFe>/i);
      if (nfeMatch) return nfeMatch[0];

      return null;
    } catch (err: any) {
      this.logger.warn(`XML download failed: ${err.message}`);
      return null;
    }
  }

  // Parse XML da NF-e
  async parseXml(xmlString: string): Promise<ParsedInvoice> {
    const parsed = await parseStringPromise(xmlString, {
      explicitArray: true,
      ignoreAttrs: false,
    });

    // Navegar estrutura XML NF-e
    const nfeProc = parsed.nfeProc || parsed;
    const nfe =
      nfeProc?.NFe?.[0]?.infNFe?.[0] || parsed?.infNFe?.[0];

    if (!nfe) {
      throw new BadRequestException('Estrutura XML inválida ou não suportada.');
    }

    // Emitente
    const emit = nfe.emit?.[0] || {};
    const storeName: string =
      emit.xFant?.[0] || emit.xNome?.[0] || 'Estabelecimento';
    const storeCnpj: string = emit.CNPJ?.[0] || '';

    const enderEmit = emit.enderEmit?.[0] || {};
    const storeAddress = [
      enderEmit.xLgr?.[0],
      enderEmit.nro?.[0],
      enderEmit.xBairro?.[0],
      enderEmit.xMun?.[0],
      enderEmit.UF?.[0],
    ]
      .filter(Boolean)
      .join(', ');

    // Data de emissão
    const dhEmi: string = nfe.ide?.[0]?.dhEmi?.[0] || '';
    const date = dhEmi ? new Date(dhEmi) : new Date();

    // Chave de acesso (sem prefixo NFe)
    const rawId: string = nfe.$?.Id || '';
    const accessKey = rawId.replace(/^NFe/, '');

    // Itens — parseados PRIMEIRO para servir como fallback do total
    const det: any[] = nfe.det || [];
    const items: ParsedInvoiceItem[] = det.map((d, i) => {
      const prod = d.prod?.[0] || {};
      const name: string = prod.xProd?.[0] || `Produto ${i + 1}`;
      const code: string =
        prod.cEAN?.[0] && prod.cEAN[0] !== 'SEM GTIN'
          ? prod.cEAN[0]
          : prod.cProd?.[0] || `GEN-${Date.now()}-${i}`;
      const quantity = parseFloat(prod.qCom?.[0] ?? '1');
      const unit: string = prod.uCom?.[0] || 'UN';
      const unitPrice = parseFloat(prod.vUnCom?.[0] ?? '0');
      const totalPrice = parseFloat(prod.vProd?.[0] ?? '0');

      return { name, code, quantity, unit, unitPrice, totalPrice };
    });

    const sumOfItems = items.reduce((acc, it) => acc + it.totalPrice, 0);

    // Total — tenta vNF (valor total da NF-e), fallback para vProd (total bruto dos produtos)
    // ICMSTot pode ter capitalização diferente dependendo da UF/versão do layout
    const icmsTot = nfe.total?.[0]?.ICMSTot?.[0]
      ?? nfe.total?.[0]?.ICMStot?.[0]
      ?? nfe.total?.[0]?.icmsTot?.[0]
      ?? null;

    const vNF   = icmsTot ? parseFloat(icmsTot.vNF?.[0]   ?? icmsTot.VNF?.[0]   ?? '0') : 0;
    const vProd = icmsTot ? parseFloat(icmsTot.vProd?.[0]  ?? '0') : 0;

    let total = 0;
    if (vNF > 0) {
      // Sanity check: se vNF for menor que 10% do total dos itens, provavelmente
      // houve erro de parsing (XML retornou campo errado). Usar vProd ou soma dos itens.
      const threshold = sumOfItems > 0 ? sumOfItems * 0.1 : vProd * 0.1;
      if (sumOfItems > 0 && vNF < threshold) {
        this.logger.warn(
          `vNF (${vNF}) suspeito vs sumOfItems (${sumOfItems}), usando vProd/sumOfItems`,
        );
        total = vProd > 0 ? vProd : sumOfItems;
      } else {
        total = vNF;
      }
    } else if (vProd > 0) {
      total = vProd;
    } else {
      total = sumOfItems;
    }

    return {
      accessKey,
      storeName,
      storeCnpj,
      storeAddress,
      date,
      total,
      items,
      source: 'xml',
    };
  }

  // Tratar erros específicos da SEFAZ
  private handleSefazError(error: any): never {
    const code: string = error.code || '';
    const status: number = error.response?.status;

    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      throw new BadRequestException(
        'Timeout ao consultar SEFAZ. Tente novamente em alguns minutos.',
      );
    }
    if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') {
      throw new BadRequestException(
        'Servidor da SEFAZ indisponível. Verifique sua conexão.',
      );
    }
    if (status === 404) {
      throw new BadRequestException(
        'Nota fiscal não encontrada. Verifique se o QR code está correto.',
      );
    }
    if (status === 503) {
      throw new BadRequestException(
        'Sistema da SEFAZ em manutenção. Tente novamente mais tarde.',
      );
    }

    throw new BadRequestException(
      error.message || 'Erro ao processar nota fiscal.',
    );
  }
}
