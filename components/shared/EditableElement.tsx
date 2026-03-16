import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { regenerateCopy } from '../../services/geminiService';
import { Toolbar, TextStyle } from './Toolbar';

export type { TextStyle };

// ── MagicRewriter (AI 텍스트 다듬기 버튼) ──
const MagicRewriter = ({ text, onUpdate, label, className = "top-0 right-0" }: { text: string; onUpdate: (t: string) => void; label: string; className?: string }) => {
    const [loading, setLoading] = useState(false);
    const handleRewrite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!text) return;
        setLoading(true);
        try { const t = await regenerateCopy(text, label); onUpdate(t); }
        catch { alert("텍스트 생성에 실패했습니다."); }
        finally { setLoading(false); }
    };
    return (
        <button onClick={handleRewrite} disabled={loading} className={`absolute z-20 p-2 bg-white text-indigo-600 rounded-full shadow-md border border-indigo-200 transition-all hover:bg-indigo-50 hover:scale-110 hover:border-indigo-400 ${className}`} title="AI로 문구 다듬기" onMouseDown={(e) => e.stopPropagation()}>
            {loading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <div className="flex items-center gap-1"><SparklesIcon className="w-4 h-4" /><span className="text-[10px] font-bold whitespace-nowrap hidden md:inline-block">AI 수정</span></div>}
        </button>
    );
};

