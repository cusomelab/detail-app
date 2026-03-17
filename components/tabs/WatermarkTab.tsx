import React, { useState, useCallback } from 'react';
import { processProductImage } from '../../services/geminiService';
import { PhotoIcon, SparklesIcon, ArrowDownTrayIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
}

export const WatermarkTab: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: ImageItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        id: `wm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        originalUrl: URL.createObjectURL(f),
        status: 'idle' as const,
      }));
    setImages(prev => [...prev, ...newItems]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const processOne = async (item: ImageItem): Promise<ImageItem> => {
    try {
      const resultUrl = await processProductImage(item.file, 'REMOVE_TEXT');
      return { ...item, processedUrl: resultUrl, status: 'done' };
    } catch (err: any) {
      return { ...item, status: 'error', error: err?.message || '처리 실패' };
    }
  };

  const handleProcessAll = async () => {
    if (images.length === 0) return;
    setIsProcessingAll(true);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.status === 'done') continue;

      setImages(prev => prev.map(item => item.id === img.id ? { ...item, status: 'processing' } : item));

      const result = await processOne(img);
      setImages(prev => prev.map(item => item.id === img.id ? result : item));
    }

    setIsProcessingAll(false);
  };

  const handleProcessSingle = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img) return;

    setImages(prev => prev.map(item => item.id === id ? { ...item, status: 'processing' } : item));
    const result = await processOne(img);
    setImages(prev => prev.map(item => item.id === id ? result : item));
  };

  const handleDownloadAll = () => {
    images.filter(img => img.processedUrl).forEach((img, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = img.processedUrl!;
        a.download = `cleaned_${idx + 1}.png`;
        a.click();
      }, idx * 300);
    });
  };

  const handleDownloadSingle = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const doneCount = images.filter(i => i.status === 'done').length;
  const totalCount = images.length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">워터마크 / 중국어 일괄 제거</h2>
        <p className="text-gray-500 text-sm">여러 장의 이미지에서 워터마크와 외국어 텍스트를 AI로 한번에 제거합니다</p>
      </div>

      {/* 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors mb-6 ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-bold mb-2">이미지를 드래그하여 놓거나</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-md text-sm transition-colors">
          <PhotoIcon className="w-4 h-4" /> 파일 선택
          <input type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
        </label>
        <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP 지원 · 여러 장 동시 업로드 가능</p>
      </div>

      {/* 액션 버튼 */}
      {images.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500">
            총 <span className="font-bold text-gray-800">{totalCount}</span>장
            {doneCount > 0 && <span className="ml-2 text-green-600 font-bold">· {doneCount}장 완료</span>}
          </div>
          <div className="flex gap-2">
            {doneCount > 0 && (
              <button onClick={handleDownloadAll} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">
                <ArrowDownTrayIcon className="w-4 h-4" /> 전체 다운로드
              </button>
            )}
            <button onClick={handleProcessAll} disabled={isProcessingAll || totalCount === 0}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50">
              {isProcessingAll ? <span className="animate-pulse">처리 중...</span> : <><SparklesIcon className="w-4 h-4" /> 일괄 제거 시작</>}
            </button>
          </div>
        </div>
      )}

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map(img => (
          <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="relative aspect-square bg-gray-100">
              <img src={img.processedUrl || img.originalUrl} alt="" className="w-full h-full object-contain" />
              {img.status === 'processing' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-white text-sm font-bold animate-pulse flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI 처리 중...
                  </div>
                </div>
              )}
              {img.status === 'done' && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">완료</div>
              )}
              {img.status === 'error' && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">실패</div>
              )}
              <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow text-gray-500 hover:text-red-500">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 truncate max-w-[120px]">{img.file.name}</span>
              <div className="flex gap-1">
                {img.status !== 'processing' && img.status !== 'done' && (
                  <button onClick={() => handleProcessSingle(img.id)} className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold">
                    <SparklesIcon className="w-3.5 h-3.5 inline mr-0.5" />제거
                  </button>
                )}
                {img.processedUrl && (
                  <button onClick={() => handleDownloadSingle(img.processedUrl!, `cleaned_${img.file.name}`)} className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-bold">
                    <ArrowDownTrayIcon className="w-3.5 h-3.5 inline mr-0.5" />저장
                  </button>
                )}
                {img.status === 'error' && (
                  <button onClick={() => handleProcessSingle(img.id)} className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold">재시도</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
