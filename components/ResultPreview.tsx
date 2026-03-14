import React, { useState, useRef, useCallback } from 'react';
import { GeneratedCopy, ProcessedImage, ProductCategory, ProductInfoDisclosure } from '../types';
import { processProductImage, regenerateCopy, ImageProcessMode } from '../services/geminiService';
import {
  ArrowDownTrayIcon, ArrowPathIcon, PhotoIcon, PlusIcon, SparklesIcon,
  TrashIcon, CheckIcon, PencilSquareIcon, XMarkIcon, ScissorsIcon,
  ChevronUpIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

interface ResultPreviewProps {
  copy: GeneratedCopy;
  images: ProcessedImage[];
  productName: string;
  category: ProductCategory;
  infoDisclosure?: ProductInfoDisclosure;
  onReset: () => void;
}

// ── 카테고리별 컬러 팔레트 ────────────────────────────
const PALETTE: Record<ProductCategory, {
  bg: string; accent: string; accentLight: string;
  text: string; subText: string; border: string;
  heroBg: string; sectionBg: string;
}> = {
  FASHION: {
    bg: '#faf8f5', accent: '#1a1a2e', accentLight: '#c9a96e',
    text: '#111111', subText: '#888888', border: '#e8e0d4',
    heroBg: 'linear-gradient(160deg,#1a1a2e 0%,#2d2d4e 100%)',
    sectionBg: '#f0ebe3',
  },
  LIVING: {
    bg: '#f8f6f0', accent: '#2d3b2d', accentLight: '#c8b97a',
    text: '#111111', subText: '#777777', border: '#ddd8c8',
    heroBg: 'linear-gradient(160deg,#2d3b2d 0%,#4a6741 100%)',
    sectionBg: '#ede8dc',
  },
  KITCHEN: {
    bg: '#f8f8f8', accent: '#1a1a1a', accentLight: '#888888',
    text: '#111111', subText: '#777777', border: '#e0e0e0',
    heroBg: 'linear-gradient(160deg,#1a1a1a 0%,#3d3d3d 100%)',
    sectionBg: '#efefef',
  },
  FOOD: {
    bg: '#fff9f0', accent: '#3d1f0d', accentLight: '#e07a30',
    text: '#111111', subText: '#888888', border: '#f0dcc8',
    heroBg: 'linear-gradient(160deg,#3d1f0d 0%,#7a3520 100%)',
    sectionBg: '#fef0d8',
  },
};

// ── 이미지 블록 ────────────────────────────────────────
interface ImageBlockProps {
  url: string | null;
  isEditMode: boolean;
  onUpload: (file: File) => void;
  onAiProcess: (mode: ImageProcessMode) => void;
  onDelete: () => void;
  isProcessing?: boolean;
  aspectRatio?: string;
  label?: string;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
  url, isEditMode, onUpload, onAiProcess, onDelete,
  isProcessing, aspectRatio = 'aspect-[3/4]', label = '이미지'
}) => {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`relative w-full ${aspectRatio} bg-gray-100 overflow-hidden group`}>
      {url ? (
        <>
          <img src={url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {isEditMode && !isProcessing && (
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <label className="bg-white/90 hover:bg-white p-2 rounded-lg cursor-pointer shadow-lg text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <ArrowPathIcon className="w-4 h-4" /> 교체
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
              </label>
              <div className="relative">
                <button onClick={() => setShowAiMenu(!showAiMenu)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg shadow-lg text-xs font-bold flex items-center gap-1.5 w-full">
                  <SparklesIcon className="w-4 h-4" /> AI 편집
                </button>
                {showAiMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 w-44 z-50">
                    {[
                      { mode: 'MAGIC_FIX' as ImageProcessMode, label: '✨ 워터마크 제거' },
                      { mode: 'MODEL_SWAP' as ImageProcessMode, label: '👗 모델 교체' },
                      { mode: 'BG_CHANGE' as ImageProcessMode, label: '🏞️ 배경 교체' },
                      { mode: 'REMOVE_TEXT' as ImageProcessMode, label: '🔤 텍스트 제거' },
                    ].map(item => (
                      <button key={item.mode}
                        onClick={() => { onAiProcess(item.mode); setShowAiMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 rounded-lg text-gray-700 hover:text-indigo-600">
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={onDelete}
                className="bg-white/90 hover:bg-red-50 text-red-500 p-2 rounded-lg shadow-lg text-xs font-bold flex items-center gap-1.5">
                <TrashIcon className="w-4 h-4" /> 삭제
              </button>
            </div>
          )}
        </>
      ) : (
        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors text-gray-400">
          <PhotoIcon className="w-12 h-12 mb-2" />
          <span className="text-sm font-medium">{label} 추가</span>
          <input type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      )}
    </div>
  );
};

// ── 편집 가능한 텍스트 ──────────────────────────────────
const EditableText: React.FC<{
  value: string; onChange: (v: string) => void;
  isEditMode: boolean; className?: string;
  style?: React.CSSProperties; multiline?: boolean;
  onRegenerate?: () => void; isRegenerating?: boolean;
}> = ({ value, onChange, isEditMode, className = '', style, multiline, onRegenerate, isRegenerating }) => {
  if (!isEditMode) {
    return multiline
      ? <p className={className} style={style}>{value.replace(/\\n/g, '\n')}</p>
      : <span className={className} style={style}>{value}</span>;
  }
  return (
    <div className="relative group/edit">
      {onRegenerate && (
        <button onClick={onRegenerate} disabled={isRegenerating}
          className="absolute -top-3 -right-3 z-20 bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/edit:opacity-100 transition-opacity">
          {isRegenerating
            ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
            : <SparklesIcon className="w-3.5 h-3.5" />}
        </button>
      )}
      <textarea
        value={value} onChange={e => onChange(e.target.value)} rows={multiline ? 3 : 1}
        className={`${className} w-full bg-transparent border-0 outline-none focus:ring-2 focus:ring-indigo-400/50 rounded resize-none`}
        style={style} />
    </div>
  );
};

// ════════════════════════════════════════════════════
// 메인 컴포넌트
// ════════════════════════════════════════════════════
export const ResultPreview: React.FC<ResultPreviewProps> = ({
  copy, images: initialImages, productName, category, infoDisclosure, onReset
}) => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editableCopy, setEditableCopy] = useState(copy);
  const [images, setImages] = useState<ProcessedImage[]>(initialImages);
  const [processingIdx, setProcessingIdx] = useState<number | null>(null);
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);

  // AI 이미지 생성 수
  const [aiImageCount, setAiImageCount] = useState(3);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const pal = PALETTE[category];
  const captureRef = useRef<HTMLDivElement>(null);

  const mainImage = images.find(i => i.type === 'main');
  const detailImages = images.filter(i => i.type === 'detail');
  const optionImages = images.filter(i => i.type === 'option');

  // ── 이미지 업로드 ────────────────────────────────
  const handleImageUpload = useCallback((idx: number, file: File) => {
    const url = URL.createObjectURL(file);
    setImages(prev => prev.map((img, i) => i === idx
      ? { ...img, processedUrl: url, originalUrl: url } : img));
  }, []);

  const handleAddImage = useCallback((type: 'detail' | 'option', file: File) => {
    const url = URL.createObjectURL(file);
    setImages(prev => [...prev, { originalUrl: url, processedUrl: url, type, status: 'done' }]);
  }, []);

  const handleDeleteImage = useCallback((idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── AI 이미지 처리 ────────────────────────────────
  const handleAiProcess = useCallback(async (idx: number, mode: ImageProcessMode) => {
    const img = images[idx];
    if (!img.processedUrl) return;
    setProcessingIdx(idx);
    try {
      const response = await fetch(img.processedUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });
      const newUrl = await processProductImage(file, mode);
      setImages(prev => prev.map((im, i) => i === idx ? { ...im, processedUrl: newUrl } : im));
    } catch (e) { alert('이미지 처리 실패'); }
    finally { setProcessingIdx(null); }
  }, [images]);

  // ── AI 이미지 자동 생성 ──────────────────────────
  const handleAutoGenerateImages = useCallback(async () => {
    if (!mainImage?.processedUrl) { alert('대표 이미지를 먼저 업로드해주세요'); return; }
    setIsGeneratingImages(true);
    const modes: ImageProcessMode[] = ['MAGIC_FIX', 'BG_CHANGE', 'MODEL_SWAP', 'REMOVE_TEXT'];
    const targetModes = modes.slice(0, Math.min(aiImageCount, modes.length));
    for (const mode of targetModes) {
      try {
        const response = await fetch(mainImage.processedUrl);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        const newUrl = await processProductImage(file, mode);
        setImages(prev => [...prev, { originalUrl: newUrl, processedUrl: newUrl, type: 'detail', status: 'done' }]);
      } catch (e) { console.error(mode, e); }
    }
    setIsGeneratingImages(false);
  }, [mainImage, aiImageCount]);

  // ── 카피 재생성 ───────────────────────────────────
  const handleRegenerate = useCallback(async (field: string, currentText: string) => {
    setRegeneratingField(field);
    try {
      const newText = await regenerateCopy(currentText, field);
      setEditableCopy(prev => {
        if (field === 'mainHook') return { ...prev, mainHook: newText };
        if (field === 'story') return { ...prev, story: newText };
        if (field === 'mdComment') return { ...prev, mdComment: newText };
        return prev;
      });
    } catch (e) { alert('재생성 실패'); }
    finally { setRegeneratingField(null); }
  }, []);

  // ── JPG 다운로드 ──────────────────────────────────
  const handleDownload = async () => {
    if (isEditMode) { alert('편집 완료 버튼을 누른 후 저장해주세요'); return; }
    setIsDownloading(true);
    await new Promise(r => setTimeout(r, 200));
    try {
      const el = document.getElementById('capture-area');
      if (!el) return;
      const h = el.scrollHeight;
      const scale = h > 8000 ? 1 : 1.5;
      const canvas = await (window as any).html2canvas(el, {
        scale, useCORS: true, backgroundColor: pal.bg,
        width: 860, height: h,
        onclone: (doc: any) => {
          const cloned = doc.getElementById('capture-area');
          if (cloned) { cloned.style.height = 'auto'; cloned.style.overflow = 'visible'; }
        }
      });
      const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/jpeg', 0.95));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${productName}_상세페이지.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { alert('저장 실패'); }
    finally { setIsDownloading(false); }
  };

  const imgIdx = (img: ProcessedImage) => images.indexOf(img);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 py-8">
      {/* ── 상단 컨트롤바 ─────────────────────────── */}
      <div className="w-full max-w-[900px] mb-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-wrap items-center gap-3 sticky top-4 z-50">
        <div className="flex items-center gap-2 flex-1">
          {isEditMode
            ? <span className="text-sm font-bold text-indigo-600 flex items-center gap-1.5"><PencilSquareIcon className="w-4 h-4" /> 편집 모드</span>
            : <span className="text-sm font-bold text-green-600 flex items-center gap-1.5"><CheckIcon className="w-4 h-4" /> 미리보기</span>
          }
        </div>

        {/* AI 이미지 자동 생성 */}
        {isEditMode && (
          <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
            <SparklesIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600">AI 이미지 자동생성</span>
            <select value={aiImageCount} onChange={e => setAiImageCount(+e.target.value)}
              className="text-xs border border-indigo-200 rounded-lg px-2 py-1 bg-white text-indigo-600 font-bold outline-none">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}장</option>)}
            </select>
            <button onClick={handleAutoGenerateImages} disabled={isGeneratingImages}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 flex items-center gap-1">
              {isGeneratingImages ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : null}
              {isGeneratingImages ? '생성중...' : '생성'}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onReset} className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">처음으로</button>
          {isEditMode
            ? <button onClick={() => setIsEditMode(false)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5" /> 편집 완료
              </button>
            : <>
                <button onClick={() => setIsEditMode(true)} className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <PencilSquareIcon className="w-3.5 h-3.5" /> 수정
                </button>
                <button onClick={handleDownload} disabled={isDownloading} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  {isDownloading ? '저장중...' : 'JPG 저장'}
                </button>
              </>
          }
        </div>
      </div>

      {/* ── 상세페이지 본문 ─────────────────────────── */}
      <div id="capture-area" ref={captureRef}
        className="w-full max-w-[860px] min-w-[860px] shadow-2xl"
        style={{ background: pal.bg, fontFamily: "'Noto Sans KR', sans-serif" }}>

        {/* ① HERO ─────────────────────────────────── */}
        <section className="relative w-full">
          {mainImage?.processedUrl ? (
            <div className="relative">
              <img src={mainImage.processedUrl} alt="" className="w-full h-auto block" crossOrigin="anonymous" />
              {/* 그라디언트 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${pal.accent}ee 0%, transparent 100%)` }} />
              {/* 뱃지 */}
              <div className="absolute top-8 left-8 flex flex-col gap-2">
                <div className="text-xs font-black tracking-[0.3em] uppercase px-4 py-2"
                  style={{ background: 'rgba(0,0,0,0.5)', color: pal.accentLight, backdropFilter: 'blur(8px)', borderLeft: `3px solid ${pal.accentLight}` }}>
                  NEW SEASON COLLECTION
                </div>
                <div className="text-xs font-black tracking-[0.2em] uppercase px-4 py-2"
                  style={{ background: `${pal.accentLight}cc`, color: '#fff' }}>
                  ✦ BEST SELLER
                </div>
              </div>
              {isEditMode && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <label className="bg-white/90 hover:bg-white p-2 rounded-lg cursor-pointer shadow-lg text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <ArrowPathIcon className="w-4 h-4" /> 교체
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && handleImageUpload(imgIdx(mainImage!), e.target.files[0])} />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[560px] flex flex-col items-center justify-center" style={{ background: pal.heroBg }}>
              <label className="flex flex-col items-center cursor-pointer">
                <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center mb-4" style={{ borderColor: pal.accentLight }}>
                  <PhotoIcon className="w-10 h-10" style={{ color: pal.accentLight }} />
                </div>
                <span className="text-lg font-bold mb-1" style={{ color: pal.accentLight }}>대표 이미지 업로드</span>
                <span className="text-sm opacity-60" style={{ color: pal.accentLight }}>클릭 또는 드래그</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      const url = URL.createObjectURL(e.target.files[0]);
                      setImages(prev => {
                        const existing = prev.find(i => i.type === 'main');
                        if (existing) return prev.map(i => i.type === 'main' ? {...i, processedUrl: url, originalUrl: url} : i);
                        return [...prev, { originalUrl: url, processedUrl: url, type: 'main', status: 'done' }];
                      });
                    }
                  }} />
              </label>
            </div>
          )}

          {/* 메인 카피 */}
          <div className="w-full px-16 py-20 text-center" style={{ background: pal.heroBg }}>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-16" style={{ background: pal.accentLight }}></div>
              <span className="text-xs font-black tracking-[0.4em] uppercase opacity-70" style={{ color: pal.accentLight }}>이번 시즌 주목 아이템</span>
              <div className="h-px w-16" style={{ background: pal.accentLight }}></div>
            </div>
            <EditableText
              value={editableCopy.mainHook} onChange={v => setEditableCopy(p => ({...p, mainHook: v}))}
              isEditMode={isEditMode} multiline
              onRegenerate={() => handleRegenerate('mainHook', editableCopy.mainHook)}
              isRegenerating={regeneratingField === 'mainHook'}
              className="text-5xl font-black leading-tight whitespace-pre-line text-white mx-auto max-w-2xl"
              style={{ color: '#ffffff' }}
            />
            <div className="flex items-center justify-center gap-3 mt-10">
              <div className="w-2 h-2 rounded-full" style={{ background: pal.accentLight }}></div>
              <div className="w-10 h-px" style={{ background: pal.accentLight }}></div>
              <div className="w-2 h-2 rounded-full" style={{ background: pal.accentLight }}></div>
            </div>
          </div>
        </section>

        {/* ② STORY ────────────────────────────────── */}
        <section className="w-full px-16 py-24 text-center relative overflow-hidden" style={{ background: pal.sectionBg }}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
            style={{ background: pal.accentLight, transform: 'translate(30%,-30%)' }} />
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-10" style={{ background: pal.accent, opacity: 0.3 }}></div>
            <span className="text-xs font-black tracking-[0.4em] uppercase" style={{ color: pal.subText }}>MOOD & STORY</span>
            <div className="h-px w-10" style={{ background: pal.accent, opacity: 0.3 }}></div>
          </div>
          <div className="text-8xl leading-none mb-4 font-serif" style={{ color: `${pal.accentLight}40` }}>"</div>
          <EditableText
            value={editableCopy.story} onChange={v => setEditableCopy(p => ({...p, story: v}))}
            isEditMode={isEditMode} multiline
            onRegenerate={() => handleRegenerate('story', editableCopy.story)}
            isRegenerating={regeneratingField === 'story'}
            className="text-2xl leading-loose font-medium whitespace-pre-line mx-auto max-w-2xl"
            style={{ color: pal.text, fontFamily: 'Georgia, serif' }}
          />
          <div className="text-8xl leading-none mt-2 font-serif" style={{ color: `${pal.accentLight}40` }}>"</div>
        </section>

        {/* ③ 상세 이미지 + 텍스트 섹션들 ────────────── */}
        {detailImages.length > 0 && (
          <section className="w-full" style={{ background: pal.bg }}>
            {detailImages.map((img, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} w-full min-h-[480px]`}>
                {/* 이미지 */}
                <div className="w-1/2 relative overflow-hidden group">
                  <img src={img.processedUrl || img.originalUrl} alt=""
                    className="w-full h-full object-cover" crossOrigin="anonymous" />
                  {processingIdx === imgIdx(img) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {isEditMode && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="bg-white/90 p-2 rounded-lg cursor-pointer shadow text-xs font-bold text-gray-700 flex items-center gap-1">
                        <ArrowPathIcon className="w-3.5 h-3.5" /> 교체
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && handleImageUpload(imgIdx(img), e.target.files[0])} />
                      </label>
                      <button onClick={() => handleAiProcess(imgIdx(img), 'MAGIC_FIX')}
                        className="bg-indigo-600 text-white p-2 rounded-lg shadow text-xs font-bold flex items-center gap-1">
                        <SparklesIcon className="w-3.5 h-3.5" /> AI 보정
                      </button>
                      <button onClick={() => handleDeleteImage(imgIdx(img))}
                        className="bg-white/90 text-red-500 p-2 rounded-lg shadow text-xs font-bold flex items-center gap-1">
                        <TrashIcon className="w-3.5 h-3.5" /> 삭제
                      </button>
                    </div>
                  )}
                </div>
                {/* 텍스트 */}
                <div className="w-1/2 flex flex-col justify-center px-14 py-12" style={{ background: i % 2 === 0 ? pal.bg : pal.sectionBg }}>
                  {editableCopy.sellingPoints[i] && (
                    <>
                      <div className="text-6xl font-black mb-6 opacity-15" style={{ color: pal.accentLight }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="w-10 h-1 rounded-full mb-6" style={{ background: pal.accentLight }}></div>
                      <EditableText
                        value={editableCopy.sellingPoints[i].title}
                        onChange={v => setEditableCopy(p => ({
                          ...p, sellingPoints: p.sellingPoints.map((sp, si) => si === i ? {...sp, title: v} : sp)
                        }))}
                        isEditMode={isEditMode}
                        className="text-3xl font-black mb-4 leading-tight"
                        style={{ color: pal.text }}
                      />
                      <EditableText
                        value={editableCopy.sellingPoints[i].description}
                        onChange={v => setEditableCopy(p => ({
                          ...p, sellingPoints: p.sellingPoints.map((sp, si) => si === i ? {...sp, description: v} : sp)
                        }))}
                        isEditMode={isEditMode} multiline
                        className="text-base leading-loose whitespace-pre-line"
                        style={{ color: pal.subText }}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 이미지 없을 때 셀링포인트 카드 */}
        {detailImages.length === 0 && (
          <section className="w-full py-24 px-10" style={{ background: pal.bg }}>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px w-10" style={{ background: pal.accent, opacity: 0.2 }}></div>
                <span className="text-xs font-black tracking-[0.4em] uppercase" style={{ color: pal.subText }}>WHY THIS ITEM</span>
                <div className="h-px w-10" style={{ background: pal.accent, opacity: 0.2 }}></div>
              </div>
              <h2 className="text-4xl font-black" style={{ color: pal.text }}>왜 이 상품인가요?</h2>
            </div>
            <div className="space-y-8">
              {editableCopy.sellingPoints.map((sp, i) => (
                <div key={i} className="flex items-start gap-8 p-8 rounded-2xl" style={{ background: pal.sectionBg }}>
                  <div className="text-5xl font-black shrink-0 opacity-20" style={{ color: pal.accentLight }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <div className="w-8 h-1 rounded-full mb-4" style={{ background: pal.accentLight }}></div>
                    <EditableText
                      value={sp.title} onChange={v => setEditableCopy(p => ({
                        ...p, sellingPoints: p.sellingPoints.map((s, si) => si === i ? {...s, title: v} : s)
                      }))}
                      isEditMode={isEditMode}
                      className="text-2xl font-black mb-3" style={{ color: pal.text }}
                    />
                    <EditableText
                      value={sp.description} onChange={v => setEditableCopy(p => ({
                        ...p, sellingPoints: p.sellingPoints.map((s, si) => si === i ? {...s, description: v} : s)
                      }))}
                      isEditMode={isEditMode} multiline
                      className="text-sm leading-loose whitespace-pre-line" style={{ color: pal.subText }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* 상세 이미지 추가 버튼 */}
            {isEditMode && (
              <label className="mt-8 flex items-center justify-center gap-2 py-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-sm font-bold"
                style={{ borderColor: `${pal.accentLight}60`, color: pal.subText }}>
                <PhotoIcon className="w-5 h-5" /> 상세 이미지 추가 (추가 시 지그재그 레이아웃으로 변경)
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e => Array.from(e.target.files || []).forEach(f => handleAddImage('detail', f))} />
              </label>
            )}
          </section>
        )}

        {/* ④ MD 코멘트 ──────────────────────────────── */}
        <section className="w-full px-16 py-20 text-center" style={{ background: pal.sectionBg }}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-8" style={{ background: pal.accent, opacity: 0.2 }}></div>
            <span className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: pal.subText }}>MD's Pick</span>
            <div className="h-px w-8" style={{ background: pal.accent, opacity: 0.2 }}></div>
          </div>
          <EditableText
            value={editableCopy.mdComment} onChange={v => setEditableCopy(p => ({...p, mdComment: v}))}
            isEditMode={isEditMode} multiline
            onRegenerate={() => handleRegenerate('mdComment', editableCopy.mdComment)}
            isRegenerating={regeneratingField === 'mdComment'}
            className="text-xl leading-loose whitespace-pre-line mx-auto max-w-2xl font-medium"
            style={{ color: pal.text, fontFamily: 'Georgia, serif' }}
          />
        </section>

        {/* ⑤ 옵션 이미지 ───────────────────────────── */}
        {(optionImages.length > 0 || isEditMode) && (
          <section className="w-full py-20 px-10" style={{ background: pal.bg }}>
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px w-10" style={{ background: pal.accent, opacity: 0.2 }}></div>
                <span className="text-xs font-black tracking-[0.4em] uppercase" style={{ color: pal.subText }}>COLORS & OPTIONS</span>
                <div className="h-px w-10" style={{ background: pal.accent, opacity: 0.2 }}></div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {optionImages.map((img, i) => (
                <div key={i} className="w-[180px] group relative">
                  <div className="w-full aspect-[3/4] overflow-hidden rounded-xl mb-2 relative">
                    <img src={img.processedUrl || img.originalUrl} alt=""
                      className="w-full h-full object-cover" crossOrigin="anonymous" />
                    {isEditMode && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="bg-white p-2 rounded-lg cursor-pointer">
                          <ArrowPathIcon className="w-4 h-4 text-gray-700" />
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => e.target.files?.[0] && handleImageUpload(imgIdx(img), e.target.files[0])} />
                        </label>
                        <button onClick={() => handleDeleteImage(imgIdx(img))} className="bg-white p-2 rounded-lg">
                          <TrashIcon className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center font-bold" style={{ color: pal.subText }}>옵션 {i + 1}</p>
                </div>
              ))}
              {isEditMode && (
                <label className="w-[180px] aspect-[3/4] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ borderColor: `${pal.accentLight}60` }}>
                  <PlusIcon className="w-8 h-8 mb-2" style={{ color: pal.subText }} />
                  <span className="text-xs font-bold" style={{ color: pal.subText }}>옵션 추가</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => Array.from(e.target.files || []).forEach(f => handleAddImage('option', f))} />
                </label>
              )}
            </div>
          </section>
        )}

        {/* ⑥ 체크포인트 ────────────────────────────── */}
        <section className="w-full px-16 py-16" style={{ background: pal.heroBg }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-8" style={{ background: pal.accentLight }}></div>
            <span className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: pal.accentLight }}>✦ CHECK POINT</span>
            <div className="h-px w-8" style={{ background: pal.accentLight }}></div>
          </div>
          <EditableText
            value={editableCopy.sizeTip} onChange={v => setEditableCopy(p => ({...p, sizeTip: v}))}
            isEditMode={isEditMode} multiline
            className="text-xl font-bold leading-loose whitespace-pre-line"
            style={{ color: '#ffffff' }}
          />
        </section>

        {/* ⑦ 상품 정보 ─────────────────────────────── */}
        <section className="w-full px-10 py-16" style={{ background: pal.bg }}>
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px flex-1" style={{ background: pal.accent, opacity: 0.15 }}></div>
            <span className="text-sm font-black uppercase tracking-[0.2em] px-6" style={{ color: pal.text }}>상품 정보</span>
            <div className="h-px flex-1" style={{ background: pal.accent, opacity: 0.15 }}></div>
          </div>
          <table className="w-full max-w-2xl mx-auto text-sm border-t-2" style={{ borderColor: pal.accent }}>
            <tbody>
              {[
                { label: '소재', value: editableCopy.productInfo.material },
                { label: '제조국', value: editableCopy.productInfo.origin },
                { label: '세탁/보관', value: editableCopy.productInfo.wash },
                ...(editableCopy.productInfo.caution ? [{ label: '주의사항', value: editableCopy.productInfo.caution }] : []),
              ].map((row, i) => (
                <tr key={i} className="border-b" style={{ borderColor: pal.border }}>
                  <th className="py-4 px-5 text-left text-xs font-bold w-24" style={{ color: pal.subText, background: `${pal.sectionBg}` }}>{row.label}</th>
                  <td className="py-4 px-5 text-xs" style={{ color: pal.text }}>
                    <EditableText value={row.value} onChange={v => setEditableCopy(p => ({
                      ...p, productInfo: { ...p.productInfo, [
                        row.label === '소재' ? 'material' : row.label === '제조국' ? 'origin' : row.label === '세탁/보관' ? 'wash' : 'caution'
                      ]: v }
                    }))} isEditMode={isEditMode} style={{ color: pal.text }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 정보고시 */}
          {infoDisclosure && (infoDisclosure.manufacturer || infoDisclosure.customerService) && (
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ background: pal.accent, opacity: 0.15 }}></div>
                <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: pal.subText }}>상품 정보고시</span>
                <div className="h-px flex-1" style={{ background: pal.accent, opacity: 0.15 }}></div>
              </div>
              <table className="w-full text-xs border" style={{ borderColor: pal.border }}>
                <tbody>
                  {[
                    { label: '제조자/수입자', value: infoDisclosure.manufacturer },
                    { label: '원산지', value: infoDisclosure.origin },
                    { label: '소재', value: infoDisclosure.material },
                    { label: '사이즈', value: infoDisclosure.size },
                    { label: '세탁방법', value: infoDisclosure.wash },
                    { label: '원재료', value: infoDisclosure.ingredients },
                    { label: '용량/중량', value: infoDisclosure.capacity },
                    { label: '유통기한', value: infoDisclosure.expiry },
                    { label: '보관방법', value: infoDisclosure.storage },
                    { label: '인증', value: infoDisclosure.haccp || infoDisclosure.certifications },
                    { label: '품질보증', value: infoDisclosure.warranty },
                    { label: '주의사항', value: infoDisclosure.caution },
                    { label: '고객센터', value: infoDisclosure.customerService },
                  ].filter(r => r.value).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : ''} style={{ background: i % 2 === 0 ? '#ffffff' : pal.sectionBg }}>
                      <th className="py-3 px-4 text-left font-bold w-28" style={{ color: pal.subText, borderRight: `1px solid ${pal.border}`, borderBottom: `1px solid ${pal.border}` }}>{row.label}</th>
                      <td className="py-3 px-4" style={{ color: pal.text, borderBottom: `1px solid ${pal.border}` }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 고지사항 */}
          <div className="mt-10 text-center space-y-1">
            {['본 제품은 모니터 해상도 상 실제 제품과 색상 차이가 있을 수 있습니다',
              '실측 사이즈는 재는 방식에 따라 약간의 오차가 발생할 수 있습니다',
              '본 제품은 14세 이상 사용 가능합니다'].map((t, i) => (
              <p key={i} className="text-xs" style={{ color: `${pal.subText}80` }}>{t}</p>
            ))}
          </div>

          {/* 브랜드 푸터 */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <div className="h-px w-20" style={{ background: pal.accent, opacity: 0.15 }}></div>
            <span className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: `${pal.subText}60` }}>MARKETPIA BEST OF BEST</span>
            <div className="h-px w-20" style={{ background: pal.accent, opacity: 0.15 }}></div>
          </div>
        </section>
      </div>
    </div>
  );
};