// ── AutoResizeTextarea ──
export const AutoResizeTextarea: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; className?: string; readOnly?: boolean }> = ({ value, onChange, className, readOnly }) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => { if (ref.current) { ref.current.style.height = '0px'; ref.current.style.height = `${ref.current.scrollHeight + 10}px`; } }, [value, className]);
    useEffect(() => { const h = () => { if (ref.current) { ref.current.style.height = '0px'; ref.current.style.height = `${ref.current.scrollHeight + 10}px`; } }; window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
    return <textarea ref={ref} value={value} onChange={onChange} readOnly={readOnly} className={`w-full bg-transparent resize-none overflow-hidden outline-none leading-normal ${className}`} rows={1} />;
};

// ── EditableElement 메인 ──
interface Props {
    value: string;
    onChange: (val: string) => void;
    onDelete?: () => void;
    onStyleChange?: (style: TextStyle) => void;
    isEditMode: boolean;
    placeholder?: string;
    defaultStyle: TextStyle;
    allowStyleChange?: boolean;
    enableVerticalAlign?: boolean;
    enableDrag?: boolean;
    className?: string;
    aiLabel?: string;
    toolbarPosition?: 'default' | 'right';
}

export const EditableElement: React.FC<Props> = ({
    value, onChange, onDelete, onStyleChange, isEditMode, placeholder, defaultStyle,
    allowStyleChange = true, enableDrag = false, className = "", aiLabel, toolbarPosition = 'default'
}) => {
    const [style, setStyle] = useState<TextStyle>(defaultStyle);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
    const isStyleInitialized = useRef(false);

    useEffect(() => { if (!isStyleInitialized.current) { setStyle(defaultStyle); isStyleInitialized.current = true; } }, []);
    useEffect(() => { if (onStyleChange && isFocused) onStyleChange(style); }, [style, onStyleChange, isFocused]);
    useLayoutEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = '0px'; textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 10}px`; } }, [value, isEditMode, style, style.fontSize, style.fontWeight, style.fontFamily]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!enableDrag || !isEditMode || !containerRef.current || isFocused) return;
        e.preventDefault(); e.stopPropagation();
        dragRef.current = { isDragging: false, startX: e.clientX, startY: e.clientY, initialLeft: style.x || 50, initialTop: style.y || 50 };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current?.offsetParent) return;
        if (!dragRef.current.isDragging) { if (Math.hypot(e.clientX - dragRef.current.startX, e.clientY - dragRef.current.startY) > 5) dragRef.current.isDragging = true; }
        if (dragRef.current.isDragging) {
            const pr = containerRef.current.offsetParent.getBoundingClientRect();
            const pX = ((e.clientX - dragRef.current.startX) / pr.width) * 100;
            const pY = ((e.clientY - dragRef.current.startY) / pr.height) * 100;
            setStyle(prev => ({ ...prev, x: Math.max(0, Math.min(100, dragRef.current.initialLeft + pX)), y: Math.max(0, Math.min(100, dragRef.current.initialTop + pY)) }));
        }
    };
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (!dragRef.current.isDragging) { textareaRef.current?.focus(); setIsFocused(true); }
        dragRef.current.isDragging = false;
    };
    const handleBlur = (e: React.FocusEvent) => {
        if (toolbarRef.current?.contains(e.relatedTarget as Node)) return;
        if (onStyleChange) onStyleChange(style);
        setIsFocused(false);
    };
    const handleToolbarDragStart = (e: React.MouseEvent) => {
        if (!enableDrag || !isEditMode || !containerRef.current) return;
        e.preventDefault(); e.stopPropagation();
        dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialLeft: style.x || 50, initialTop: style.y || 50 };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const isHex = (v: string) => v.startsWith('#') || v.startsWith('rgb');
    const containerWidthClass = style.maxWidth || 'max-w-full';
    const colorClass = isHex(style.color) ? '' : style.color;
    const bgColorClass = (style.backgroundColor && !isHex(style.backgroundColor)) ? style.backgroundColor : '';
    const paddingClass = (style.backgroundColor || (style.backgroundColor && isHex(style.backgroundColor))) ? 'p-6 rounded-xl shadow-sm' : '';
    const inlineStyle: React.CSSProperties = { color: isHex(style.color) ? style.color : undefined, backgroundColor: style.backgroundColor && isHex(style.backgroundColor) ? style.backgroundColor : undefined };
    const positionStyle: React.CSSProperties = enableDrag ? { position: 'absolute', left: `${style.x ?? 50}%`, top: `${style.y ?? 50}%`, transform: 'translate(-50%, -50%)', zIndex: isFocused ? 40 : 20, minWidth: '200px', cursor: isFocused ? 'default' : 'move', ...inlineStyle } : { ...inlineStyle };

    if (!isEditMode) {
        if (!value) return null;
        const ps: React.CSSProperties = { ...inlineStyle, ...(enableDrag ? { position: 'absolute', left: `${style.x ?? 50}%`, top: `${style.y ?? 50}%`, transform: 'translate(-50%, -50%)', zIndex: 20 } : {}) };
        return (
            <div className={`w-full flex ${style.align === 'text-center' ? 'justify-center' : style.align === 'text-right' ? 'justify-end' : 'justify-start'}`} style={enableDrag ? ps : {}}>
                <div className={`${style.fontSize} ${style.fontFamily} ${colorClass} ${style.align} ${style.fontWeight} ${containerWidthClass} ${!enableDrag ? bgColorClass + ' ' + paddingClass : ''} ${className} whitespace-pre-wrap break-keep leading-normal`} style={{ ...(!enableDrag ? ps : {}), wordBreak: 'keep-all', overflowWrap: 'break-word' }}>{value}</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={positionStyle} onMouseDown={handleMouseDown} className={`relative group/edit transition-all flex ${!enableDrag ? 'w-full' : ''} ${style.align === 'text-center' ? 'justify-center' : style.align === 'text-right' ? 'justify-end' : 'justify-start'} ${isFocused ? 'z-40' : ''} ${enableDrag ? bgColorClass + ' ' + paddingClass : ''} ${enableDrag && !isFocused ? 'hover:outline hover:outline-2 hover:outline-indigo-400 hover:outline-dashed' : ''}`}>
            {allowStyleChange && isFocused && createPortal(<Toolbar ref={toolbarRef} style={style} setStyle={setStyle} onDelete={onDelete} enableDrag={enableDrag} handleDragStart={handleToolbarDragStart} />, document.body)}
            {aiLabel && <MagicRewriter text={value} label={aiLabel} onUpdate={onChange} className={`absolute -right-3 top-0 opacity-100 ${enableDrag ? '-right-8' : ''}`} />}
            <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={handleBlur} placeholder={placeholder} className={`bg-transparent border-0 p-2 resize-none overflow-hidden outline-none focus:ring-2 focus:ring-indigo-400/50 w-full ${style.fontSize} ${style.fontFamily} ${colorClass} ${style.align} ${style.fontWeight} ${containerWidthClass} ${!enableDrag ? bgColorClass + ' ' + paddingClass : ''} ${className} leading-normal ${isFocused ? 'cursor-text' : 'cursor-move'}`} style={{ ...(!enableDrag ? inlineStyle : {}), wordBreak: 'keep-all', overflowWrap: 'break-word' }} rows={1} spellCheck={false} onMouseDown={(e) => isFocused && e.stopPropagation()} />
        </div>
    );
};
