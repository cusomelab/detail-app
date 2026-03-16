import React, { useState } from 'react';
import { StudioScene, ImageItem } from '../../types/imageGen';
import { generateReimaginedImage } from '../../services/imageGenService';

const SCENE_LABELS: Record<StudioScene, string> = {
  [StudioScene.MINIMALIST]: '🤍 미니멀 대리석',
  [StudioScene.LIFESTYLE_KITCHEN]: '🍳 모던 주방',
  [StudioScene.LIFESTYLE_LIVING]: '🛋️ 포근한 거실',
  [StudioScene.PROFESSIONAL_STUDIO]: '📸 전문 스튜디오',
  [StudioScene.NATURE_OUTDOOR]: '🌿 자연광 야외',
  [StudioScene.DARK_LUXURY]: '✨ 다크 럭셔리',
};

export const ImageGenTab: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalScene, setGlobalScene] = useState<StudioScene>(StudioScene.MINIMALIST);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; fileName: string } | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const data = e.target?.result as string;
        setImages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          sourceUrl: data,
          originalFileName: file.name,
          mimeType: file.type,
          status: 'idle',
          selectedScene: globalScene,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const processImage = async (id: string) => {
    const item = images.find(i => i.id === id);
    if (!item || item.status === 'processing') return;
    setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'processing', error: undefined } : i));
    try {
      const b64 = item.sourceUrl.split(',')[1];
      const resultUrl = await generateReimaginedImage(b64, item.mimeType, item.selectedScene, item.feedback);
      setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'done', resultUrl } : i));
    } catch (err: any) {
      setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: err.message } : i));
    }
  };

  const processAll = () => images.forEach(i => { if (i.status !== 'processing') processImage(i.id); });

  const download = (url: string, name: string) => {
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">🖼️ 대표이미지 생성</h2>
        <p className="text-gray-500 text-sm">제품 사진을 업로드하면 원하는 배경/연출로 자동 변환해드려요</p>
      </div>

      {/* 배경 선택 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">배경 스타일 선택</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SCENE_LABELS).map(([scene, label]) => (
            <button key={scene} onClick={() => setGlobalScene(scene as StudioScene)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                globalScene === scene
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 업로드 + 생성 버튼 */}
      <div className="flex gap-3 mb-6">
        <label className="flex items-center gap-2 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 px-5 py-3 rounded-xl font-bold cursor-pointer hover:bg-indigo-50 transition-all text-sm">
          ➕ 사진 추가
          <input type="file" multiple className="hidden" accept="image/*"
            onChange={e => handleFiles(e.target.files)} />
        </label>
        <button onClick={processAll} disabled={images.length === 0}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all text-sm">
          ✨ 전체 생성
        </button>
        {images.some(i => i.status === 'done') && (
          <button onClick={() => images.filter(i => i.resultUrl).forEach((i, idx) => setTimeout(() => download(i.resultUrl!, i.originalFileName), idx * 200))}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all text-sm">
            ⬇️ 전체 다운로드
          </button>
        )}
        {images.length > 0 && (
          <button onClick={() => setImages([])}
            className="px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all text-sm border border-red-100">
            🗑️ 전체 삭제
          </button>
        )}
      </div>

      {/* 이미지 그리드 */}
      {images.length === 0 ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-16 flex flex-col items-center justify-center gap-4 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-all cursor-pointer"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-2xl">📸</div>
          <div className="text-center">
            <p className="font-bold text-gray-700">여기에 이미지를 드래그하거나 클릭해서 업로드</p>
            <p className="text-sm text-gray-400 mt-1">생활잡화 제품이 잘 보이는 사진일수록 결과가 좋아요</p>
          </div>
          <label className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-indigo-700">
            파일 선택
            <input type="file" multiple className="hidden" accept="image/*" onChange={e => handleFiles(e.target.files)} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {images.map(img => (
            <div key={img.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* 이미지 영역 */}
              <div className="relative aspect-square bg-gray-50">
                {img.status === 'processing' && (
                  <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm font-bold text-gray-700">생성 중...</p>
                  </div>
                )}
                {img.resultUrl ? (
                  <img src={img.resultUrl} alt="결과" className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomedImage({ url: img.resultUrl!, fileName: img.originalFileName })} />
                ) : (
                  <img src={img.sourceUrl} alt="원본" className="w-full h-full object-cover opacity-60" />
                )}
                {/* 배경 선택 */}
                <div className="absolute bottom-2 left-2 right-2">
                  <select
                    value={img.selectedScene}
                    onChange={e => setImages(prev => prev.map(i => i.id === img.id ? { ...i, selectedScene: e.target.value as StudioScene } : i))}
                    className="w-full text-xs bg-white/90 backdrop-blur border border-gray-200 rounded-lg px-2 py-1.5 font-bold text-gray-700 outline-none"
                  >
                    {Object.entries(SCENE_LABELS).map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                  </select>
                </div>
              </div>
              {/* 피드백 + 버튼 */}
              <div className="p-4">
                <input
                  value={img.feedback || ''}
                  onChange={e => setImages(prev => prev.map(i => i.id === img.id ? { ...i, feedback: e.target.value } : i))}
                  placeholder="추가 요청사항 (예: 배경 더 밝게, 그림자 제거)"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {img.error && <p className="text-xs text-red-500 mb-2">{img.error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => processImage(img.id)} disabled={img.status === 'processing'}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all">
                    {img.status === 'done' ? '🔄 재생성' : '✨ 생성'}
                  </button>
                  {img.resultUrl && (
                    <button onClick={() => download(img.resultUrl!, img.originalFileName)}
                      className="px-3 py-2 bg-gray-900 text-white rounded-lg font-bold text-xs hover:bg-gray-800">
                      ⬇️
                    </button>
                  )}
                  <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs border border-red-100">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 줌 모달 */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={zoomedImage.url} alt="" className="w-full rounded-2xl" />
            <div className="flex gap-2 mt-4 justify-center">
              <button onClick={() => download(zoomedImage.url, zoomedImage.fileName)}
                className="px-6 py-2 bg-white text-gray-900 rounded-xl font-bold text-sm">⬇️ 다운로드</button>
              <button onClick={() => setZoomedImage(null)}
                className="px-6 py-2 bg-gray-700 text-white rounded-xl font-bold text-sm">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
