import * as XLSX from 'xlsx';
import { SaleRecord } from '../types';

// Helper function to normalize keys for matching (Remove accents, uppercase, trim, single space)
export const normalizeKey = (key: any): string => {
  if (key === null || key === undefined) return '';
  return String(key)
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, ' ') // Collapse multiple spaces to one
    .trim();
};

// Define type for Manager Info
export interface ManagerInfo {
  gerente: string;
  cidade: string;
}

export const parseSalesFile = async (file: File, managerMap: Map<string, ManagerInfo>): Promise<SaleRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header mapping
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (rawData.length < 2) {
          reject(new Error("Arquivo vazio ou formato inválido"));
          return;
        }

        const headers = (rawData[0] as string[]).map(h => String(h).toLowerCase().trim());
        const rows = rawData.slice(1);

        // Map column indexes
        const idxData = headers.findIndex(h => h.includes('data') || h.includes('date'));
        
        // Mapeamento Vendedor
        let idxVendedor = headers.findIndex(h => h === 'descrição2' || h === 'descricao2');
        if (idxVendedor === -1) idxVendedor = headers.findIndex(h => h.includes('descrição2') || h.includes('descricao2'));
        if (idxVendedor === -1) idxVendedor = headers.findIndex(h => h.includes('vendedor') || h.includes('salesperson'));

        // Mapeamento Loja
        let idxLoja = headers.findIndex(h => h === 'descrição' || h === 'descricao');
        if (idxLoja === -1) idxLoja = headers.findIndex(h => (h.includes('descrição') || h.includes('descricao')) && !h.includes('2') && !h.includes('3'));
        if (idxLoja === -1) idxLoja = headers.findIndex(h => h.includes('loja') || h.includes('store'));

        // Mapeamento Cidade (Fallback da planilha de vendas, caso não tenha no mapa)
        let idxCidade = headers.findIndex(h => h === 'cidade' || h === 'city' || h === 'municipio' || h === 'município');
        if (idxCidade === -1) idxCidade = headers.findIndex(h => h.includes('cidade') || h.includes('municipio'));

        // Mapeamento Marca
        let idxMarca = headers.findIndex(h => h === 'marca' || h === 'brand');
        if (idxMarca === -1) idxMarca = headers.findIndex(h => h.includes('marca') || h.includes('fabricante'));

        // Mapeamento Produto (Descrição3)
        let idxProduto = headers.findIndex(h => h === 'descrição3' || h === 'descricao3');
        if (idxProduto === -1) idxProduto = headers.findIndex(h => h.includes('descrição3') || h.includes('descricao3'));
        if (idxProduto === -1) idxProduto = headers.findIndex(h => h.includes('produto') || h.includes('product'));

        // Mapeamento Código (Item)
        let idxCodigo = headers.findIndex(h => h === 'item');
        if (idxCodigo === -1) idxCodigo = headers.findIndex(h => h === 'código' || h === 'codigo' || h === 'code' || h === 'sku');

        const idxValor = headers.findIndex(h => h.includes('valor') || h.includes('total') || h.includes('amount'));
        const idxQtd = headers.findIndex(h => h.includes('qtd') || h.includes('quant') || h.includes('qty'));
        
        // Mapeamento de Cupom
        let idxCupom = headers.findIndex(h => h === 'cupom' || h === 'ticket' || h === 'pedido');
        if (idxCupom === -1) idxCupom = headers.findIndex(h => h.includes('cupom') || h.includes('ticket') || h.includes('pedido'));
        if (idxCupom === -1) idxCupom = headers.findIndex(h => h.includes('documento') || h.includes('nota'));

        if (idxData === -1 || idxValor === -1) {
          reject(new Error("Colunas obrigatórias 'Data' ou 'Valor' não encontradas."));
          return;
        }

        const parsedRecords: SaleRecord[] = rows.map((row: any, index: number) => {
          let dateObj = new Date();
          if (row[idxData] instanceof Date) {
            dateObj = row[idxData];
          } else if (typeof row[idxData] === 'number') {
             dateObj = new Date(Math.round((row[idxData] - 25569) * 86400 * 1000));
          } else if (typeof row[idxData] === 'string') {
             dateObj = new Date(row[idxData]);
          }

          const vendedorName = row[idxVendedor] ? String(row[idxVendedor]).trim() : 'N/A';
          const lojaName = row[idxLoja] ? String(row[idxLoja]).trim() : 'N/A';
          
          // Busca Info no Mapa (Gerente e Cidade)
          const lojaKey = normalizeKey(lojaName);
          const mapInfo = managerMap.get(lojaKey);
          
          // Prioriza cidade do mapa, senão pega da planilha de vendas, senão N/A
          const cidadeSalesFile = row[idxCidade] ? String(row[idxCidade]).trim() : 'N/A';
          const cidadeFinal = mapInfo?.cidade || cidadeSalesFile;
          const gerenteFinal = mapInfo?.gerente || 'N/A';

          return {
            id: `row-${index}`,
            data: dateObj,
            mes: dateObj.getMonth(),
            ano: dateObj.getFullYear(),
            vendedor: vendedorName,
            loja: lojaName,
            cidade: cidadeFinal,
            marca: row[idxMarca] ? String(row[idxMarca]).trim() : 'N/A',
            produto: row[idxProduto] ? String(row[idxProduto]).trim() : 'N/A',
            codigo: row[idxCodigo] ? String(row[idxCodigo]).trim() : 'N/A',
            gerente: gerenteFinal,
            cupom: row[idxCupom] ? String(row[idxCupom]).trim() : `G-${index}`,
            valor: parseFloat(row[idxValor]) || 0,
            qtd: parseFloat(row[idxQtd]) || 1,
          };
        }).filter(r => !isNaN(r.data.getTime()));

        resolve(parsedRecords);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsBinaryString(file);
  });
};

