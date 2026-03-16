import React from 'react';

interface OptionSelectorProps<T extends string> {
  label?: string;
  value: T;
  options: Record<string, T>;
  onChange: (value: T) => void;
}

const OptionSelector = <T extends string>({ label, value, options, onChange }: OptionSelectorProps<T>) => {
  const optionEntries = Object.entries(options) as [string, T][];

  // If there are few options, render as buttons. Otherwise, a select dropdown.
  const useButtons = optionEntries.length <= 8;

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      {useButtons ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {optionEntries.map(([key, optionValue]) => (
            <button
              key={optionValue}
              onClick={() => onChange(optionValue)}
              className={`px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500
                ${value === optionValue
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold'
                  : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                }`}
            >
              {key}
            </button>
          ))}
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {optionEntries.map(([key, optionValue]) => (
            <option key={optionValue} value={optionValue}>{key}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default OptionSelector;