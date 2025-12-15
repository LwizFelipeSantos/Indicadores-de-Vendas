import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: string;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => {
  // If no specific color class is passed, use the default responsive background
  const finalClass = colorClass || "bg-white dark:bg-slate-800 border-l-4 border-transparent";

  return (
    <div className={`${finalClass} p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
      </div>
    </div>
  );
};

export default StatCard;