export const parseManagerMap = async (file: File): Promise<Map<string, ManagerInfo>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const map = new Map<string, ManagerInfo>();
        
        if (rawData.length > 0) {
            // Busca Inteligente de Cabeçalho (Primeiras 20 linhas)
            let headerIndex = -1;
            let idxLoja = -1;
            let idxGerente = -1;
            let idxCidade = -1;

            for (let i = 0; i < Math.min(rawData.length, 20); i++) {
                const row = rawData[i].map(c => String(c).toLowerCase().trim());
                
                const l = row.findIndex(c => c === 'loja' || c === 'lojas' || c === 'store' || c === 'descrição' || c === 'descricao');
                const g = row.findIndex(c => c === 'gerente' || c === 'manager');
                const c = row.findIndex(c => c === 'cidade' || c === 'municipio' || c === 'município' || c === 'city');
                
                // Exige pelo menos Loja e Gerente para considerar válido
                if (l !== -1 && g !== -1) {
                    headerIndex = i;
                    idxLoja = l;
                    idxGerente = g;
                    idxCidade = c; // Pode ser -1 se não achar, mas tudo bem
                    break;
                }
            }

            if (headerIndex !== -1) {
                // Itera a partir da linha seguinte ao cabeçalho
                for(let i = headerIndex + 1; i < rawData.length; i++) {
                    const row = rawData[i];
                    const rawStore = row[idxLoja];
                    const managerName = row[idxGerente] ? String(row[idxGerente]).trim() : null;
                    const cityName = (idxCidade !== -1 && row[idxCidade]) ? String(row[idxCidade]).trim() : '';
                    
                    if (rawStore && managerName) {
                        const normalizedStore = normalizeKey(rawStore);
                        map.set(normalizedStore, { 
                          gerente: managerName,
                          cidade: cityName
                        });
                    }
                }
            } else {
                // Fallback (Assumindo col 0 = Loja, col 1 = Gerente, col 2 = Cidade (opcional))
                if (rawData.length > 1) {
                     for(let i=1; i<rawData.length; i++) {
                        const row = rawData[i];
                        if (row[0] && row[1]) {
                             map.set(normalizeKey(row[0]), { 
                               gerente: String(row[1]).trim(),
                               cidade: row[2] ? String(row[2]).trim() : ''
                             });
                        }
                     }
                }
            }
        }
        resolve(map);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (data: SaleRecord[], filename: string) => {
  const exportData = data.map(d => {
    const cupomCount = Number(d.cupom) || (d.cupom ? 1 : 0);
    const itensPerCupom = cupomCount > 0 ? d.qtd / cupomCount : 0;
    const ticketMedio = cupomCount > 0 ? d.valor / cupomCount : 0;

    return {
      Data: d.data.toLocaleDateString('pt-BR'),
      Loja: d.loja,
      Cidade: d.cidade,
      Vendedor: d.vendedor,
      Gerente: d.gerente,
      Produto: d.produto, 
      'Código': d.codigo, // Added to export
      'Valor Total': d.valor,
      'Qtd Total': d.qtd,
      'Qtd Cupons': d.cupom, 
      'Itens/Cupom': itensPerCupom.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      'Ticket Médio': ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Indicadores");
  XLSX.writeFile(wb, filename);
};