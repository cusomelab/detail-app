import React, { ReactNode } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onToggle }) => {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-200 hover:bg-slate-700/50 transition-colors"
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="p-4 border-t border-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AccordionItem;