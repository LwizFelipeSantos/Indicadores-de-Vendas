import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, LabelList
} from 'recharts';
import { ChartDataPoint } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface BaseChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: string;
}

// Helper to get chart colors based on theme
const useChartTheme = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    isDark,
    gridColor: isDark ? "#334155" : "#e2e8f0", // slate-700 vs slate-200
    textColor: isDark ? "#94a3b8" : "#64748b", // slate-400 vs slate-500
    tooltipBg: isDark ? "#1e293b" : "#ffffff", // slate-800 vs white
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipText: isDark ? "#f1f5f9" : "#1e293b"
  };
};

export const TicketMonthChart: React.FC<BaseChartProps> = ({ data, title }) => {
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-96 flex flex-col transition-colors">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="name" tick={{fontSize: 12, fill: textColor}} stroke={gridColor} />
            <YAxis tickFormatter={(val) => `R$${val}`} tick={{fontSize: 12, fill: textColor}} stroke={gridColor} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Ticket Médio']}
              contentStyle={{ 
                borderRadius: '8px', 
                border: `1px solid ${tooltipBorder}`, 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: tooltipBg,
                color: tooltipText
              }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText }}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} name="Ticket Médio" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export interface RankingChartProps {
  data: {
    name: string;
    faturamento: number;
    qtd: number;
    ticketMedio: number;
    cupons: number;
    itensPorCupom: number;
  }[];
  title: string;
}

type MetricType = 'faturamento' | 'qtd' | 'ticketMedio' | 'cupons' | 'itensPorCupom';

