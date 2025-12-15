import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

const RealTimeSim: React.FC = () => {
  const [data, setData] = useState<{ time: string; value: number }[]>([]);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial data
    const initial = Array.from({ length: 10 }).map((_, i) => ({
      time: new Date(Date.now() - (10 - i) * 1000).toLocaleTimeString(),
      value: Math.floor(Math.random() * 500) + 50
    }));
    setData(initial);

    return () => stopSim();
  }, []);

  const startSim = () => {
    if (active) return;
    setActive(true);
    intervalRef.current = window.setInterval(() => {
      const newVal = Math.floor(Math.random() * 800) + 50; // Random sale between 50 and 850
      const newTime = new Date().toLocaleTimeString();
      
      setData(prev => {
        const next = [...prev, { time: newTime, value: newVal }];
        if (next.length > 20) next.shift(); // Keep last 20 points
        return next;
      });
    }, 2000);
  };

  const stopSim = () => {
    setActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${active ? 'bg-red-500' : 'bg-slate-400'}`}></span>
          </span>
          Monitoramento em Tempo Real (Simulado)
        </h3>
        <div className="space-x-2">
          {!active ? (
            <button onClick={startSim} className="px-4 py-1.5 bg-success text-white text-sm font-medium rounded-md hover:bg-emerald-600 transition">
              Iniciar
            </button>
          ) : (
            <button onClick={stopSim} className="px-4 py-1.5 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition">
              Parar
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{fontSize: 10}} stroke="#94a3b8" />
            <YAxis tickFormatter={(val) => `R$${val}`} tick={{fontSize: 10}} stroke="#94a3b8" />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Valor Venda']}
              contentStyle={{ borderRadius: '8px' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#ef4444" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RealTimeSim;