import React, { useState } from 'react';
import { SaleRecord } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface DataTableProps {
  data: SaleRecord[];
}

const ITEMS_PER_PAGE = 10;

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  if (data.length === 0) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">Nenhum dado para exibir.</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="overflow-x-auto custom-scroll">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Loja</th>
              <th className="px-6 py-3">Cidade</th>
              <th className="px-6 py-3">Vendedor</th>
              <th className="px-6 py-3">Gerente</th>
              <th className="px-6 py-3 text-right">Valor Total</th>
              <th className="px-6 py-3 text-right">Qtd Total</th>
              <th className="px-6 py-3 text-center">Cupons</th>
              <th className="px-6 py-3 text-center">Itens/Cupom</th>
              <th className="px-6 py-3 text-right">Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => {
              // 'cupom' here holds the COUNT as string from App.tsx aggregation
              const cupomCount = Number(row.cupom) || 0;
              const itensPerCupom = cupomCount > 0 ? row.qtd / cupomCount : 0;
              const ticketMedio = cupomCount > 0 ? row.valor / cupomCount : 0;

              return (
                <tr key={row.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">{row.data.toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.loja}</td>
                  <td className="px-6 py-4">{row.cidade}</td>
                  <td className="px-6 py-4">{row.vendedor}</td>
                  <td className="px-6 py-4">{row.gerente}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(row.valor)}</td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">{row.qtd}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {cupomCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-300">{formatNumber(itensPerCupom)}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-300">{formatNumber(ticketMedio)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600">
        <span className="text-sm text-slate-500 dark:text-slate-300">
          Mostrando <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span> a <span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + ITEMS_PER_PAGE, data.length)}</span> de <span className="font-semibold text-slate-900 dark:text-white">{data.length}</span> resultados
        </span>
        <div className="inline-flex space-x-2">
          <button 
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;