export const ItemsPerSellerChart: React.FC<RankingChartProps> = ({ data, title }) => {
  const [metric, setMetric] = useState<MetricType>('faturamento');
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  const config = {
    faturamento: { label: 'Faturamento', color: '#10b981', formatter: formatCurrency }, // Emerald
    qtd: { label: 'Quantidade', color: '#0ea5e9', formatter: (v: number) => formatNumber(v, 0) },
    ticketMedio: { label: 'Ticket Médio', color: '#f59e0b', formatter: formatCurrency },
    cupons: { label: 'Qtd Cupons', color: '#3b82f6', formatter: (v: number) => formatNumber(v, 0) },
    itensPorCupom: { label: 'Itens/Cupom', color: '#8b5cf6', formatter: (v: number) => formatNumber(v, 2) }, // Purple
  };

  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b[metric] - a[metric]);
  }, [data, metric]);

  // Dynamic Height Calculation: 32px per item, min 300px
  const chartHeight = Math.max(sortedData.length * 32, 300);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col w-full transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          {(Object.keys(config) as MetricType[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                metric === key 
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {config[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto custom-scroll pr-6">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={320} 
                tick={{fontSize: 9, fill: textColor, textAnchor: 'end', x: 310}} 
                interval={0}
                stroke={gridColor}
              />
              <Tooltip 
                cursor={{fill: gridColor, opacity: 0.3}}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: true, y: true }}
                formatter={(value: number) => [config[metric].formatter(value), config[metric].label]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                itemStyle={{ color: tooltipText }}
                labelStyle={{ color: tooltipText }}
              />
              <Bar 
                dataKey={metric} 
                fill={config[metric].color} 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={config[metric].color} />
                ))}
                <LabelList 
                  dataKey={metric} 
                  position="right" 
                  formatter={(val: number) => config[metric].formatter(val)}
                  style={{ fontSize: 9, fill: textColor }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const SalesTrendChart: React.FC<BaseChartProps> = ({ data, title }) => {
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-96 flex flex-col transition-colors">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="name" tick={{fontSize: 12, fill: textColor}} stroke={gridColor} />
            <YAxis tickFormatter={(val) => `R$${val/1000}k`} tick={{fontSize: 12, fill: textColor}} stroke={gridColor} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Vendas']}
              contentStyle={{ 
                borderRadius: '8px',
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                color: tooltipText
              }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText }}
            />
            <Legend wrapperStyle={{ color: textColor }} />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Vendas Líquidas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const TicketDayOfWeekChart: React.FC<BaseChartProps> = ({ data, title }) => {
  const [filterDay, setFilterDay] = useState<number | 'ALL'>('ALL');
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  const days = [
    { id: 0, label: 'Dom' },
    { id: 1, label: 'Seg' },
    { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' },
    { id: 4, label: 'Qui' },
    { id: 5, label: 'Sex' },
    { id: 6, label: 'Sáb' },
  ];

  const filteredData = useMemo(() => {
    if (filterDay === 'ALL') return data;
    return data.filter(d => d.dayOfWeek === filterDay);
  }, [data, filterDay]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-96 flex flex-col transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterDay('ALL')}
            className={`px-2 py-1 text-xs font-medium rounded transition ${
              filterDay === 'ALL' 
                ? 'bg-primary text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Todos
          </button>
          {days.map(day => (
            <button
              key={day.id}
              onClick={() => setFilterDay(day.id)}
              className={`px-2 py-1 text-xs font-medium rounded transition ${
                filterDay === day.id 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tick={{fontSize: 11, fill: textColor}} minTickGap={20} stroke={gridColor} />
              <YAxis tickFormatter={(val) => `R$${val}`} tick={{fontSize: 11, fill: textColor}} stroke={gridColor} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Ticket Médio']}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                itemStyle={{ color: tooltipText }}
                labelStyle={{ color: tooltipText }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Ticket Médio" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Sem dados para este dia da semana.
          </div>
        )}
      </div>
    </div>
  );
};

export const StoreRankingChart: React.FC<RankingChartProps> = ({ data, title }) => {
  const [metric, setMetric] = useState<MetricType>('faturamento');
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  const config = {
    faturamento: { label: 'Faturamento', color: '#8b5cf6', formatter: formatCurrency },
    qtd: { label: 'Quantidade', color: '#0ea5e9', formatter: (v: number) => formatNumber(v, 0) },
    ticketMedio: { label: 'Ticket Médio', color: '#f59e0b', formatter: formatCurrency },
    cupons: { label: 'Qtd Cupons', color: '#3b82f6', formatter: (v: number) => formatNumber(v, 0) },
    itensPorCupom: { label: 'Itens/Cupom', color: '#10b981', formatter: (v: number) => formatNumber(v, 2) },
  };

  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b[metric] - a[metric]);
  }, [data, metric]);

  // Dynamic Height Calculation: Reduced to 32px per item
  const chartHeight = Math.max(sortedData.length * 32, 300);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col w-full transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          {(Object.keys(config) as MetricType[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                metric === key 
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {config[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Added pr-6 to give space for tooltips to not be cut off by scroll container */}
      <div className="flex-1 w-full overflow-y-auto custom-scroll pr-6">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={320} 
                tick={{fontSize: 9, fill: textColor, textAnchor: 'end', x: 310}} 
                interval={0}
                stroke={gridColor}
              />
              <Tooltip 
                cursor={{fill: gridColor, opacity: 0.3}}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: true, y: true }}
                formatter={(value: number) => [config[metric].formatter(value), config[metric].label]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                itemStyle={{ color: tooltipText }}
                labelStyle={{ color: tooltipText }}
              />
              <Bar 
                dataKey={metric} 
                fill={config[metric].color} 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={config[metric].color} />
                ))}
                <LabelList 
                  dataKey={metric} 
                  position="right" 
                  formatter={(val: number) => config[metric].formatter(val)}
                  style={{ fontSize: 9, fill: textColor }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const BrandRankingChart: React.FC<RankingChartProps> = ({ data, title }) => {
  const [metric, setMetric] = useState<MetricType>('faturamento');
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  const config = {
    faturamento: { label: 'Faturamento', color: '#ec4899', formatter: formatCurrency }, // Pink for brands
    qtd: { label: 'Quantidade', color: '#0ea5e9', formatter: (v: number) => formatNumber(v, 0) },
    ticketMedio: { label: 'Ticket Médio', color: '#f59e0b', formatter: formatCurrency },
    cupons: { label: 'Qtd Cupons', color: '#3b82f6', formatter: (v: number) => formatNumber(v, 0) },
    itensPorCupom: { label: 'Itens/Cupom', color: '#10b981', formatter: (v: number) => formatNumber(v, 2) },
  };

  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b[metric] - a[metric]);
  }, [data, metric]);

  // Dynamic Height Calculation: Reduced to 32px per item
  const chartHeight = Math.max(sortedData.length * 32, 300);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col w-full transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          {(Object.keys(config) as MetricType[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                metric === key 
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {config[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto custom-scroll pr-6">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={320} 
                tick={{fontSize: 9, fill: textColor, textAnchor: 'end', x: 310}} 
                interval={0}
                stroke={gridColor}
              />
              <Tooltip 
                cursor={{fill: gridColor, opacity: 0.3}}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: true, y: true }}
                formatter={(value: number) => [config[metric].formatter(value), config[metric].label]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                itemStyle={{ color: tooltipText }}
                labelStyle={{ color: tooltipText }}
              />
              <Bar 
                dataKey={metric} 
                fill={config[metric].color} 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={config[metric].color} />
                ))}
                <LabelList 
                  dataKey={metric} 
                  position="right" 
                  formatter={(val: number) => config[metric].formatter(val)}
                  style={{ fontSize: 9, fill: textColor }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const ProductRankingChart: React.FC<RankingChartProps> = ({ data, title }) => {
  const [metric, setMetric] = useState<MetricType>('faturamento');
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  const config = {
    faturamento: { label: 'Faturamento', color: '#6366f1', formatter: formatCurrency }, // Indigo for products
    qtd: { label: 'Quantidade', color: '#0ea5e9', formatter: (v: number) => formatNumber(v, 0) },
    ticketMedio: { label: 'Ticket Médio', color: '#f59e0b', formatter: formatCurrency },
    cupons: { label: 'Qtd Cupons', color: '#3b82f6', formatter: (v: number) => formatNumber(v, 0) },
    itensPorCupom: { label: 'Itens/Cupom', color: '#10b981', formatter: (v: number) => formatNumber(v, 2) },
  };

  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b[metric] - a[metric]);
  }, [data, metric]);

  // Dynamic Height Calculation: Reduced to 32px per item
  const chartHeight = Math.max(sortedData.length * 32, 300);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col w-full transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          {(Object.keys(config) as MetricType[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                metric === key 
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {config[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto custom-scroll pr-6">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={320} 
                tick={{fontSize: 9, fill: textColor, textAnchor: 'end', x: 310}} 
                interval={0}
                stroke={gridColor}
              />
              <Tooltip 
                cursor={{fill: gridColor, opacity: 0.3}}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: true, y: true }}
                formatter={(value: number) => [config[metric].formatter(value), config[metric].label]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                itemStyle={{ color: tooltipText }}
                labelStyle={{ color: tooltipText }}
              />
              <Bar 
                dataKey={metric} 
                fill={config[metric].color} 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={config[metric].color} />
                ))}
                <LabelList 
                  dataKey={metric} 
                  position="right" 
                  formatter={(val: number) => config[metric].formatter(val)}
                  style={{ fontSize: 9, fill: textColor }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const CityRankingChart: React.FC<RankingChartProps> = ({ data, title }) => {
  const [metric, setMetric] = useState<MetricType>('faturamento');
  const { gridColor, textColor, tooltipBg, tooltipBorder, tooltipText } = useChartTheme();

  const config = {
    faturamento: { label: 'Faturamento', color: '#f97316', formatter: formatCurrency }, // Orange for cities
    qtd: { label: 'Quantidade', color: '#0ea5e9', formatter: (v: number) => formatNumber(v, 0) },
    ticketMedio: { label: 'Ticket Médio', color: '#f59e0b', formatter: formatCurrency },
    cupons: { label: 'Qtd Cupons', color: '#3b82f6', formatter: (v: number) => formatNumber(v, 0) },
    itensPorCupom: { label: 'Itens/Cupom', color: '#10b981', formatter: (v: number) => formatNumber(v, 2) },
  };

  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b[metric] - a[metric]);
  }, [data, metric]);

  // Dynamic Height Calculation: Reduced to 32px per item
  const chartHeight = Math.max(sortedData.length * 32, 300);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col w-full transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          {(Object.keys(config) as MetricType[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                metric === key 
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {config[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto custom-scroll pr-6">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={320} 
                tick={{fontSize: 9, fill: textColor, textAnchor: 'end', x: 310}} 
                interval={0}
                stroke={gridColor}
              />
              <Tooltip 
                cursor={{fill: gridColor, opacity: 0.3}}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: true, y: true }}
                formatter={(value: number) => [config[metric].formatter(value), config[metric].label]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: tooltipBg,
                  color: tooltipText
                }}
                itemStyle={{ color: tooltipText }}
                labelStyle={{ color: tooltipText }}
              />
              <Bar 
                dataKey={metric} 
                fill={config[metric].color} 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={config[metric].color} />
                ))}
                <LabelList 
                  dataKey={metric} 
                  position="right" 
                  formatter={(val: number) => config[metric].formatter(val)}
                  style={{ fontSize: 9, fill: textColor }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
