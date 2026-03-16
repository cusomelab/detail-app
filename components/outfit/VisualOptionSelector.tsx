import React, { ReactNode } from 'react';

interface VisualOption<T extends string> {
  value: T;
  icon: ReactNode;
}

interface VisualOptionSelectorProps<T extends string> {
  value: T;
  options: Record<string, VisualOption<T>>;
  onChange: (value: T) => void;
}

const VisualOptionSelector = <T extends string>({ value, options, onChange }: VisualOptionSelectorProps<T>) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(options).map(([key, option]) => (
        <button
          key={key}
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-center justify-center p-3 rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500
            ${value === option.value
              ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold'
              : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
            }`}
        >
          {option.icon}
          <span className="mt-2 text-xs">{key}</span>
        </button>
      ))}
    </div>
  );
};

export default VisualOptionSelector;
