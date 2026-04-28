
import React, { useState, useEffect } from 'react';
import ImageUploader from '../outfit/ImageUploader';
import OptionSelector from '../outfit/OptionSelector';
import VisualOptionSelector from '../outfit/VisualOptionSelector';
import AccordionItem from '../outfit/AccordionItem';
import Spinner from '../outfit/Spinner';
import ImageModal from '../outfit/ImageModal';
import { SparklesIcon } from '../outfit/icons/SparklesIcon';
import { RefreshIcon } from '../outfit/icons/RefreshIcon';
import { PoseIcon } from '../outfit/icons/PoseIcon';
import { HatIcon } from '../outfit/icons/HatIcon';
import { RingIcon } from '../outfit/icons/RingIcon';
import { NecklaceIcon } from '../outfit/icons/NecklaceIcon';
import { BagIcon } from '../outfit/icons/BagIcon';
import { StudioIcon } from '../outfit/icons/StudioIcon';
import { CityIcon } from '../outfit/icons/CityIcon';
import { NatureIcon } from '../outfit/icons/NatureIcon';
import { CafeIcon } from '../outfit/icons/CafeIcon';
import { StandingIcon } from '../outfit/icons/StandingIcon';
import { SittingIcon } from '../outfit/icons/SittingIcon';
import { WalkingIcon } from '../outfit/icons/WalkingIcon';
import { ChevronLeftIcon } from '../outfit/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../outfit/icons/ChevronRightIcon';
import { DownloadIcon } from '../outfit/icons/DownloadIcon';
import { LayersIcon } from '../outfit/icons/LayersIcon';
import { ReferenceIcon } from '../outfit/icons/ReferenceIcon';
import { UploadIcon } from '../outfit/icons/UploadIcon';
import { KeyIcon } from '../outfit/icons/KeyIcon';


import { 
  AccessoryType, AccessoryOption, AccessoryOptions, 
  ModelStyle, MODEL_STYLE_OPTIONS,
  Background,
  Pose,
  ClothingFocus, CLOTHING_FOCUS_OPTIONS,
  ShotFocus, SHOT_FOCUS_OPTIONS,
  FaceConsistency, FACE_CONSISTENCY_OPTIONS
} from '../../types/outfit';

import { 
  generateStyledImage, 
  regeneratePose, 
  generateConsistentFaceDescription,
  changePoseFromSourceImage,
  generateSimilarStyle
} from '../../services/outfitService';

// Type augmentation for File System Access API (Optional now, keeping for potential future use)
declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  /* Define AIStudio interface to match the existing global type in the environment */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    /* Use the AIStudio interface and identical modifiers (readonly) to ensure compatibility with existing declarations */
    aistudio?: AIStudio;
  }
}

