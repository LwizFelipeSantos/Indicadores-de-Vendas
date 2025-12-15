export interface SaleRecord {
  id: string; // Unique ID for keying
  data: Date;
  mes: number; // 0-11
  ano: number;
  vendedor: string;
  loja: string;
  cidade: string;
  gerente: string;
  marca: string;
  produto: string; // New field based on 'Descrição3'
  codigo: string; // New field based on 'Item'
  cupom: string;
  valor: number;
  qtd: number;
}

export interface FilterState {
  anos: string[];
  meses: string[];
  vendedores: string[];
  lojas: string[];
  cidades: string[];
  gerentes: string[];
  marcas: string[];
  codigos: string[];
}

export interface SummaryStats {
  totalVendas: number;
  totalQtd: number;
  totalCupons: number;
  ticketMedio: number;
  itensPorCupom: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

// --- New Types for Auth ---

export interface User {
  email: string;
  name: string;
  // password removed for security reasons
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  timestamp: number;
}