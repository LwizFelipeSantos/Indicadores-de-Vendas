import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
  val: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: (string | Option)[]; // Accepts array of strings or Option objects
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to standard format {val, label}
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { val: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    return normalizedOptions.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [normalizedOptions, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    const newSelected = selected.includes(val)
      ? selected.filter(s => s !== val)
      : [...selected, val];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.length === filteredOptions.length && filteredOptions.length > 0) {
      // If all visible are selected, clear all
      onChange([]);
    } else {
      // Select all visible
      const allVisible = filteredOptions.map(o => o.val);
      // Merge with existing selected that might be hidden by search
      const combined = Array.from(new Set([...selected, ...allVisible]));
      onChange(combined);
    }
  };

  // Determine button text
  const buttonText = selected.length === 0 
    ? `Selecionar ${label}...` 
    : selected.length === 1 
      ? normalizedOptions.find(o => o.val === selected[0])?.label || selected[0]
      : `${selected.length} selecionados`;

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Label above input */}
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">
        {label}
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 
          text-left px-3 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all
          flex justify-between items-center h-10
          ${isOpen ? 'ring-2 ring-primary/50 border-primary' : ''}
        `}
      >
        <span className={`block truncate ${selected.length === 0 ? 'text-slate-400' : 'text-slate-800 dark:text-white font-medium'}`}>
          {buttonText}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="relative">
              <svg className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={`Buscar ${label}...`}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:border-primary text-slate-800 dark:text-white placeholder-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            {normalizedOptions.length > 0 && (
              <button 
                onClick={handleSelectAll}
                className="text-xs text-primary font-medium mt-2 px-1 hover:underline"
              >
                {selected.length === filteredOptions.length && filteredOptions.length > 0 ? 'Limpar seleção' : 'Selecionar todos visíveis'}
              </button>
            )}
          </div>

          {/* Options List */}
          <ul className="max-h-60 overflow-y-auto custom-scroll py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 text-center">Nenhuma opção encontrada.</li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt.val);
                return (
                  <li 
                    key={opt.val}
                    onClick={() => toggleOption(opt.val)}
                    className={`
                      px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-200' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700'}
                    `}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1 truncate">{opt.label}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;