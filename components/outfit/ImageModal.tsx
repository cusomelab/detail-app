import React, { useState, useEffect, useCallback } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface ImageModalProps {
  images: string[];
  sourceImages: File[];
  currentIndex: number;
  onClose: () => void;
  onRegenerate: (index: number, customPrompt: string | null) => void;
  onRegeneratePose: (index: number, customPrompt: string | null) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
    images, sourceImages, currentIndex: initialIndex, onClose, onRegenerate, onRegeneratePose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [customPrompt, setCustomPrompt] = useState('');

  const goToPrevious = useCallback(() => {
    const isFirst = currentIndex === 0;
    const newIndex = isFirst ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setCustomPrompt(''); // Reset prompt on change
  }, [currentIndex, images.length]);

  const goToNext = useCallback(() => {
    const isLast = currentIndex === images.length - 1;
    const newIndex = isLast ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setCustomPrompt(''); // Reset prompt on change
  }, [currentIndex, images.length]);

  const handleDownload = () => {
    const sourceFile = sourceImages[currentIndex];
    const fileName = sourceFile 
        ? sourceFile.name.replace(/\.[^/.]+$/, "") + ".jpg" 
        : `ai-styled-image-${Date.now()}.jpg`;

    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerateClick = () => {
      onRegenerate(currentIndex, customPrompt);
      onClose();
  };

  const handleRegeneratePoseClick = () => {
      onRegeneratePose(currentIndex, customPrompt);
      onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevious, goToNext, onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 p-4 relative max-w-5xl w-full max-h-[95vh] flex gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image Viewer */}
        <div className="flex-1 flex flex-col min-h-0">
             <div className="flex-shrink-0 flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-200">
                    이미지 {currentIndex + 1} / {images.length}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>다운로드</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:bg-slate-800 hover:text-gray-200 transition-colors"
                        aria-label="모달 닫기"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-grow flex justify-center items-center overflow-hidden relative bg-black/40 rounded-lg">
                 {images.length > 1 && (
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                )}
                <img src={images[currentIndex]} alt={`View ${currentIndex}`} className="max-w-full max-h-full object-contain" />
                {images.length > 1 && (
                    <button
                        onClick={goToNext}
                        className="absolute right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>

        {/* Right: Controls */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h4 className="text-md font-semibold text-white mb-3">추가 요청사항 (선택)</h4>
            <textarea 
                className="w-full h-32 bg-slate-900 border border-slate-600 rounded-md p-3 text-sm text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none mb-4"
                placeholder="예: 웃는 표정으로 해줘, 배경을 좀 더 밝게 해줘, 머리카락을 귀 뒤로 넘겨줘..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
            />
            
            <div className="flex flex-col gap-3 mt-auto">
                <button
                    onClick={handleRegenerateClick}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg font-medium transition-all shadow-lg"
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span>이대로 다시 생성하기</span>
                </button>
                 <button
                    onClick={handleRegeneratePoseClick}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                >
                    <RefreshIcon className="w-5 h-5" />
                    <span>포즈만 변경하기</span>
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
                위 요청사항을 반영하여 이미지를 새로 생성합니다.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;