import React, { forwardRef } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { FONT_FAMILIES } from '../../presets/layoutPresets';

// ── 텍스트 스타일 타입 ──
export interface TextStyle {
    fontSize: 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-6xl';
    fontFamily: 'font-sans' | 'font-serif-kr' | 'font-dodum' | 'font-pen';
    color: string;
    backgroundColor?: string;
    align: 'text-left' | 'text-center' | 'text-right';
    verticalAlign?: 'justify-start' | 'justify-center' | 'justify-end';
    fontWeight: 'font-normal' | 'font-medium' | 'font-bold' | 'font-black';
    maxWidth?: 'max-w-full' | 'max-w-6xl' | 'max-w-4xl' | 'max-w-2xl' | 'max-w-xl';
    x?: number;
    y?: number;
}

interface ToolbarProps {
    style: TextStyle;
    setStyle: React.Dispatch<React.SetStateAction<TextStyle>>;
    onDelete?: () => void;
    enableDrag?: boolean;
    handleDragStart: (e: React.MouseEvent) => void;
}

const stopProp = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLSelectElement)) e.preventDefault();
    e.stopPropagation();
};

const colors = [
    { name: 'Black', value: 'text-gray-900' }, { name: 'Gray', value: 'text-gray-500' },
    { name: 'White', value: 'text-white' }, { name: 'Navy', value: 'text-indigo-900' },
    { name: 'Blue', value: 'text-blue-600' }, { name: 'Red', value: 'text-red-600' },
    { name: 'Green', value: 'text-emerald-600' },
];
const bgColors = [
    { name: 'None', value: '' }, { name: 'White', value: 'bg-white' },
    { name: 'Black', value: 'bg-gray-900' }, { name: 'Gray', value: 'bg-gray-100' },
    { name: 'Yellow', value: 'bg-yellow-50' }, { name: 'Blue', value: 'bg-blue-50' },
    { name: 'Pink', value: 'bg-pink-50' }, { name: 'Green', value: 'bg-emerald-50' },
];

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(({ style, setStyle, onDelete, enableDrag, handleDragStart }, ref) => {
    const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
    const handleFontSizeChange = (delta: number) => {
        const cur = sizes.indexOf(style.fontSize);
        const next = Math.min(Math.max(cur + delta, 0), sizes.length - 1);
        setStyle(prev => ({ ...prev, fontSize: sizes[next] as any }));
    };

    return (
        <div ref={ref} className="fixed top-24 z-[9999] bg-gray-900/95 backdrop-blur text-white p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[260px] animate-fade-in border border-gray-700 select-none" style={{ left: 'calc(50% + 440px)' }} onMouseDown={stopProp}>
            <div className="text-xs font-bold text-gray-400 mb-1 flex items-center justify-between">
                <span>텍스트 편집</span>
                <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">편집 중</span>
            </div>
            <div className="flex items-center gap-2 border-b border-gray-700 pb-3 w-full">
                <select value={style.fontFamily} onChange={(e) => setStyle(prev => ({...prev, fontFamily: e.target.value as any}))} className="bg-gray-800 text-xs text-white rounded p-1.5 border border-gray-600 outline-none w-28 cursor-pointer" onMouseDown={(e) => e.stopPropagation()}>
                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
                <button onMouseDown={stopProp} onClick={() => setStyle(prev => ({ ...prev, fontWeight: prev.fontWeight === 'font-bold' ? 'font-normal' : 'font-bold' }))} className={`p-1.5 w-7 h-7 rounded text-xs font-serif flex items-center justify-center ${style.fontWeight === 'font-bold' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>B</button>
                <div className="w-[1px] h-4 bg-gray-600" />
                <button onMouseDown={stopProp} onClick={() => handleFontSizeChange(-1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold w-7 h-7">A-</button>
                <button onMouseDown={stopProp} onClick={() => handleFontSizeChange(1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold w-7 h-7">A+</button>
            </div>
            <div className="flex items-center gap-2 border-b border-gray-700 pb-3 w-full justify-between">
                <div className="flex gap-1">
                    {(['text-left', 'text-center', 'text-right'] as const).map(a => (
                        <button key={a} onMouseDown={stopProp} onClick={() => setStyle(prev => ({ ...prev, align: a }))} className={`p-1.5 rounded text-[10px] w-7 h-7 ${style.align === a ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>{a === 'text-left' ? 'L' : a === 'text-center' ? 'C' : 'R'}</button>
                    ))}
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">텍스트 색상</span>
                    <label className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-white" onMouseDown={stopProp}>
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-blue-500 block" />커스텀
                        <input type="color" className="w-0 h-0 opacity-0" onChange={(e) => setStyle(prev => ({ ...prev, color: e.target.value }))} />
                    </label>
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
                    {colors.map(c => <button key={c.name} onMouseDown={stopProp} onClick={() => setStyle(prev => ({ ...prev, color: c.value }))} className={`w-6 h-6 rounded-full border border-gray-600 shrink-0 ${c.value.replace('text-', 'bg-')}`} title={c.name} />)}
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">배경 색상</span>
                    <label className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-white" onMouseDown={stopProp}>
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-black block" />커스텀
                        <input type="color" className="w-0 h-0 opacity-0" onChange={(e) => setStyle(prev => ({ ...prev, backgroundColor: e.target.value }))} />
                    </label>
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
                    {bgColors.map(c => <button key={c.name} onMouseDown={stopProp} onClick={() => setStyle(prev => ({ ...prev, backgroundColor: c.value }))} className={`w-6 h-6 rounded-full border border-gray-600 shrink-0 ${c.value.startsWith('bg-') ? c.value : 'bg-transparent text-red-400 text-[8px] flex items-center justify-center font-bold'}`} title={c.name}>{!c.value && 'X'}</button>)}
                </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-700 w-full">
                <button onMouseDown={stopProp} onClick={() => setStyle(prev => ({ ...prev, maxWidth: 'max-w-full' }))} className={`px-2 py-1 hover:bg-gray-700 rounded text-[10px] ${!style.maxWidth || style.maxWidth === 'max-w-full' ? 'text-green-400 font-bold' : ''}`}>100%</button>
                <button onMouseDown={stopProp} onClick={() => setStyle(prev => ({ ...prev, maxWidth: 'max-w-2xl' }))} className={`px-2 py-1 hover:bg-gray-700 rounded text-[10px] ${style.maxWidth === 'max-w-2xl' ? 'text-green-400 font-bold' : ''}`}>50%</button>
                <div className="flex-1" />
                {onDelete && <button onMouseDown={stopProp} onClick={onDelete} className="p-1.5 hover:bg-red-600 bg-red-500 rounded text-white flex items-center gap-1 text-xs"><TrashIcon className="w-3 h-3" /> 삭제</button>}
            </div>
        </div>
    );
});
