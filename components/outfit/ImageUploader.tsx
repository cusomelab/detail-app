import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon } from './icons/UploadIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ImageUploaderProps {
  onImagesUpload: (files: File[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesUpload }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImagesUpload(acceptedFiles);
      
      // Clean up previous previews
      previews.forEach(URL.revokeObjectURL);

      const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
      setCurrentIndex(0);
    }
  }, [onImagesUpload, previews]);

  useEffect(() => {
    // Cleanup object URLs on unmount
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: true,
  } as any);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? previews.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === previews.length - 1 ? 0 : prev + 1));
  };


  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300 relative
      ${isDragActive ? 'border-cyan-400 bg-slate-800' : 'border-slate-600 hover:border-cyan-500'}`}
    >
      <input {...getInputProps()} />
      {previews.length > 0 ? (
        <div className="relative flex items-center justify-center">
            <img src={previews[currentIndex]} alt={`Preview ${currentIndex + 1}`} className="max-h-48 mx-auto rounded-md" />
            {previews.length > 1 && (
            <>
                <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-slate-800/50 rounded-full text-gray-200 hover:bg-slate-700 transition-all"
                aria-label="이전 미리보기"
                >
                <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-slate-800/50 rounded-full text-gray-200 hover:bg-slate-700 transition-all"
                aria-label="다음 미리보기"
                >
                <ChevronRightIcon className="w-6 h-6" />
                </button>
            </>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <UploadIcon className="w-12 h-12 mb-4" />
          {isDragActive ? (
            <p>여기에 이미지를 드롭하세요</p>
          ) : (
            <p>이미지를 드래그 앤 드롭하거나 클릭하여 파일을 선택하세요</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;