import React, { useState, useMemo, useEffect } from 'react';
import { SaleRecord, FilterState, SummaryStats, ChartDataPoint, Notification } from './types';
import { parseSalesFile, parseManagerMap, exportToExcel, normalizeKey, ManagerInfo } from './services/excelService';
import { MONTH_NAMES, formatCurrency, formatNumber } from './utils/formatters';
import StatCard from './components/StatCard';
import { TicketMonthChart, ItemsPerSellerChart, SalesTrendChart, TicketDayOfWeekChart, StoreRankingChart, BrandRankingChart, ProductRankingChart, CityRankingChart } from './components/Charts';
import DataTable from './components/DataTable';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthForms';
import { NotificationToast } from './components/AlertManager';
import { useTheme } from './context/ThemeContext';
import MultiSelect from './components/MultiSelect';

// Icons
const UploadIcon = () => (
  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
);
const FilterIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
);
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
);

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // State
  const [rawData, setRawData] = useState<SaleRecord[]>([]);
  // Updated Manager Map to store object {gerente, cidade} instead of string
  const [managerMap, setManagerMap] = useState<Map<string, ManagerInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // EFFECT: Update rawData when managerMap is loaded (fixes issue when Sales file is uploaded before Manager file)
  useEffect(() => {
    if (managerMap.size > 0 && rawData.length > 0) {
      setRawData(prev => prev.map(item => {
        // If manager is missing or N/A, try to find it in the new map using normalized key
        const normalizedStore = normalizeKey(item.loja);
        const found = managerMap.get(normalizedStore);
        
        if (found) {
          return { 
            ...item, 
            gerente: found.gerente,
            // Only update city if it's available in the map, otherwise keep existing
            cidade: found.cidade || item.cidade 
          };
        }
        return item;
      }));
    }
  }, [managerMap]); 
  
  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    anos: [], meses: [], vendedores: [], lojas: [], cidades: [], gerentes: [], marcas: [], codigos: []
  });

  // Derived: Unique Options for Filters
  const options = useMemo(() => {
    if (rawData.length === 0) return { anos: [], meses: [], vendedores: [], lojas: [], cidades: [], gerentes: [], marcas: [], codigos: [] };
    const anos = Array.from(new Set(rawData.map(d => String(d.ano)))).sort();
    const meses = (Array.from(new Set(rawData.map(d => d.mes))) as number[])
      .sort((a, b) => a - b)
      .map(m => ({ val: String(m), label: MONTH_NAMES[m] }));
    const vendedores = Array.from(new Set(rawData.map(d => d.vendedor))).sort();
    const lojas = Array.from(new Set(rawData.map(d => d.loja))).sort();
    // Filter out N/A or empty strings for Cities to keep UI clean
    const cidades = Array.from(new Set(rawData.map(d => d.cidade).filter(c => c && c !== 'N/A'))).sort();
    const gerentes = Array.from(new Set(rawData.map(d => d.gerente))).sort();
    const marcas = Array.from(new Set(rawData.map(d => d.marca))).sort();
    const codigos = Array.from(new Set(rawData.map(d => d.codigo).filter(c => c && c !== 'N/A'))).sort();
    return { anos, meses, vendedores, lojas, cidades, gerentes, marcas, codigos };
  }, [rawData]);

  // Derived: Filtered Data (Raw)
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      if (filters.anos.length && !filters.anos.includes(String(item.ano))) return false;
      if (filters.meses.length && !filters.meses.includes(String(item.mes))) return false;
      if (filters.vendedores.length && !filters.vendedores.includes(item.vendedor)) return false;
      if (filters.lojas.length && !filters.lojas.includes(item.loja)) return false;
      if (filters.cidades.length && !filters.cidades.includes(item.cidade)) return false;
      if (filters.gerentes.length && !filters.gerentes.includes(item.gerente)) return false;
      if (filters.marcas.length && !filters.marcas.includes(item.marca)) return false;
      if (filters.codigos.length && !filters.codigos.includes(item.codigo)) return false;
      return true;
    });
  }, [rawData, filters]);

  // Derived: Aggregated Data for Table (Grouped by Day + Store + Seller)
  // This calculates the distinct count of coupons per row
  const tableData = useMemo(() => {
    if (filteredData.length === 0) return [];

    const aggMap = new Map<string, {
      record: SaleRecord;
      cupons: Set<string>;
    }>();

    filteredData.forEach((item) => {
      // Create a unique key for grouping
      const dayStr = item.data.toISOString().split('T')[0]; // YYYY-MM-DD
      const key = `${dayStr}|${item.loja}|${item.vendedor}`;
      
      if (!aggMap.has(key)) {
        aggMap.set(key, {
          record: { 
            ...item, 
            id: key, // Unique ID for the aggregated row
            valor: 0, 
            qtd: 0 
          },
          cupons: new Set()
        });
      }
      
      const entry = aggMap.get(key)!;
      entry.cupons.add(item.cupom);
      entry.record.valor += item.valor;
      entry.record.qtd += item.qtd;
    });

    // Convert to array and put the COUNT of coupons in the 'cupom' field
    return Array.from(aggMap.values())
      .map(entry => ({
        ...entry.record,
        cupom: entry.cupons.size.toString()
      }))
      .sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [filteredData]);

  // Derived: Statistics
  const stats: SummaryStats = useMemo(() => {
    const totalVendas = filteredData.reduce((acc, curr) => acc + curr.valor, 0);
    const totalQtd = filteredData.reduce((acc, curr) => acc + curr.qtd, 0);
    const uniqueCupons = new Set(filteredData.map(d => d.cupom)).size;
    const ticketMedio = uniqueCupons ? totalVendas / uniqueCupons : 0;
    const itensPorCupom = uniqueCupons ? totalQtd / uniqueCupons : 0;

    return { totalVendas, totalQtd, totalCupons: uniqueCupons, ticketMedio, itensPorCupom };
  }, [filteredData]);

  // Derived: Chart Data
  const chartData = useMemo(() => {
    // 1. Ticket Médio por Mês (Sort by month index)
    const monthMap = new Map<number, { sum: number, cupons: Set<string> }>();
    filteredData.forEach(d => {
      const entry = monthMap.get(d.mes) || { sum: 0, cupons: new Set() };
      entry.sum += d.valor;
      entry.cupons.add(d.cupom);
      monthMap.set(d.mes, entry);
    });
    
    const ticketMes: ChartDataPoint[] = Array.from(monthMap.entries())
      .map(([m, data]) => ({
        name: MONTH_NAMES[m].substring(0, 3),
        index: m,
        value: data.sum / data.cupons.size
      }))
      .sort((a, b) => a.index - b.index);

    // 2. Seller Ranking (Comprehensive)
    const sellerMap = new Map<string, { sum: number, qtd: number, cupons: Set<string> }>();
    filteredData.forEach(d => {
      const entry = sellerMap.get(d.vendedor) || { sum: 0, qtd: 0, cupons: new Set() };
      entry.sum += d.valor;
      entry.qtd += d.qtd;
      entry.cupons.add(d.cupom);
      sellerMap.set(d.vendedor, entry);
    });

    const sellerRanking = Array.from(sellerMap.entries()).map(([name, data]) => ({
      name,
      faturamento: data.sum,
      qtd: data.qtd,
      cupons: data.cupons.size,
      ticketMedio: data.cupons.size > 0 ? data.sum / data.cupons.size : 0,
      itensPorCupom: data.cupons.size > 0 ? data.qtd / data.cupons.size : 0
    }));

    // 3. Valor Mensal
    const valorMes: ChartDataPoint[] = Array.from(monthMap.entries())
      .map(([m, data]) => ({
        name: MONTH_NAMES[m].substring(0, 3),
        index: m,
        value: data.sum
      }))
      .sort((a, b) => a.index - b.index);

    // 4. Ticket Médio Diário (New Chart)
    const dailyMap = new Map<string, { sum: number, cupons: Set<string>, date: Date }>();
    filteredData.forEach(d => {
      const dateKey = d.data.toISOString().split('T')[0];
      const entry = dailyMap.get(dateKey) || { sum: 0, cupons: new Set(), date: d.data };
      entry.sum += d.valor;
      entry.cupons.add(d.cupom);
      dailyMap.set(dateKey, entry);
    });

    const ticketDiario: ChartDataPoint[] = Array.from(dailyMap.values())
      .map((entry) => ({
        name: entry.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: entry.sum / entry.cupons.size,
        dayOfWeek: entry.date.getDay(), // 0 = Dom, 1 = Seg, etc.
        fullDate: entry.date
      }))
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

    // 5. Store Ranking (Comprehensive)
    const storeMap = new Map<string, { sum: number, qtd: number, cupons: Set<string> }>();
    filteredData.forEach(d => {
      const entry = storeMap.get(d.loja) || { sum: 0, qtd: 0, cupons: new Set() };
      entry.sum += d.valor;
      entry.qtd += d.qtd;
      entry.cupons.add(d.cupom);
      storeMap.set(d.loja, entry);
    });

    const storeRanking = Array.from(storeMap.entries()).map(([name, data]) => ({
      name,
      faturamento: data.sum,
      qtd: data.qtd,
      cupons: data.cupons.size,
      ticketMedio: data.cupons.size > 0 ? data.sum / data.cupons.size : 0,
      itensPorCupom: data.cupons.size > 0 ? data.qtd / data.cupons.size : 0
    }));

    // 6. Brand Ranking (Comprehensive)
    const brandMap = new Map<string, { sum: number, qtd: number, cupons: Set<string> }>();
    filteredData.forEach(d => {
      const entry = brandMap.get(d.marca) || { sum: 0, qtd: 0, cupons: new Set() };
      entry.sum += d.valor;
      entry.qtd += d.qtd;
      entry.cupons.add(d.cupom);
      brandMap.set(d.marca, entry);
    });

    const brandRanking = Array.from(brandMap.entries()).map(([name, data]) => ({
      name,
      faturamento: data.sum,
      qtd: data.qtd,
      cupons: data.cupons.size,
      ticketMedio: data.cupons.size > 0 ? data.sum / data.cupons.size : 0,
      itensPorCupom: data.cupons.size > 0 ? data.qtd / data.cupons.size : 0
    }));

    // 7. Product Ranking (Comprehensive)
    const productMap = new Map<string, { sum: number, qtd: number, cupons: Set<string> }>();
    filteredData.forEach(d => {
      const entry = productMap.get(d.produto) || { sum: 0, qtd: 0, cupons: new Set() };
      entry.sum += d.valor;
      entry.qtd += d.qtd;
      entry.cupons.add(d.cupom);
      productMap.set(d.produto, entry);
    });

    const productRanking = Array.from(productMap.entries()).map(([name, data]) => ({
      name,
      faturamento: data.sum,
      qtd: data.qtd,
      cupons: data.cupons.size,
      ticketMedio: data.cupons.size > 0 ? data.sum / data.cupons.size : 0,
      itensPorCupom: data.cupons.size > 0 ? data.qtd / data.cupons.size : 0
    }));

    // 8. City Ranking (Comprehensive)
    const cityMap = new Map<string, { sum: number, qtd: number, cupons: Set<string> }>();
    filteredData.forEach(d => {
      // Handle empty/N/A cities if necessary, or just use as is
      const city = d.cidade || 'N/A';
      const entry = cityMap.get(city) || { sum: 0, qtd: 0, cupons: new Set() };
      entry.sum += d.valor;
      entry.qtd += d.qtd;
      entry.cupons.add(d.cupom);
      cityMap.set(city, entry);
    });

    const cityRanking = Array.from(cityMap.entries()).map(([name, data]) => ({
      name,
      faturamento: data.sum,
      qtd: data.qtd,
      cupons: data.cupons.size,
      ticketMedio: data.cupons.size > 0 ? data.sum / data.cupons.size : 0,
      itensPorCupom: data.cupons.size > 0 ? data.qtd / data.cupons.size : 0
    }));

    return { ticketMes, sellerRanking, valorMes, ticketDiario, storeRanking, brandRanking, productRanking, cityRanking };
  }, [filteredData]);


  // Handlers
  const handleDataFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      setError(null);
      try {
        const data = await parseSalesFile(e.target.files[0], managerMap);
        setRawData(data);
        setNotifications([{
          id: 'load-success',
          title: 'Arquivo Processado',
          message: `${data.length} registros carregados com sucesso.`,
          type: 'success',
          timestamp: Date.now()
        }]);
      } catch (err: any) {
        setError(err.message || "Erro ao ler arquivo");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMapFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const map = await parseManagerMap(e.target.files[0]);
        setManagerMap(map);
        alert(`Mapa de gerentes carregado! (${map.size} registros)`);
      } catch (err) {
        alert("Erro ao ler mapa de gerentes");
      }
    }
  };
  
  const resetFilters = () => setFilters({ anos: [], meses: [], vendedores: [], lojas: [], cidades: [], gerentes: [], marcas: [], codigos: [] });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-12 transition-colors duration-200">
      <NotificationToast notifications={notifications} onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">I</div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Indicadores de Vendas</h1>
          </div>
          <div className="flex items-center gap-4">
             {/* Theme Toggle */}
             <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
               {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
             </button>

             <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full transition-colors">
               <div className="w-6 h-6 bg-secondary dark:bg-slate-600 rounded-full flex items-center justify-center text-white text-xs">
                 {user?.name?.charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{user?.name}</span>
             </div>
             <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Upload Section */}
        {rawData.length === 0 ? (
           <div className="max-w-2xl mx-auto">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center transition-colors">
               <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Olá, {user?.name}</h2>
               <p className="text-slate-500 dark:text-slate-400 mb-8">Carregue sua planilha Excel de vendas para gerar os indicadores.</p>
               
               <div className="space-y-4">
                  {/* Main File */}
                  <div className="relative group">
                    <input type="file" onChange={handleDataFile} accept=".xlsx,.xls" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 transition group-hover:border-primary group-hover:bg-blue-50/50 dark:group-hover:bg-slate-700 flex flex-col items-center">
                      <UploadIcon />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Clique para upload da planilha de Vendas</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">.xlsx ou .xls</span>
                    </div>
                  </div>

                  {/* Manager Map */}
                  <div className="text-left">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mapa Vendedor → Gerente (Opcional)</label>
                     <input type="file" onChange={handleMapFile} accept=".xlsx,.xls" className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-600 transition"/>
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Inclua colunas 'Loja', 'Gerente' e 'Cidade' para atualizar os filtros.</p>
                  </div>
               </div>

               {loading && <p className="mt-4 text-primary font-medium animate-pulse">Processando dados...</p>}
               {error && <p className="mt-4 text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
             </div>
           </div>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
               <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <FilterIcon /> 
                    <span>Filtros</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs py-0.5 px-2 rounded-full">
                      {rawData.length} registros
                    </span>
                  </h3>
                  <button onClick={resetFilters} className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-slate-700">
                    Limpar tudo
                  </button>
               </div>
               
               {/* Responsive Filter Grid using the new component */}
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  <MultiSelect 
                    label="Ano" 
                    options={options.anos} 
                    selected={filters.anos} 
                    onChange={(val) => setFilters(prev => ({...prev, anos: val}))} 
                  />
                  <MultiSelect 
                    label="Mês" 
                    options={options.meses} // Pass array of {val, label} objects directly
                    selected={filters.meses} 
                    onChange={(val) => setFilters(prev => ({...prev, meses: val}))} 
                  />
                  <MultiSelect 
                    label="Cidade" 
                    options={options.cidades} 
                    selected={filters.cidades} 
                    onChange={(val) => setFilters(prev => ({...prev, cidades: val}))} 
                  />
                  <MultiSelect 
                    label="Loja" 
                    options={options.lojas} 
                    selected={filters.lojas} 
                    onChange={(val) => setFilters(prev => ({...prev, lojas: val}))} 
                  />
                  <MultiSelect 
                    label="Gerente" 
                    options={options.gerentes} 
                    selected={filters.gerentes} 
                    onChange={(val) => setFilters(prev => ({...prev, gerentes: val}))} 
                  />
                  <MultiSelect 
                    label="Vendedor" 
                    options={options.vendedores} 
                    selected={filters.vendedores} 
                    onChange={(val) => setFilters(prev => ({...prev, vendedores: val}))} 
                  />
                  <MultiSelect 
                    label="Marca" 
                    options={options.marcas} 
                    selected={filters.marcas} 
                    onChange={(val) => setFilters(prev => ({...prev, marcas: val}))} 
                  />
                  <MultiSelect 
                    label="Código" 
                    options={options.codigos} 
                    selected={filters.codigos} 
                    onChange={(val) => setFilters(prev => ({...prev, codigos: val}))} 
                  />
               </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
               <StatCard title="Vendas Totais" value={formatCurrency(stats.totalVendas)} colorClass="bg-white dark:bg-slate-800 border-l-4 border-primary" />
               <StatCard title="Quantidade de Itens" value={formatNumber(stats.totalQtd, 0)} />
               <StatCard title="Ticket Médio" value={formatCurrency(stats.ticketMedio)} />
               <StatCard title="Total Cupons" value={formatNumber(stats.totalCupons, 0)} />
               <StatCard title="Itens / Cupom" value={formatNumber(stats.itensPorCupom)} />
            </div>

            {/* Ranking Grid: Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <StoreRankingChart data={chartData.storeRanking} title="Ranking de Lojas" />
               <CityRankingChart data={chartData.cityRanking} title="Ranking de Cidades" />
            </div>

            {/* Ranking Grid: Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <BrandRankingChart data={chartData.brandRanking} title="Ranking de Marcas" />
               <ProductRankingChart data={chartData.productRanking} title="Ranking de Produtos" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TicketMonthChart data={chartData.ticketMes} title="Ticket Médio Mensal" />
              <SalesTrendChart data={chartData.valorMes} title="Evolução de Vendas" />
            </div>

            {/* Charts Row 2 & New Ticket Daily Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <ItemsPerSellerChart data={chartData.sellerRanking} title="Top Vendedores" />
               <TicketDayOfWeekChart data={chartData.ticketDiario} title="Ticket Médio por Dia" />
            </div>

            {/* Data Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Detalhamento</h2>
                <button 
                  onClick={() => exportToExcel(tableData, 'indicadores_vendas.xlsx')}
                  className="flex items-center px-4 py-2 bg-success text-white rounded-lg hover:bg-emerald-600 transition shadow-sm font-medium"
                >
                  <DownloadIcon /> Exportar Excel
                </button>
              </div>
              <DataTable data={tableData} />
            </div>
          </>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 dark:text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Indicadores de Vendas. Desenvolvido para Luiz.</p>
        </div>
      </footer>
    </div>
  );
};

// Root Component wrapping Auth
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

// Separate component to consume auth context
const AuthConsumer: React.FC = () => {
  const { user } = useAuth();
  return user ? <Dashboard /> : <AuthScreen />;
}

export default App;