export const OutfitTab: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [sourceImages, setSourceImages] = useState<File[]>([]);
  const [sourceImageUrls, setSourceImageUrls] = useState<string[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  // Reference Image State
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);


  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options state
  const [modelStyle, setModelStyle] = useState<ModelStyle>(ModelStyle.원본유지);
  const [background, setBackground] = useState<Background>(Background.원본유지);
  const [pose, setPose] = useState<Pose>(Pose.원본유지);
  const [clothingFocus, setClothingFocus] = useState<ClothingFocus>(ClothingFocus.원본유지);
  const [shotFocus, setShotFocus] = useState<ShotFocus>(ShotFocus.원본유지);
  const [faceConsistency, setFaceConsistency] = useState<FaceConsistency>(FaceConsistency.원본유지);
  const [accessoryOptions, setAccessoryOptions] = useState<AccessoryOptions>({
    [AccessoryType.모자]: AccessoryOption.유지,
    [AccessoryType.반지]: AccessoryOption.유지,
    [AccessoryType.목걸이]: AccessoryOption.유지,
    [AccessoryType.가방]: AccessoryOption.유지,
  });

  const [faceDescription, setFaceDescription] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  const accordionSequence = ['model-style', 'background', 'pose', 'clothing', 'shot-focus', 'accessories'];

  useEffect(() => {
    const checkKey = async () => {
      if (false) {
        const selected = false;
        setHasApiKey(selected);
      } else {
        // Fallback for non-AI Studio environment
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = () => {};

  const advanceAccordion = (currentAccordion: string, force: boolean = false) => {
    // For accessories, don't advance automatically unless forced
    if (currentAccordion === 'accessories' && !force) return;
      
    const currentIndex = accordionSequence.indexOf(currentAccordion);
    if (currentIndex > -1) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < accordionSequence.length) {
            setOpenAccordion(accordionSequence[nextIndex]);
        } else {
            setOpenAccordion(null); // Close if it was the last one
        }
    }
  };

  const handleAccordionToggle = (id: string) => {
    setOpenAccordion(prev => (prev === id ? null : id));
  };


  useEffect(() => {
    if (faceConsistency === FaceConsistency.동일인물 && modelStyle !== ModelStyle.원본유지) {
      setFaceDescription(generateConsistentFaceDescription(modelStyle));
    } else {
      setFaceDescription(null);
    }
  }, [faceConsistency, modelStyle]);
  
  useEffect(() => {
    // Cleanup object URLs on unmount
    return () => {
      sourceImageUrls.forEach(URL.revokeObjectURL);
      if (referenceImageUrl) URL.revokeObjectURL(referenceImageUrl);
    };
  }, [sourceImageUrls, referenceImageUrl]);

  const handleImagesUpload = (files: File[]) => {
    setSourceImages(files);
    sourceImageUrls.forEach(URL.revokeObjectURL); // Clean up old URLs
    setSourceImageUrls(files.map(file => URL.createObjectURL(file)));
    setCurrentSourceIndex(0);
    setGeneratedImages([]); // Clear previous results
    setError(null);
    setOpenAccordion('model-style');
  };

  const handleReferenceImageUpload = (file: File) => {
    setReferenceImage(file);
    if (referenceImageUrl) URL.revokeObjectURL(referenceImageUrl);
    setReferenceImageUrl(URL.createObjectURL(file));

    // Convert to base64 for the API
    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            setReferenceImageBase64(reader.result);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReferenceImage = () => {
      setReferenceImage(null);
      if (referenceImageUrl) URL.revokeObjectURL(referenceImageUrl);
      setReferenceImageUrl(null);
      setReferenceImageBase64(null);
  };

  const handleRegenerateFaceDescription = () => {
    if (modelStyle !== ModelStyle.원본유지) {
        setFaceDescription(generateConsistentFaceDescription(modelStyle));
    }
  };

  const handleGenerateClick = async () => {
    if (sourceImages.length === 0) {
      setError('먼저 이미지를 업로드해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
       const results = await Promise.all(
        sourceImages.map(imageFile => 
            generateStyledImage(
                imageFile, modelStyle, background, pose, accessoryOptions,
                clothingFocus, shotFocus, faceConsistency, faceDescription,
                null, // customPrompt
                referenceImageBase64 // Pass reference image
            )
        )
      );
      setGeneratedImages(results.map(result => `data:image/png;base64,${result}`));
    } catch (e: any) {
      if (e.message && e.message.includes("Requested entity was not found")) {
          setHasApiKey(false); // Reset key selection state if it fails
          setError("API 키가 유효하지 않거나 찾을 수 없습니다. 다시 선택해주세요.");
      } else {
          setError(e.message || '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangeSourcePose = async () => {
    if (sourceImages.length === 0 || !sourceImages[currentSourceIndex]) {
      setError('먼저 이미지를 업로드해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const result = await changePoseFromSourceImage(
        sourceImages[currentSourceIndex],
        shotFocus
      );
      setGeneratedImages([`data:image/png;base64,${result}`]);
    } catch (e: any) {
      setError(e.message || '포즈를 변경하는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePoseAndBackground = async () => {
    if (sourceImages.length === 0 || !sourceImages[currentSourceIndex]) {
      setError('먼저 이미지를 업로드해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // Pass White Studio as the target background
      const result = await changePoseFromSourceImage(
        sourceImages[currentSourceIndex],
        shotFocus,
        Background.흰색스튜디오 
      );
      setGeneratedImages([`data:image/png;base64,${result}`]);
    } catch (e: any) {
      setError(e.message || '포즈와 배경을 변경하는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleRegenerateSingle = async (index: number, customPrompt: string | null = null) => {
    if (!sourceImages[index]) return;
    setIsLoading(true);
    setError(null);
    try {
        const result = await generateStyledImage(
            sourceImages[index], modelStyle, background, pose, accessoryOptions,
            clothingFocus, shotFocus, faceConsistency, faceDescription,
            customPrompt, // customPrompt passed from modal
            referenceImageBase64
        );
        const newImages = [...generatedImages];
        newImages[index] = `data:image/png;base64,${result}`;
        setGeneratedImages(newImages);
    } catch (e: any) {
        setError(e.message || '이미지를 다시 생성하는데 실패했습니다.');
    } finally {
        setIsLoading(false);
    }
  };


  const handleRegeneratePose = async (index: number, customPrompt: string | null = null) => {
    if (generatedImages.length === 0) return;
    setIsLoading(true);
    setError(null);
    const sourceForRepose = generatedImages[index];
    try {
        const result = await regeneratePose(
            sourceForRepose, modelStyle, background, shotFocus, faceDescription,
            customPrompt,
            Pose.다른자세 // Default to 'Different Pose' if not specified
        );
        const newImages = [...generatedImages];
        newImages[index] = `data:image/png;base64,${result}`;
        setGeneratedImages(newImages);
    } catch (e: any) {
        setError(e.message || '포즈를 변경하는데 실패했습니다.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateSimilar = async (index: number) => {
    if (!generatedImages[index]) return;
    setIsLoading(true);
    setError(null);
    const sourceForSimilar = generatedImages[index];
    try {
        const result = await generateSimilarStyle(sourceForSimilar);
        const newImages = [...generatedImages];
        newImages[index] = `data:image/png;base64,${result}`;
        setGeneratedImages(newImages);
    } catch (e: any) {
        setError(e.message || '유사한 이미지를 생성하는데 실패했습니다.');
    } finally {
        setIsLoading(false);
    }
  };


  const handleAccessoryChange = (accessory: AccessoryType, option: AccessoryOption) => {
    setAccessoryOptions(prev => ({...prev, [accessory]: option}));
  };

  const handleDownloadSingle = (index: number) => {
      // Fallback to simple download
      const imageUrl = generatedImages[index];
      const sourceFile = sourceImages[index];
      const fileName = sourceFile 
          ? `edited_${sourceFile.name}`
          : `ai-stylist-image-${Date.now()}-${index + 1}.png`; 

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };


  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) return;

    // Use a loop with delay to download files sequentially
    // This prevents browsers from blocking multiple simultaneous downloads
    for (let i = 0; i < generatedImages.length; i++) {
        const imageUrl = generatedImages[i];
        const sourceFile = sourceImages[i];
        const fileName = sourceFile 
            ? `edited_${sourceFile.name}`
            : `ai-stylist-image-${Date.now()}-${i + 1}.png`; 

        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Add a small delay between downloads
        if (i < generatedImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
  };
  
  const openModal = (index: number) => {
    setCurrentModalIndex(index);
    setIsModalOpen(true);
  };

  const accessoryIcons = {
    [AccessoryType.모자]: <HatIcon className="w-6 h-6" />,
    [AccessoryType.반지]: <RingIcon className="w-6 h-6" />,
    [AccessoryType.목걸이]: <NecklaceIcon className="w-6 h-6" />,
    [AccessoryType.가방]: <BagIcon className="w-6 h-6" />,
  };

  const backgroundVisualOptions = {
    '흰색 스튜디오': { value: Background.흰색스튜디오, icon: <StudioIcon className="w-8 h-8 mx-auto" /> },
    '회색 스튜디오': { value: Background.회색스튜디오, icon: <StudioIcon className="w-8 h-8 mx-auto text-gray-400" /> },
    '도시 배경': { value: Background.도시배경, icon: <CityIcon className="w-8 h-8 mx-auto" /> },
    '자연 풍경': { value: Background.자연풍경, icon: <NatureIcon className="w-8 h-8 mx-auto" /> },
    '카페 실내': { value: Background.카페실내, icon: <CafeIcon className="w-8 h-8 mx-auto" /> },
    '변경 없음': { value: Background.원본유지, icon: <RefreshIcon className="w-8 h-8 mx-auto" /> },
  };

  const poseVisualOptions = {
    '서 있기': { value: Pose.서있기, icon: <StandingIcon className="w-8 h-8 mx-auto" /> },
    '앉아 있기': { value: Pose.앉아있기, icon: <SittingIcon className="w-8 h-8 mx-auto" /> },
    '걷기': { value: Pose.걷기, icon: <WalkingIcon className="w-8 h-8 mx-auto" /> },
    '다른 자세': { value: Pose.다른자세, icon: <PoseIcon className="w-8 h-8 mx-auto" /> },
    '랜덤': { value: Pose.랜덤, icon: <SparklesIcon className="w-8 h-8 mx-auto" /> },
    '변경 없음': { value: Pose.원본유지, icon: <RefreshIcon className="w-8 h-8 mx-auto" /> },
  };

  if (hasApiKey === null) return <div className='flex items-center justify-center py-20'><div className='w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin' /></div>;

  

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <header className="py-4 px-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          AI 패션 스타일리스트
        </h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 max-w-7xl mx-auto">
        {/* Left Column: Uploader & Source Image */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. 이미지 업로드</h2>
            <ImageUploader onImagesUpload={handleImagesUpload} />
          </section>

          {sourceImageUrls.length > 0 && (
            <div className="sticky top-8">
              <div className="flex flex-col gap-2 mb-2">
                <h3 className="text-lg font-semibold">원본 이미지 ({currentSourceIndex + 1}/{sourceImageUrls.length})</h3>
                <div className="flex gap-2">
                     <button 
                          onClick={handleChangeSourcePose}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
                          title="현재 원본 이미지의 포즈만 변경 (배경 유지)"
                      >
                          <PoseIcon className="w-5 h-5 text-cyan-400" />
                          <span>포즈 변경</span>
                      </button>
                      <button 
                          onClick={handleChangePoseAndBackground}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
                          title="포즈와 배경(흰색 스튜디오)을 함께 변경"
                      >
                          <StudioIcon className="w-5 h-5 text-purple-400" />
                          <span>포즈+배경(스튜디오)</span>
                      </button>
                </div>
              </div>
               <div className="relative">
                <img src={sourceImageUrls[currentSourceIndex]} alt={`Source ${currentSourceIndex + 1}`} className="rounded-lg shadow-lg w-full" />
                {sourceImageUrls.length > 1 && (
                    <>
                        <button 
                          onClick={() => setCurrentSourceIndex(prev => prev === 0 ? sourceImageUrls.length - 1 : prev - 1)}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 ml-2 bg-slate-800/50 rounded-full text-gray-200 hover:bg-slate-700 transition-all"
                          aria-label="이전 원본 이미지"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => setCurrentSourceIndex(prev => prev === sourceImageUrls.length - 1 ? 0 : prev + 1)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 mr-2 bg-slate-800/50 rounded-full text-gray-200 hover:bg-slate-700 transition-all"
                          aria-label="다음 원본 이미지"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column: Options */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h2 className="text-xl font-semibold">2. 스타일 맞춤 설정</h2>
          <div className="space-y-4">
            <AccordionItem title="모델 스타일" isOpen={openAccordion === 'model-style'} onToggle={() => handleAccordionToggle('model-style')}>
              <OptionSelector 
                label="모델" 
                value={modelStyle} 
                options={MODEL_STYLE_OPTIONS} 
                onChange={(val) => { 
                    setModelStyle(val as ModelStyle); 
                    if (val === ModelStyle.원본유지) { 
                        advanceAccordion('model-style'); 
                    } 
                }} 
              />
              {modelStyle !== ModelStyle.원본유지 && (
                <>
                  <div className="mt-4">
                    <OptionSelector 
                        label="얼굴" 
                        value={faceConsistency} 
                        options={FACE_CONSISTENCY_OPTIONS} 
                        onChange={(val) => { 
                            setFaceConsistency(val as FaceConsistency); 
                            // Only advance if it's NOT 'Same Person'.
                            if (val !== FaceConsistency.동일인물) {
                                advanceAccordion('model-style'); 
                            }
                        }} 
                    />
                  </div>
                  {faceConsistency === FaceConsistency.동일인물 && faceDescription && (
                    <>
                        <div className="mt-4 p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-gray-300 space-y-1 relative group">
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-semibold text-cyan-400">AI가 기억할 인물 특징:</p>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRegenerateFaceDescription(); }}
                                    className="p-1.5 bg-slate-600 hover:bg-slate-500 rounded-full text-white transition-all shadow-sm"
                                    title="인물 특징 랜덤 변경 (새로고침)"
                                >
                                    <RefreshIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-gray-400 leading-relaxed">{faceDescription}</p>
                        </div>
                        <button 
                            onClick={() => advanceAccordion('model-style', true)} 
                            className="mt-3 w-full text-center py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors text-cyan-300 font-medium"
                        >
                            확인 (다음 단계로)
                        </button>
                    </>
                  )}
                </>
              )}
            </AccordionItem>
            
            <AccordionItem title="배경" isOpen={openAccordion === 'background'} onToggle={() => handleAccordionToggle('background')}>
               <VisualOptionSelector value={background} options={backgroundVisualOptions} onChange={(val) => { setBackground(val as Background); advanceAccordion('background'); }} />
            </AccordionItem>

            <AccordionItem title="포즈" isOpen={openAccordion === 'pose'} onToggle={() => handleAccordionToggle('pose')}>
               <VisualOptionSelector value={pose} options={poseVisualOptions} onChange={(val) => { setPose(val as Pose); advanceAccordion('pose'); }} />
            </AccordionItem>

            <AccordionItem title="의상" isOpen={openAccordion === 'clothing'} onToggle={() => handleAccordionToggle('clothing')}>
              <OptionSelector label="의상 적용 방식" value={clothingFocus} options={CLOTHING_FOCUS_OPTIONS} onChange={(val) => { setClothingFocus(val as ClothingFocus); advanceAccordion('clothing'); }} />
            </AccordionItem>

            <AccordionItem title="촬영 구도" isOpen={openAccordion === 'shot-focus'} onToggle={() => handleAccordionToggle('shot-focus')}>
              <OptionSelector label="촬영 구도" value={shotFocus} options={SHOT_FOCUS_OPTIONS} onChange={(val) => { setShotFocus(val as ShotFocus); advanceAccordion('shot-focus'); }} />
            </AccordionItem>
            
            <AccordionItem title="액세서리" isOpen={openAccordion === 'accessories'} onToggle={() => handleAccordionToggle('accessories')}>
                <div className="grid grid-cols-2 gap-4">
                  {Object.values(AccessoryType).map(acc => (
                    <div key={acc}>
                      <label className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-300">{accessoryIcons[acc]} {acc}</label>
                      <OptionSelector
                        value={accessoryOptions[acc]}
                        options={{'유지': AccessoryOption.유지, '제거': AccessoryOption.제거, '생성': AccessoryOption.생성}}
                        onChange={(val) => {
                          handleAccessoryChange(acc, val as AccessoryOption);
                        }}
                      />
                    </div>
                  ))}
                </div>
                 <button 
                  onClick={() => advanceAccordion('accessories', true)} 
                  className="mt-4 w-full text-center py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors"
                >
                  확인
                </button>
            </AccordionItem>
          </div>

          {/* Reference Image Section */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ReferenceIcon className="w-5 h-5 text-purple-400" />
                스타일 참조 이미지 (선택)
            </h3>
            {!referenceImageUrl ? (
                <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-slate-600 border-dashed rounded-lg hover:border-purple-500 hover:bg-slate-700/50 transition-all w-full text-sm text-gray-400">
                        <UploadIcon className="w-5 h-5" />
                        <span>참조 이미지 업로드 (분위기/톤)</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleReferenceImageUpload(e.target.files[0]);
                            }
                        }} />
                    </label>
                </div>
            ) : (
                <div className="relative group">
                    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
                        <img src={referenceImageUrl} alt="Reference" className="w-16 h-16 object-cover rounded-md" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-purple-300 truncate">스타일 참조 적용됨</p>
                            <p className="text-xs text-gray-500 truncate">{referenceImage?.name}</p>
                        </div>
                        <button 
                            onClick={handleRemoveReferenceImage}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={handleGenerateClick}
              disabled={isLoading || sourceImages.length === 0}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  <span>이미지 생성</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Right Column: Results */}
        <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">3. 결과 확인</h2>
              {generatedImages.length > 0 && !isLoading && (
                  <button 
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors shadow-md"
                  >
                      <DownloadIcon className="w-5 h-5" />
                      <span>일괄 다운로드 ({generatedImages.length}장)</span>
                  </button>
              )}
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                {isLoading && (
                    <div className="text-center">
                        <Spinner className="h-12 w-12 text-cyan-400 mx-auto" />
                        <p className="mt-4 text-gray-400">AI가 이미지를 스타일링하고 있습니다...<br/>잠시만 기다려주세요.</p>
                    </div>
                )}
                {error && <p className="text-red-400 text-center">{error}</p>}
                {!isLoading && !error && generatedImages.length === 0 && (
                    <div className="text-center text-gray-500">
                      <p>생성된 이미지가 여기에 표시됩니다.</p>
                    </div>
                )}
                {generatedImages.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {generatedImages.map((img, index) => (
                      <div 
                        key={index} 
                        className="relative group cursor-pointer"
                        onClick={() => openModal(index)}
                      >
                        <img 
                            src={img} 
                            alt={`Generated ${index + 1}`} 
                            className="rounded-lg shadow-lg w-full"
                        />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                             <button
                                onClick={(e) => { e.stopPropagation(); handleRegenerateSingle(index); }}
                                className="text-white bg-slate-700/80 p-3 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="다시 생성"
                                disabled={isLoading}
                            >
                                <SparklesIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRegeneratePose(index); }}
                                className="text-white bg-slate-700/80 p-3 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="포즈 변경"
                                disabled={isLoading}
                            >
                                <RefreshIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGenerateSimilar(index); }}
                                className="text-white bg-slate-700/80 p-3 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="유사 스타일 더보기"
                                disabled={isLoading}
                            >
                                <LayersIcon className="w-6 h-6" />
                            </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(index); }}
                                className="text-white bg-slate-700/80 p-3 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="다운로드"
                                disabled={isLoading}
                            >
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        </div>
      </main>

      {isModalOpen && (
        <ImageModal
          images={generatedImages}
          sourceImages={sourceImages}
          currentIndex={currentModalIndex}
          onClose={() => setIsModalOpen(false)}
          onRegenerate={handleRegenerateSingle}
          onRegeneratePose={handleRegeneratePose}
        />
      )}
    </div>
  );
};


