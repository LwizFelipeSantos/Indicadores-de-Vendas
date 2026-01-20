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
const FolderIcon = () => (
  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
);
const BackIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
);

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // State
  const [rawData, setRawData] = useState<SaleRecord[]>([]);
  const [managerMap, setManagerMap] = useState<Map<string, ManagerInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUploadScreen, setShowUploadScreen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    anos: [], meses: [], vendedores: [], lojas: [], cidades: [], gerentes: [], marcas: [], codigos: []
  });

  // EFFECT: Update rawData when managerMap is loaded
  useEffect(() => {
    if (managerMap.size > 0 && rawData.length > 0) {
      setRawData(prev => prev.map(item => {
        const normalizedStore = normalizeKey(item.loja);
        const found = managerMap.get(normalizedStore);
        if (found) {
          return { 
            ...item, 
            gerente: found.gerente,
            cidade: found.cidade || item.cidade 
          };
        }
        return item;
      }));
    }
  }, [managerMap]); 
  
  // Derived options for filters
  const options = useMemo(() => {
    if (rawData.length === 0) return { anos: [], meses: [], vendedores: [], lojas: [], cidades: [], gerentes: [], marcas: [], codigos: [] };
    return {
      anos: Array.from(new Set(rawData.map(d => String(d.ano)))).sort(),
      meses: (Array.from(new Set(rawData.map(d => d.mes))) as number[]).sort((a, b) => a - b).map(m => ({ val: String(m), label: MONTH_NAMES[m] })),
      vendedores: Array.from(new Set(rawData.map(d => d.vendedor))).sort(),
      lojas: Array.from(new Set(rawData.map(d => d.loja))).sort(),
      cidades: Array.from(new Set(rawData.map(d => d.cidade).filter(c => c && c !== 'N/A'))).sort(),
      gerentes: Array.from(new Set(rawData.map(d => d.gerente))).sort(),
      marcas: Array.from(new Set(rawData.map(d => d.marca))).sort(),
      codigos: Array.from(new Set(rawData.map(d => d.codigo).filter(c => c && c !== 'N/A'))).sort()
    };
  }, [rawData]);

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

  const stats: SummaryStats = useMemo(() => {
    const totalVendas = filteredData.reduce((acc, curr) => acc + curr.valor, 0);
    const totalQtd = filteredData.reduce((acc, curr) => acc + curr.qtd, 0);
    const uniqueCupons = new Set(filteredData.map(d => d.cupom)).size;
    return {
      totalVendas,
      totalQtd,
      totalCupons: uniqueCupons,
      ticketMedio: uniqueCupons ? totalVendas / uniqueCupons : 0,
      itensPorCupom: uniqueCupons ? totalQtd / uniqueCupons : 0
    };
  }, [filteredData]);

  const tableData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const aggMap = new Map<string, { record: SaleRecord; cupons: Set<string> }>();
    filteredData.forEach((item) => {
      const dayStr = item.data.toISOString().split('T')[0];
      const key = `${dayStr}|${item.loja}|${item.vendedor}`;
      if (!aggMap.has(key)) {
        aggMap.set(key, { record: { ...item, id: key, valor: 0, qtd: 0 }, cupons: new Set() });
      }
      const entry = aggMap.get(key)!;
      entry.cupons.add(item.cupom);
      entry.record.valor += item.valor;
      entry.record.qtd += item.qtd;
    });
    return Array.from(aggMap.values()).map(entry => ({ ...entry.record, cupom: entry.cupons.size.toString() })).sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [filteredData]);

  const chartData = useMemo(() => {
    const monthMap = new Map<number, { sum: number, cupons: Set<string> }>();
    filteredData.forEach(d => {
      const entry = monthMap.get(d.mes) || { sum: 0, cupons: new Set() };
      entry.sum += d.valor;
      entry.cupons.add(d.cupom);
      monthMap.set(d.mes, entry);
    });
    
    const ticketMes = Array.from(monthMap.entries()).map(([m, data]) => ({ name: MONTH_NAMES[m].substring(0, 3), index: m, value: data.sum / data.cupons.size })).sort((a, b) => a.index - b.index);
    const valorMes = Array.from(monthMap.entries()).map(([m, data]) => ({ name: MONTH_NAMES[m].substring(0, 3), index: m, value: data.sum })).sort((a, b) => a.index - b.index);

    const getRanking = (key: keyof SaleRecord) => {
      const map = new Map<string, { sum: number, qtd: number, cupons: Set<string> }>();
      filteredData.forEach(d => {
        const val = String(d[key]) || 'N/A';
        const entry = map.get(val) || { sum: 0, qtd: 0, cupons: new Set() };
        entry.sum += d.valor;
        entry.qtd += d.qtd;
        entry.cupons.add(d.cupom);
        map.set(val, entry);
      });
      return Array.from(map.entries()).map(([name, data]) => ({
        name, faturamento: data.sum, qtd: data.qtd, cupons: data.cupons.size,
        ticketMedio: data.cupons.size > 0 ? data.sum / data.cupons.size : 0,
        itensPorCupom: data.cupons.size > 0 ? data.qtd / data.cupons.size : 0
      }));
    };

    const dailyMap = new Map<string, { sum: number, cupons: Set<string>, date: Date }>();
    filteredData.forEach(d => {
      const dateKey = d.data.toISOString().split('T')[0];
      const entry = dailyMap.get(dateKey) || { sum: 0, cupons: new Set(), date: d.data };
      entry.sum += d.valor;
      entry.cupons.add(d.cupom);
      dailyMap.set(dateKey, entry);
    });
    const ticketDiario = Array.from(dailyMap.values()).map(e => ({ name: e.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: e.sum / e.cupons.size, dayOfWeek: e.date.getDay(), fullDate: e.date })).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

    return { 
      ticketMes, 
      valorMes, 
      ticketDiario,
      sellerRanking: getRanking('vendedor'),
      storeRanking: getRanking('loja'),
      brandRanking: getRanking('marca'),
      productRanking: getRanking('produto'),
      cityRanking: getRanking('cidade')
    };
  }, [filteredData]);

  const handleDataFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLoading(true);
      setError(null);
      try {
        const data = await parseSalesFile(e.target.files[0], managerMap);
        setRawData(data);
        setNotifications([{ id: 'load-success', title: 'Arquivo Processado', message: `${data.length} registros carregados com sucesso.`, type: 'success', timestamp: Date.now() }]);
        setShowUploadScreen(false); // Return to dashboard after successful upload
      } catch (err: any) {
        setError(err.message || "Erro ao ler arquivo");
      } finally {
        setLoading(false);
        // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
        e.target.value = '';
      }
    }
  };

  const handleMapFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const map = await parseManagerMap(e.target.files[0]);
        setManagerMap(map);
        alert(`Mapa de gerentes carregado! (${map.size} registros)`);
      } catch (err) {
        alert("Erro ao ler mapa de gerentes");
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleExport = () => {
    try {
      exportToExcel(tableData, 'relatorio.xlsx');
    } catch (err) {
      setNotifications([{ id: 'export-error', title: 'Erro na Exportação', message: 'Não foi possível gerar o arquivo Excel.', type: 'warning', timestamp: Date.now() }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-12 transition-colors duration-200">
      <NotificationToast notifications={notifications} onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />

      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 h-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">I</div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Indicadores de Vendas</h1>
            <h1 className="text-xl font-bold tracking-tight sm:hidden">Indicadores</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             {rawData.length > 0 && !showUploadScreen && (
               <button 
                 onClick={() => setShowUploadScreen(true)}
                 className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
               >
                 <FolderIcon /> <span className="hidden sm:inline">Alterar Arquivos</span>
               </button>
             )}
             
             <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-lg transition">
               {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
             </button>
             <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
               <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-xs">
                 {user?.name?.charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
             </div>
             <button onClick={logout} className="text-sm text-red-500 font-medium ml-1">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {(rawData.length === 0 || showUploadScreen) ? (
           <div className="max-w-2xl mx-auto" key="upload-screen">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center transition-colors">
               
               {rawData.length > 0 ? (
                 <div className="mb-6">
                   <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Gerenciar Arquivos</h2>
                   <p className="text-slate-500 dark:text-slate-400">
                     Seus dados atuais estão preservados. Faça upload de novos arquivos para substituir os dados existentes ou clique em voltar para cancelar.
                   </p>
                 </div>
               ) : (
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Olá, {user?.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400">Carregue sua planilha Excel de vendas para gerar os indicadores.</p>
                 </div>
               )}

               <div className="space-y-4">
                  <div className="relative group">
                    <input type="file" onChange={handleDataFile} accept=".xlsx,.xls" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 group-hover:border-primary group-hover:bg-blue-50/50 dark:group-hover:bg-slate-700 flex flex-col items-center transition">
                      <UploadIcon />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {rawData.length > 0 ? 'Clique para substituir a planilha de Vendas' : 'Clique para upload da planilha de Vendas'}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                     <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Mapa Vendedor → Gerente (Opcional)</label>
                     <input type="file" onChange={handleMapFile} accept=".xlsx,.xls" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 transition"/>
                  </div>
               </div>

               {loading && <p className="mt-4 text-primary font-medium animate-pulse">Processando...</p>}
               {error && <p className="mt-4 text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
               
               {rawData.length > 0 && (
                 <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      onClick={() => setShowUploadScreen(false)}
                      className="inline-flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium transition-colors"
                    >
                      <BackIcon /> Cancelar e Voltar para Dashboard
                    </button>
                 </div>
               )}
             </div>
           </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
               <div className="flex items-center justify-between mb-4 border-b pb-2 dark:border-slate-700">
                  <h3 className="font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <FilterIcon /> <span>Filtros</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-xs py-0.5 px-2 rounded-full">{rawData.length} registros</span>
                  </h3>
                  <button onClick={() => setFilters({anos:[], meses:[], vendedores:[], lojas:[], cidades:[], gerentes:[], marcas:[], codigos:[]})} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Limpar tudo</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <MultiSelect label="Ano" options={options.anos} selected={filters.anos} onChange={(v)=>setFilters(f=>({...f, anos:v}))} />
                  <MultiSelect label="Mês" options={options.meses} selected={filters.meses} onChange={(v)=>setFilters(f=>({...f, meses:v}))} />
                  <MultiSelect label="Cidade" options={options.cidades} selected={filters.cidades} onChange={(v)=>setFilters(f=>({...f, cidades:v}))} />
                  <MultiSelect label="Loja" options={options.lojas} selected={filters.lojas} onChange={(v)=>setFilters(f=>({...f, lojas:v}))} />
                  <MultiSelect label="Gerente" options={options.gerentes} selected={filters.gerentes} onChange={(v)=>setFilters(f=>({...f, gerentes:v}))} />
                  <MultiSelect label="Vendedor" options={options.vendedores} selected={filters.vendedores} onChange={(v)=>setFilters(f=>({...f, vendedores:v}))} />
                  <MultiSelect label="Marca" options={options.marcas} selected={filters.marcas} onChange={(v)=>setFilters(f=>({...f, marcas:v}))} />
                  <MultiSelect label="Código" options={options.codigos} selected={filters.codigos} onChange={(v)=>setFilters(f=>({...f, codigos:v}))} />
               </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
               <StatCard title="Vendas Totais" value={formatCurrency(stats.totalVendas)} colorClass="border-primary" />
               <StatCard title="Itens" value={formatNumber(stats.totalQtd, 0)} />
               <StatCard title="Ticket Médio" value={formatCurrency(stats.ticketMedio)} />
               <StatCard title="Cupons" value={formatNumber(stats.totalCupons, 0)} />
               <StatCard title="Itens/Cupom" value={formatNumber(stats.itensPorCupom)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <StoreRankingChart data={chartData.storeRanking} title="Ranking de Lojas" />
               <CityRankingChart data={chartData.cityRanking} title="Ranking de Cidades" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <BrandRankingChart data={chartData.brandRanking} title="Ranking de Marcas" />
               <ProductRankingChart data={chartData.productRanking} title="Ranking de Produtos" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TicketMonthChart data={chartData.ticketMes} title="Ticket Médio Mensal" />
              <SalesTrendChart data={chartData.valorMes} title="Evolução de Vendas" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <ItemsPerSellerChart data={chartData.sellerRanking} title="Top Vendedores" />
               <TicketDayOfWeekChart data={chartData.ticketDiario} title="Ticket Médio por Dia" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Detalhamento</h2>
                <button onClick={handleExport} className="flex items-center px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors shadow-sm"><DownloadIcon /> Exportar Excel</button>
              </div>
              <DataTable data={tableData} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AuthConsumer />
  </AuthProvider>
);

const AuthConsumer: React.FC = () => {
  const { user } = useAuth();
  return user ? <Dashboard /> : <AuthScreen />;
}

export default App;