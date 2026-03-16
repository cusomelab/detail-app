import React, { useState, useEffect, useRef } from 'react';
import { ScissorsIcon, XMarkIcon, CheckIcon, PaintBrushIcon, SparklesIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

// ══════════════════════════════════════════════
// ImageCropper - 이미지 자르기 모달
// ══════════════════════════════════════════════
export const ImageCropper: React.FC<{ imageUrl: string; onCrop: (url: string) => void; onCancel: () => void }> = ({ imageUrl, onCrop, onCancel }) => {
    const imageRef = useRef<HTMLElement>(null);
    const cropperRef = useRef<any>(null);
    useEffect(() => {
        if (imageRef.current && (window as any).Cropper) {
            cropperRef.current = new (window as any).Cropper(imageRef.current, { viewMode: 1, dragMode: 'move', autoCropArea: 1, restore: false, guides: true, center: true, highlight: false, cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false, minContainerWidth: 300, minContainerHeight: 300, checkCrossOrigin: false });
        }
        return () => { cropperRef.current?.destroy(); };
    }, [imageUrl]);
    const handleCrop = () => { const c = cropperRef.current?.getCroppedCanvas(); if (c) onCrop(c.toDataURL()); };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-5xl flex flex-col h-[80vh] z-[110]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><ScissorsIcon className="w-5 h-5" /> 이미지 자르기</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full"><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <div className="flex-1 bg-gray-900 relative flex items-center justify-center overflow-hidden">
                    <img ref={imageRef as any} src={imageUrl} alt="Crop" className="block max-w-full max-h-full" crossOrigin="anonymous" />
                </div>
                <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">취소</button>
                    <button onClick={handleCrop} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg flex items-center gap-2"><CheckIcon className="w-5 h-5" /> 자르기 완료</button>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// MaskEditor - 브러시 지우개
// ══════════════════════════════════════════════
export const MaskEditor: React.FC<{ imageUrl: string; onSave: (f: File) => void; onCancel: () => void }> = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);

    useEffect(() => {
        const c = canvasRef.current, ct = containerRef.current;
        if (!c || !ct) return;
        const img = new Image(); img.crossOrigin = "anonymous"; img.src = imageUrl;
        img.onload = () => {
            const s = Math.min(ct.clientWidth / img.width, ct.clientHeight / img.height);
            c.width = img.width * s; c.height = img.height * s;
            const ctx = c.getContext('2d');
            if (ctx) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = brushSize; }
        };
    }, [imageUrl]);
    useEffect(() => { const ctx = canvasRef.current?.getContext('2d'); if (ctx) ctx.lineWidth = brushSize; }, [brushSize]);

    const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => { const r = canvasRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => { const ctx = canvasRef.current?.getContext('2d'); if (ctx) { const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); setIsDrawing(true); } };
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => { if (!isDrawing) return; const ctx = canvasRef.current?.getContext('2d'); if (ctx) { const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); } };
    const stopDrawing = () => { setIsDrawing(false); canvasRef.current?.getContext('2d')?.closePath(); };
    const handleSave = () => {
        const c = canvasRef.current; if (!c) return;
        const mc = document.createElement('canvas'); mc.width = c.width; mc.height = c.height; const mctx = mc.getContext('2d')!;
        mctx.fillStyle = '#000000'; mctx.fillRect(0, 0, mc.width, mc.height); mctx.drawImage(c, 0, 0);
        const id = mctx.getImageData(0, 0, mc.width, mc.height), d = id.data;
        for (let i = 0; i < d.length; i += 4) { if (d[i] > 0 || d[i+1] > 0 || d[i+2] > 0) { d[i] = d[i+1] = d[i+2] = d[i+3] = 255; } }
        mctx.putImageData(id, 0, 0);
        mc.toBlob(b => { if (b) onSave(new File([b], "mask.png", { type: "image/png" })); });
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-gray-900 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2"><PaintBrushIcon className="w-5 h-5" /> 지울 영역 선택</h3>
                    <button onClick={onCancel}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </div>
                <div ref={containerRef} className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden cursor-crosshair">
                    <img src={imageUrl} alt="" className="absolute max-w-full max-h-full object-contain pointer-events-none" crossOrigin="anonymous" />
                    <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="absolute" />
                </div>
                <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-4"><span className="text-gray-400 text-sm">브러쉬</span><input type="range" min="10" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-40" /></div>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">취소</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 flex items-center gap-2"><CheckIcon className="w-5 h-5" /> 지우기 실행</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// CustomPromptModal - 직접 입력 모달
// ══════════════════════════════════════════════
export const CustomPromptModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (p: string) => void }> = ({ isOpen, onClose, onSubmit }) => {
    const [prompt, setPrompt] = useState("");
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2"><ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-indigo-600" /> 직접 입력 (프롬프트)</h3>
                <p className="text-sm text-gray-500 mb-4">원하는 편집 내용을 AI에게 구체적으로 명령하세요.</p>
                <textarea className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none mb-4 text-gray-800" placeholder="편집 요청 사항 입력..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">취소</button>
                    <button onClick={() => { if (prompt.trim()) onSubmit(prompt); setPrompt(""); }} disabled={!prompt.trim()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> 생성하기</button>
                </div>
            </div>
        </div>
    );
};
