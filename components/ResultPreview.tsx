import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { GeneratedCopy, ProcessedImage, ProductCategory } from '../types';
import { processProductImage, regenerateCopy, ImageProcessMode } from '../services/geminiService';
import { 
    ArrowDownTrayIcon, ArrowPathIcon, SwatchIcon, ViewColumnsIcon, ListBulletIcon, Square2StackIcon, 
    PhotoIcon, PlusIcon, SparklesIcon, TrashIcon, DocumentTextIcon, CheckIcon, PencilSquareIcon, 
    ChevronUpIcon, ChevronDownIcon, ScissorsIcon, XMarkIcon, LanguageIcon, EllipsisHorizontalIcon,
    UserCircleIcon, HomeModernIcon, PaintBrushIcon, ArrowsUpDownIcon, HandRaisedIcon, ArrowsPointingOutIcon,
    TableCellsIcon
} from '@heroicons/react/24/outline';

interface ResultPreviewProps {
  copy: GeneratedCopy;
  images: ProcessedImage[];
  productName: string; 
  category: ProductCategory;
  onReset: () => void;
}

type PointLayoutType = 'ZIGZAG' | 'CARDS' | 'SIMPLE';
type PointIconStyle = 'EMOJI' | 'NUMBER' | 'NONE';
type PointThemeColor = 'INDIGO' | 'BLACK' | 'PINK' | 'BLUE' | 'GREEN' | 'ORANGE';
type SectionType = 'HERO' | 'STORY' | 'POINTS' | 'OPTIONS' | 'DETAILS' | 'INFO';

// Detail Block System
type BlockType = 'IMAGE' | 'TEXT' | 'SIZE_CHART';
type PointBlockType = 'POINT_ITEM' | 'IMAGE' | 'TEXT'; 
type BlockWidth = 'FULL' | 'HALF' | 'THIRD';

interface TextStyle {
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

interface DetailBlock {
    id: string;
    type: BlockType;
    content: string; 
    width: BlockWidth;
    isProcessing?: boolean;
    style?: TextStyle; 
    overlayText?: string;
    overlayStyle?: TextStyle;
    tableData?: string[][]; // For Size Chart
}

interface PointBlock {
    id: string;
    type: PointBlockType;
    icon?: string;
    title?: string;
    description?: string;
    content?: string; 
    width?: BlockWidth; 
    style?: TextStyle;
    isProcessing?: boolean;
    sideImage?: string; 
}

interface OptionBlock {
    id: string;
    image: string;
    text: string;
    isProcessing?: boolean;
}

// Theme Config
const THEME_COLORS: Record<PointThemeColor, { bg: string, text: string, border: string, lightBg: string, badge: string }> = {
    INDIGO: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', lightBg: 'bg-indigo-50', badge: 'bg-indigo-600' },
    BLACK: { bg: 'bg-gray-900', text: 'text-gray-900', border: 'border-gray-900', lightBg: 'bg-gray-100', badge: 'bg-gray-900' },
    PINK: { bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500', lightBg: 'bg-pink-50', badge: 'bg-pink-500' },
    BLUE: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', lightBg: 'bg-blue-50', badge: 'bg-blue-600' },
    GREEN: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', lightBg: 'bg-emerald-50', badge: 'bg-emerald-600' },
    ORANGE: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', lightBg: 'bg-orange-50', badge: 'bg-orange-500' },
};

// ── 카테고리별 감성 디자인 시스템 ─────────────────────
const CATEGORY_DESIGN: Record<ProductCategory, {
    heroBg: string; heroAccent: string; heroText: string;
    storyBg: string; storyAccent: string;
    pointBg: string; pointPanel: string; pointAccent: string; pointNum: string;
    infoBg: string;
    badge1: string; badge2: string;
}> = {
    FASHION: {
        heroBg: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        heroAccent: '#c9a96e', heroText: '#fff8f0',
        storyBg: 'linear-gradient(135deg, #faf8f5 0%, #f0ebe3 100%)',
        storyAccent: '#8b6f5c',
        pointBg: '#faf8f5',
        pointPanel: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)',
        pointAccent: '#c9a96e', pointNum: '#c9a96e',
        infoBg: '#f5f2ed',
        badge1: 'linear-gradient(90deg, #1a1a2e, #0f3460)',
        badge2: 'linear-gradient(90deg, #8b6f5c, #c9a96e)',
    },
    LIVING: {
        heroBg: 'linear-gradient(160deg, #2d3b2d 0%, #3d5c3d 50%, #4a6741 100%)',
        heroAccent: '#c8b97a', heroText: '#f8f5ee',
        storyBg: 'linear-gradient(135deg, #f4f1eb 0%, #ede6d6 100%)',
        storyAccent: '#6b7c5c',
        pointBg: '#f8f5ee',
        pointPanel: 'linear-gradient(135deg, #2d3b2d 0%, #4a6741 100%)',
        pointAccent: '#c8b97a', pointNum: '#8fa870',
        infoBg: '#f0ede5',
        badge1: 'linear-gradient(90deg, #2d3b2d, #4a6741)',
        badge2: 'linear-gradient(90deg, #7a8c5c, #c8b97a)',
    },
    KITCHEN: {
        heroBg: 'linear-gradient(160deg, #1a1a1a 0%, #2c2c2c 50%, #3d3d3d 100%)',
        heroAccent: '#e8e0d0', heroText: '#f5f5f5',
        storyBg: 'linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%)',
        storyAccent: '#555555',
        pointBg: '#f8f8f8',
        pointPanel: 'linear-gradient(135deg, #1a1a1a 0%, #3d3d3d 100%)',
        pointAccent: '#e8e0d0', pointNum: '#888888',
        infoBg: '#f0f0f0',
        badge1: 'linear-gradient(90deg, #1a1a1a, #3d3d3d)',
        badge2: 'linear-gradient(90deg, #555555, #888888)',
    },
    FOOD: {
        heroBg: 'linear-gradient(160deg, #3d1f0d 0%, #6b3a1f 50%, #a0522d 100%)',
        heroAccent: '#f5c842', heroText: '#fff9f0',
        storyBg: 'linear-gradient(135deg, #fff9f0 0%, #fef0d8 100%)',
        storyAccent: '#b5611a',
        pointBg: '#fff9f0',
        pointPanel: 'linear-gradient(135deg, #3d1f0d 0%, #7a3520 100%)',
        pointAccent: '#f5c842', pointNum: '#e07a30',
        infoBg: '#fef5e7',
        badge1: 'linear-gradient(90deg, #3d1f0d, #7a3520)',
        badge2: 'linear-gradient(90deg, #b5611a, #e07a30)',
    },
};

const FONT_FAMILIES = [
    { name: '기본 (고딕)', value: 'font-sans' },
    { name: '명조체', value: 'font-serif-kr' },
    { name: '돋움체', value: 'font-dodum' },
    { name: '손글씨', value: 'font-pen' },
];

const getThemeByCategory = (category: ProductCategory): PointThemeColor => {
    switch (category) {
        case 'FOOD': return 'ORANGE';
        case 'LIVING': return 'GREEN';
        case 'KITCHEN': return 'BLACK';
        default: return 'INDIGO';
    }
};

const getHeadersByCategory = (category: ProductCategory) => {
    switch (category) {
        case 'FOOD': return {
            heroSubtitle: "TASTE OF THE SEASON",
            heroBadge: "✦ LIMITED",
            newArrival: "오늘의 추천 식품",
            whyThisItem: "왜 이 맛인가요?",
            whySub: "한 번 먹으면 잊을 수 없는 이유",
            detailView: "상세 들여다보기",
            productInfo: "상품 정보",
            moodStory: "맛있는 이야기"
        };
        case 'LIVING': return {
            heroSubtitle: "YOUR SPACE, YOUR STORY",
            heroBadge: "✦ CURATED",
            newArrival: "공간을 바꾸는 아이템",
            whyThisItem: "이 공간이 달라집니다",
            whySub: "선택해야 하는 3가지 이유",
            detailView: "디테일 확인하기",
            productInfo: "상품 정보",
            moodStory: "공간 & 무드"
        };
        case 'KITCHEN': return {
            heroSubtitle: "SMART KITCHEN LIFE",
            heroBadge: "✦ CHEF'S PICK",
            newArrival: "주방을 바꾸는 선택",
            whyThisItem: "스마트한 선택",
            whySub: "요리가 즐거워지는 이유",
            detailView: "상세 확인하기",
            productInfo: "상품 정보",
            moodStory: "키친 가이드"
        };
        default: return {
            heroSubtitle: "NEW SEASON COLLECTION",
            heroBadge: "✦ BEST SELLER",
            newArrival: "이번 시즌 주목 아이템",
            whyThisItem: "왜 이 옷인가요?",
            whySub: "소장해야 하는 이유",
            detailView: "디테일 확인하기",
            productInfo: "상품 정보",
            moodStory: "무드 & 스토리"
        };
    }
};

// --- Image Cropper Component ---
interface ImageCropperProps {
    imageUrl: string;
    onCrop: (croppedUrl: string) => void;
    onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCrop, onCancel }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const cropperRef = useRef<any>(null);

    useEffect(() => {
        if (imageRef.current && (window as any).Cropper) {
            cropperRef.current = new (window as any).Cropper(imageRef.current, {
                viewMode: 1, 
                dragMode: 'move',
                autoCropArea: 1, 
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                minContainerWidth: 300,
                minContainerHeight: 300,
                checkCrossOrigin: false,
            });
        }
        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
            }
        };
    }, [imageUrl]);

    const handleCrop = () => {
        if (cropperRef.current) {
            const canvas = cropperRef.current.getCroppedCanvas();
            if (canvas) {
                onCrop(canvas.toDataURL());
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-5xl flex flex-col h-[80vh] z-[110]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <ScissorsIcon className="w-5 h-5" /> 이미지 자르기
                    </h3>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                <div className="flex-1 bg-gray-900 relative flex items-center justify-center overflow-hidden">
                     <img ref={imageRef} src={imageUrl} alt="Crop Target" className="block max-w-full max-h-full" crossOrigin="anonymous" />
                </div>
                <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                        취소
                    </button>
                    <button onClick={handleCrop} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg flex items-center gap-2">
                        <CheckIcon className="w-5 h-5" /> 자르기 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Helper Component for Text Rewriting ---
const MagicRewriter = ({ text, onUpdate, label, className = "top-0 right-0" }: { text: string, onUpdate: (t: string) => void, label: string, className?: string }) => {
    const [loading, setLoading] = useState(false);
  
    const handleRewrite = async (e: React.MouseEvent) => {
      e.stopPropagation(); 
      if (!text) return;
      setLoading(true);
      try {
          const newText = await regenerateCopy(text, label);
          onUpdate(newText);
      } catch(e) {
          console.error(e);
          alert("텍스트 생성에 실패했습니다.");
      } finally {
          setLoading(false);
      }
    };
  
    return (
      <button 
          onClick={handleRewrite} 
          disabled={loading}
          className={`absolute z-20 p-2 bg-white text-indigo-600 rounded-full shadow-md border border-indigo-200 transition-all hover:bg-indigo-50 hover:scale-110 hover:border-indigo-400 ${className}`}
          title="AI로 문구 다듬기 (다른 표현 추천)"
          onMouseDown={(e) => e.stopPropagation()}
      >
          {loading ? (
             <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <div className="flex items-center gap-1">
                <SparklesIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold whitespace-nowrap hidden md:inline-block">AI 수정</span>
             </div>
          )}
      </button>
    );
};

// --- Independent Toolbar Component ---
interface ToolbarProps {
    style: TextStyle;
    setStyle: React.Dispatch<React.SetStateAction<TextStyle>>;
    onDelete?: () => void;
    enableDrag?: boolean;
    handleDragStart: (e: React.MouseEvent) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ style, setStyle, onDelete, enableDrag, handleDragStart }) => {
    const handleFontSizeChange = (delta: number) => {
        const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
        const currentIndex = sizes.indexOf(style.fontSize);
        const newIndex = Math.min(Math.max(currentIndex + delta, 0), sizes.length - 1);
        setStyle(prev => ({ ...prev, fontSize: sizes[newIndex] as any }));
    };

    const handleFontWeightToggle = () => {
        setStyle(prev => ({
            ...prev,
            fontWeight: prev.fontWeight === 'font-bold' ? 'font-normal' : 'font-bold'
        }));
    };

    const colors = [
        { name: 'Black', value: 'text-gray-900' },
        { name: 'Gray', value: 'text-gray-500' },
        { name: 'White', value: 'text-white' },
        { name: 'Navy', value: 'text-indigo-900' },
        { name: 'Blue', value: 'text-blue-600' },
        { name: 'Red', value: 'text-red-600' },
        { name: 'Green', value: 'text-emerald-600' },
    ];

    const bgColors = [
        { name: 'None', value: '' },
        { name: 'White', value: 'bg-white' },
        { name: 'Black', value: 'bg-gray-900' },
        { name: 'Gray', value: 'bg-gray-100' },
        { name: 'Yellow', value: 'bg-yellow-50' },
        { name: 'Blue', value: 'bg-blue-50' },
        { name: 'Pink', value: 'bg-pink-50' },
        { name: 'Green', value: 'bg-emerald-50' },
    ];

    return (
        <div 
            className="fixed top-24 z-[9999] bg-gray-900/95 backdrop-blur text-white p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[260px] animate-fade-in border border-gray-700 select-none"
            style={{ left: 'calc(50% + 440px)' }}
            onMouseDown={(e) => e.preventDefault()} 
        >
            <div className="text-xs font-bold text-gray-400 mb-1 flex items-center justify-between">
                <span>텍스트 편집</span>
                <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">편집 중</span>
            </div>
            <div className="flex items-center gap-2 border-b border-gray-700 pb-3 w-full">
                <select 
                    value={style.fontFamily} 
                    onChange={(e) => setStyle(prev => ({...prev, fontFamily: e.target.value as any}))}
                    className="bg-gray-800 text-xs text-white rounded p-1.5 border border-gray-600 outline-none w-28"
                >
                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
                <button onClick={handleFontWeightToggle} className={`p-1.5 w-7 h-7 rounded text-xs font-serif flex items-center justify-center ${style.fontWeight === 'font-bold' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>B</button>
                <div className="w-[1px] h-4 bg-gray-600"></div>
                <button onClick={() => handleFontSizeChange(-1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold w-7 h-7">A-</button>
                <button onClick={() => handleFontSizeChange(1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold w-7 h-7">A+</button>
            </div>
            <div className="flex items-center gap-2 border-b border-gray-700 pb-3 w-full justify-between">
                <div className="flex gap-1">
                    <button onClick={() => setStyle(prev => ({ ...prev, align: 'text-left' }))} className={`p-1.5 rounded text-[10px] w-7 h-7 ${style.align === 'text-left' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>L</button>
                    <button onClick={() => setStyle(prev => ({ ...prev, align: 'text-center' }))} className={`p-1.5 rounded text-[10px] w-7 h-7 ${style.align === 'text-center' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>C</button>
                    <button onClick={() => setStyle(prev => ({ ...prev, align: 'text-right' }))} className={`p-1.5 rounded text-[10px] w-7 h-7 ${style.align === 'text-right' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>R</button>
                </div>
                {enableDrag && (
                    <button 
                        onMouseDown={handleDragStart} 
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white cursor-move flex items-center gap-1 text-xs font-bold"
                        title="이동 (드래그)"
                    >
                        <ArrowsPointingOutIcon className="w-3 h-3" /> 이동
                    </button>
                )}
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">텍스트 색상</span>
                    <label className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-white">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-blue-500 block"></span>
                        커스텀
                        <input type="color" className="w-0 h-0 opacity-0" onChange={(e) => setStyle(prev => ({ ...prev, color: e.target.value }))} />
                    </label>
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
                    {colors.map(c => (
                        <button 
                            key={c.name}
                            onClick={() => setStyle(prev => ({ ...prev, color: c.value }))}
                            className={`w-6 h-6 rounded-full border border-gray-600 shrink-0 ${c.value.replace('text-', 'bg-')}`}
                            title={c.name}
                        />
                    ))}
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">배경 색상</span>
                    <label className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-white">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-black block"></span>
                        커스텀
                        <input type="color" className="w-0 h-0 opacity-0" onChange={(e) => setStyle(prev => ({ ...prev, backgroundColor: e.target.value }))} />
                    </label>
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
                    {bgColors.map(c => (
                        <button 
                            key={c.name}
                            onClick={() => setStyle(prev => ({ ...prev, backgroundColor: c.value }))}
                            className={`w-6 h-6 rounded-full border border-gray-600 shrink-0 ${c.value.startsWith('bg-') ? c.value : 'bg-transparent text-red-400 text-[8px] flex items-center justify-center font-bold'}`}
                            title={c.name}
                        >
                            {!c.value && 'X'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-700 w-full">
                <button onClick={() => setStyle(prev => ({ ...prev, maxWidth: 'max-w-full' }))} className={`px-2 py-1 hover:bg-gray-700 rounded text-[10px] ${!style.maxWidth || style.maxWidth === 'max-w-full' ? 'text-green-400 font-bold' : ''}`}>100%</button>
                <button onClick={() => setStyle(prev => ({ ...prev, maxWidth: 'max-w-2xl' }))} className={`px-2 py-1 hover:bg-gray-700 rounded text-[10px] ${style.maxWidth === 'max-w-2xl' ? 'text-green-400 font-bold' : ''}`}>50%</button>
                <div className="flex-1"></div>
                {onDelete && (
                    <button onClick={onDelete} className="p-1.5 hover:bg-red-600 bg-red-500 rounded text-white flex items-center gap-1 text-xs">
                        <TrashIcon className="w-3 h-3" /> 삭제
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Auto-Resize Textarea for Table ---
interface AutoResizeTextareaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    className?: string;
    readOnly?: boolean;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({ value, onChange, className, readOnly }) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.style.height = '0px';
            ref.current.style.height = `${ref.current.scrollHeight + 10}px`;
        }
    }, [value, className]); 

    useEffect(() => {
        const handleResize = () => {
            if (ref.current) {
                ref.current.style.height = '0px';
                ref.current.style.height = `${ref.current.scrollHeight + 10}px`;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className={`w-full bg-transparent resize-none overflow-hidden outline-none leading-normal ${className}`}
            rows={1}
        />
    );
};

// --- Editable Element Component ---
interface EditableElementProps {
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
    style?: React.CSSProperties;
    aiLabel?: string; 
    toolbarPosition?: 'default' | 'right';
}

const EditableElement: React.FC<EditableElementProps> = ({
    value, onChange, onDelete, onStyleChange, isEditMode, placeholder, defaultStyle, 
    allowStyleChange = true, enableVerticalAlign = false, enableDrag = false, 
    className = "", style: externalStyle, aiLabel, toolbarPosition = 'default'
}) => {
    const [style, setStyle] = useState<TextStyle>(defaultStyle);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

    useEffect(() => {
        setStyle(defaultStyle);
    }, [defaultStyle.verticalAlign, defaultStyle.x, defaultStyle.y, defaultStyle.color, defaultStyle.backgroundColor, defaultStyle.fontSize, defaultStyle.fontWeight, defaultStyle.fontFamily, defaultStyle.align]); 

    useEffect(() => {
        if (onStyleChange) {
            onStyleChange(style);
        }
    }, [style, onStyleChange]);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '0px';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 10}px`;
        }
    }, [value, isEditMode, style, style.fontSize, style.fontWeight, style.fontFamily]); 

    useEffect(() => {
        const handleResize = () => {
            if (textareaRef.current) {
                textareaRef.current.style.height = '0px';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 10}px`;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDragStart = (e: React.MouseEvent) => {
        if (!enableDrag || !isEditMode || !containerRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.isDragging = true;
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
        const parentRect = containerRef.current.offsetParent?.getBoundingClientRect();
        if (parentRect) {
             dragRef.current.initialLeft = style.x || 50;
             dragRef.current.initialTop = style.y || 50;
        }
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragRef.current.isDragging || !containerRef.current?.offsetParent) return;
        const parentRect = containerRef.current.offsetParent.getBoundingClientRect();
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        const percentX = (deltaX / parentRect.width) * 100;
        const percentY = (deltaY / parentRect.height) * 100;
        let newX = dragRef.current.initialLeft + percentX;
        let newY = dragRef.current.initialTop + percentY;
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));
        setStyle(prev => ({ ...prev, x: newX, y: newY }));
    };

    const handleMouseUp = () => {
        dragRef.current.isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const containerWidthClass = style.maxWidth || 'max-w-full';
    const isHexColor = style.color.startsWith('#') || style.color.startsWith('rgb');
    const isHexBg = style.backgroundColor && (style.backgroundColor.startsWith('#') || style.backgroundColor.startsWith('rgb'));
    const colorClass = isHexColor ? '' : style.color;
    const bgColorClass = isHexBg ? '' : style.backgroundColor;
    const paddingClass = (style.backgroundColor || isHexBg) ? 'p-4 rounded-xl shadow-sm' : '';
    const inlineStyle: React.CSSProperties = {
        color: isHexColor ? style.color : undefined,
        backgroundColor: isHexBg ? style.backgroundColor : undefined,
        ...externalStyle,
    };
    
    const positionStyle: React.CSSProperties = enableDrag ? {
        position: 'absolute',
        left: `${style.x ?? 50}%`,
        top: `${style.y ?? 50}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isFocused ? 40 : 20,
        width: style.maxWidth ? 'auto' : undefined,
        minWidth: '200px',
        ...inlineStyle 
    } : { ...inlineStyle };

    if (!isEditMode) {
        if (!value) return null; 
        const previewStyle: React.CSSProperties = {
            ...inlineStyle,
            ...(enableDrag ? {
                position: 'absolute',
                left: `${style.x ?? 50}%`,
                top: `${style.y ?? 50}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20
            } : {})
        };
        return (
            <div 
                className={`w-full flex ${style.align === 'text-center' ? 'justify-center' : style.align === 'text-right' ? 'justify-end' : 'justify-start'}`}
                style={enableDrag ? previewStyle : {}}
            >
                <div 
                    className={`${style.fontSize} ${style.fontFamily} ${colorClass} ${style.align} ${style.fontWeight} ${containerWidthClass} ${!enableDrag ? bgColorClass + ' ' + paddingClass : ''} ${className} whitespace-pre-wrap break-keep leading-normal`}
                    style={!enableDrag ? previewStyle : {}}
                >
                    {value}
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            style={positionStyle}
            className={`relative group/edit transition-all flex ${!enableDrag ? 'w-full' : ''} ${style.align === 'text-center' ? 'justify-center' : style.align === 'text-right' ? 'justify-end' : 'justify-start'} ${isFocused ? 'z-40' : ''} ${enableDrag ? bgColorClass + ' ' + paddingClass : ''}`}
        >
            {allowStyleChange && isFocused && createPortal(
                <Toolbar 
                    style={style} 
                    setStyle={setStyle} 
                    onDelete={onDelete} 
                    enableDrag={enableDrag} 
                    handleDragStart={handleDragStart} 
                />, 
                document.body
            )}
            
            {aiLabel && (
                <MagicRewriter 
                    text={value} 
                    label={aiLabel} 
                    onUpdate={onChange} 
                    className={`absolute -right-3 top-0 opacity-100 ${enableDrag ? '-right-8' : ''}`} 
                />
            )}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className={`bg-transparent border-0 p-2 resize-none overflow-hidden outline-none focus:ring-2 focus:ring-indigo-400/50 w-full ${style.fontSize} ${style.fontFamily} ${colorClass} ${style.align} ${style.fontWeight} ${containerWidthClass} ${!enableDrag ? bgColorClass + ' ' + paddingClass : ''} ${className} cursor-text leading-normal`}
                style={!enableDrag ? inlineStyle : {}} 
                rows={1}
                spellCheck={false}
            />
        </div>
    );
};

// ... SectionControlWrapper ...
const SectionControlWrapper: React.FC<{ 
    children: React.ReactNode; 
    type: SectionType; 
    index: number; 
    isEditMode: boolean; 
    isFirst: boolean; 
    isLast: boolean; 
    onMove: (idx: number, dir: -1 | 1) => void; 
    onDelete?: () => void;
}> = ({ children, type, index, isEditMode, isFirst, isLast, onMove, onDelete }) => {
    return (
        <div className="relative group/section w-full">
            {isEditMode && (
                <div className="absolute left-[-50px] top-4 flex flex-col gap-1 z-50 opacity-40 hover:opacity-100 transition-opacity">
                    <button onClick={() => onMove(index, -1)} disabled={isFirst} className="p-1.5 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 shadow-sm">
                        <ChevronUpIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onMove(index, 1)} disabled={isLast} className="p-1.5 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 shadow-sm">
                        <ChevronDownIcon className="w-5 h-5" />
                    </button>
                    {onDelete && (
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} 
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="p-1.5 bg-white border border-red-300 rounded-lg text-red-500 hover:bg-red-50 shadow-sm cursor-pointer z-50 pointer-events-auto" 
                            title="섹션 삭제"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                    <div className="text-[9px] text-gray-400 text-center font-mono mt-1 font-bold">{index + 1}</div>
                </div>
            )}
            {children}
        </div>
    );
};

export const ResultPreview: React.FC<ResultPreviewProps> = ({ copy, images, productName, category, onReset }) => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [pointLayout, setPointLayout] = useState<PointLayoutType>('ZIGZAG');
  const [pointIconStyle, setPointIconStyle] = useState<PointIconStyle>('EMOJI');
  const [pointTheme, setPointTheme] = useState<PointThemeColor>(getThemeByCategory(category));
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>(['HERO', 'STORY', 'POINTS', 'OPTIONS', 'DETAILS', 'INFO']);

  const [cropTarget, setCropTarget] = useState<{ id: string, url: string, type: 'MAIN' | 'DETAIL' | 'POINT' | 'POINT_SIDE' | 'OPTION' } | null>(null);
  const [activeAiMenuId, setActiveAiMenuId] = useState<string | null>(null);

  const [editableProductName, setEditableProductName] = useState(productName);
  const [editableCopy, setEditableCopy] = useState<GeneratedCopy>(copy);
  
  const [headers, setHeaders] = useState(getHeadersByCategory(category));
  const [copyright, setCopyright] = useState("MARKETPIA BEST OF BEST");

  const [infoLabels, setInfoLabels] = useState({
      product: "제품명",
      material: "소재",
      color: "색상",
      origin: "제조국",
      wash: "세탁방법",
      imgRef: "이미지 참조",
      washGuide: "미지근한 물에 중성세제로 손세탁 또는 세탁망에 넣어 울코스 세탁을 권장합니다"
  });

  const [disclaimerText, setDisclaimerText] = useState(
      "본 제품은 모니터 해상도 상 실제 제품과 색상 차이가 있을 수 있습니다\n" +
      "본 제품은 실측 사이즈는 재는 위치나 방식에 따라 약간의 오차가 발생 할 수 있습니다\n" +
      "본 제품은 14세 이상 사용 가능합니다"
  );

  const [visibleHeaders, setVisibleHeaders] = useState({
      heroSubtitle: true,
      heroBadge: true,
      newArrival: true,
      moodStory: true,
      whySub: true
  });

  const [mainImage, setMainImage] = useState<string | null>(null);
  const [detailBlocks, setDetailBlocks] = useState<DetailBlock[]>([]);
  const [pointBlocks, setPointBlocks] = useState<PointBlock[]>([]);
  const [optionBlocks, setOptionBlocks] = useState<OptionBlock[]>([]);
  const [isProcessingMain, setIsProcessingMain] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null); 

  useEffect(() => {
    setEditableProductName(productName);
  }, [productName]);

  useEffect(() => {
    const newCopy = { ...copy };
    if (newCopy.productInfo) {
        newCopy.productInfo.origin = "Made in China";
    }
    setEditableCopy(newCopy);
    setEditableProductName(productName);
    
    const propMain = images.find(img => img.type === 'main')?.processedUrl;
    if (propMain) setMainImage(propMain);

    const propDetails = images.filter(img => img.type === 'detail').map(img => img.processedUrl).filter(Boolean) as string[];
    const initialDetailBlocks: DetailBlock[] = propDetails.map((url, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        type: 'IMAGE',
        content: url,
        width: 'FULL'
    }));
    if (copy.mdComment) {
        initialDetailBlocks.unshift({
            id: `text-md-${Date.now()}`,
            type: 'TEXT',
            content: `[MD's Pick]\n\n${copy.mdComment}`,
            width: 'FULL',
            style: { fontSize: 'text-4xl', fontFamily: 'font-sans', color: 'text-gray-800', align: 'text-center', fontWeight: 'font-medium', maxWidth: 'max-w-4xl', backgroundColor: 'bg-yellow-50' }
        });
    }
    setDetailBlocks(initialDetailBlocks);

    const propOptions = images.filter(img => img.type === 'option').map(img => img.processedUrl).filter(Boolean) as string[];
    const initialOptionBlocks: OptionBlock[] = propOptions.map((url, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        image: url,
        text: '옵션 설명을 입력하세요'
    }));
    setOptionBlocks(initialOptionBlocks);

    const initialPointBlocks: PointBlock[] = copy.sellingPoints.map((p, i) => ({
        id: `pt-${Date.now()}-${i}`,
        type: 'POINT_ITEM',
        icon: p.icon,
        title: p.title,
        description: p.description
    }));
    setPointBlocks(initialPointBlocks);

  }, [copy, images, productName]);

  useEffect(() => {
    setPointTheme(getThemeByCategory(category));
    setHeaders(prev => ({ ...prev, ...getHeadersByCategory(category) }));
  }, [category]);

  const handleCopyChange = (field: keyof GeneratedCopy, value: any) => {
    setEditableCopy(prev => ({ ...prev, [field]: value }));
  };
  const handleHeaderChange = (field: keyof typeof headers, value: string) => {
      setHeaders(prev => ({ ...prev, [field]: value }));
  };
  const handleInfoLabelChange = (field: keyof typeof infoLabels, value: string) => {
      setInfoLabels(prev => ({ ...prev, [field]: value }));
  };
  const toggleHeaderVisibility = (field: keyof typeof visibleHeaders) => {
      setVisibleHeaders(prev => ({ ...prev, [field]: !prev[field] }));
  };
  const moveSection = (index: number, direction: -1 | 1) => {
      const newOrder = [...sectionOrder];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return;
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setSectionOrder(newOrder);
  };
  const removeSection = (type: SectionType) => {
      setSectionOrder(prev => prev.filter(s => s !== type));
  };

  const openCropper = (id: string, url: string, type: 'MAIN' | 'DETAIL' | 'POINT' | 'POINT_SIDE' | 'OPTION') => {
      setCropTarget({ id, url, type });
  };
  const handleCropComplete = (croppedUrl: string) => {
      if (!cropTarget) return;
      if (cropTarget.type === 'MAIN') setMainImage(croppedUrl);
      else if (cropTarget.type === 'DETAIL') updateBlockContent(cropTarget.id, croppedUrl);
      else if (cropTarget.type === 'POINT') updatePointBlock(cropTarget.id, 'content', croppedUrl);
      else if (cropTarget.type === 'POINT_SIDE') updatePointBlock(cropTarget.id, 'sideImage', croppedUrl);
      else if (cropTarget.type === 'OPTION') updateOptionBlock(cropTarget.id, 'image', croppedUrl);
      setCropTarget(null);
  };
  
  const handleImageDrop = (e: React.DragEvent, id: string, callback: (file: File) => void) => {
      if (!isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          callback(e.dataTransfer.files[0]);
      }
  };
  const handleDragEnter = (e: React.DragEvent, id: string) => {
      if (!isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(id);
  };
  const handleDragLeave = (e: React.DragEvent) => {
      if (!isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);
  };

  const updatePointBlock = (id: string, field: keyof PointBlock, value: any) => {
      setPointBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  const addPointItem = () => {
      setPointBlocks(prev => [...prev, { id: `pt-new-${Date.now()}`, type: 'POINT_ITEM', icon: '✨', title: '새로운 포인트', description: '내용을 입력해주세요.' }]);
  };
  const addPointBlock = (type: 'IMAGE' | 'TEXT') => {
      setPointBlocks(prev => [...prev, { id: `pt-blk-${Date.now()}`, type, content: type === 'IMAGE' ? '' : '새로운 설명 텍스트입니다.', width: 'FULL', style: { fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-gray-600', align: 'text-center', fontWeight: 'font-normal', maxWidth: 'max-w-4xl' } }]);
  };
  const movePointBlock = (index: number, direction: -1 | 1) => {
      const newBlocks = [...pointBlocks];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      setPointBlocks(newBlocks);
  };
  const removePointBlock = (id: string) => {
      setPointBlocks(prev => prev.filter(b => b.id !== id));
  };
  const togglePointBlockWidth = (id: string) => {
    setPointBlocks(prev => prev.map(b => {
        if (b.id !== id) return b;
        const next = b.width === 'FULL' ? 'HALF' : b.width === 'HALF' ? 'THIRD' : 'FULL';
        return { ...b, width: next || 'FULL' };
    }));
  };
  const handlePointImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          updatePointBlock(id, 'content', url);
          openCropper(id, url, 'POINT'); 
      }
  };
  const handlePointSideImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          updatePointBlock(id, 'sideImage', url);
          openCropper(id, url, 'POINT_SIDE');
      }
  };
  
  const addOptionBlock = () => {
      setOptionBlocks(prev => [...prev, { id: `opt-${Date.now()}`, image: '', text: '옵션 설명' }]);
  };
  const updateOptionBlock = (id: string, field: keyof OptionBlock, value: string) => {
      setOptionBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  const removeOptionBlock = (id: string) => {
      setOptionBlocks(prev => prev.filter(b => b.id !== id));
  };
  const handleOptionImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          updateOptionBlock(id, 'image', url);
          openCropper(id, url, 'OPTION');
      }
  };

  const handleProductInfoChange = (field: keyof GeneratedCopy['productInfo'], value: string) => {
    setEditableCopy(prev => ({ ...prev, productInfo: { ...prev.productInfo, [field]: value } }));
  };
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const url = URL.createObjectURL(e.target.files[0]);
        setMainImage(url);
        openCropper('main', url, 'MAIN');
    }
  };
  const addDetailBlock = (type: BlockType) => {
      const newBlock: DetailBlock = { 
          id: `block-${Date.now()}`, 
          type, 
          content: type === 'IMAGE' ? '' : '새로운 텍스트 블록입니다.\n클릭하여 내용을 수정하세요.', 
          width: 'FULL',
          style: { fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-gray-800', align: 'text-center', fontWeight: 'font-normal', maxWidth: 'max-w-4xl' } 
      };
      if (type === 'SIZE_CHART') {
          newBlock.content = 'SIZE CHART (cm)';
          newBlock.tableData = [
              ['사이즈', '총장', '어깨', '가슴', '소매'],
              ['M', '67', '53', '112', '52'],
              ['L', '69', '55', '116', '53'],
              ['XL', '71', '57', '120', '54'],
              ['2XL', '73', '59', '124', '52']
          ];
      }
      setDetailBlocks(prev => [...prev, newBlock]);
  };
  const updateBlockContent = (id: string, content: string) => {
      setDetailBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };
  const toggleBlockWidth = (id: string) => {
      setDetailBlocks(prev => prev.map(b => {
          if (b.id !== id) return b;
          const next = b.width === 'FULL' ? 'HALF' : b.width === 'HALF' ? 'THIRD' : 'FULL';
          return { ...b, width: next };
      }));
  };
  const moveBlock = (index: number, direction: -1 | 1) => {
      const newBlocks = [...detailBlocks];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      setDetailBlocks(newBlocks);
  };
  const removeBlock = (id: string) => {
      setDetailBlocks(prev => prev.filter(b => b.id !== id));
  };
  const handleBlockImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          updateBlockContent(id, url);
          openCropper(id, url, 'DETAIL');
      }
  };
  const addOverlayText = (id: string) => {
      setDetailBlocks(prev => prev.map(b => b.id === id ? { ...b, overlayText: '텍스트 입력', overlayStyle: { fontSize: 'text-4xl', fontFamily: 'font-sans', color: 'text-white', align: 'text-center', verticalAlign: 'justify-center', fontWeight: 'font-bold', x: 50, y: 50 } } : b));
  };
  const updateOverlayText = (id: string, text: string) => {
      setDetailBlocks(prev => prev.map(b => b.id === id ? { ...b, overlayText: text } : b));
  };
  const updateOverlayStyle = (id: string, style: TextStyle) => {
      setDetailBlocks(prev => prev.map(b => b.id === id ? { ...b, overlayStyle: style } : b));
  };
  const removeOverlayText = (id: string) => {
      setDetailBlocks(prev => prev.map(b => b.id === id ? { ...b, overlayText: undefined } : b));
  };
  const updateTableCell = (blockId: string, rIdx: number, cIdx: number, val: string) => {
      setDetailBlocks(prev => prev.map(b => {
          if (b.id !== blockId || !b.tableData) return b;
          const newData = [...b.tableData];
          newData[rIdx] = [...newData[rIdx]];
          newData[rIdx][cIdx] = val;
          return { ...b, tableData: newData };
      }));
  };
  const addTableRow = (blockId: string) => {
      setDetailBlocks(prev => prev.map(b => {
          if (b.id !== blockId || !b.tableData) return b;
          const colCount = b.tableData[0].length;
          return { ...b, tableData: [...b.tableData, Array(colCount).fill('-')] };
      }));
  };
  const removeTableRow = (blockId: string) => {
      setDetailBlocks(prev => prev.map(b => {
          if (b.id !== blockId || !b.tableData || b.tableData.length <= 1) return b;
          const newData = [...b.tableData];
          newData.pop();
          return { ...b, tableData: newData };
      }));
  };
  const addTableCol = (blockId: string) => {
      setDetailBlocks(prev => prev.map(b => {
          if (b.id !== blockId || !b.tableData) return b;
          return { ...b, tableData: b.tableData.map(row => [...row, '-']) };
      }));
  };
  const removeTableCol = (blockId: string) => {
      setDetailBlocks(prev => prev.map(b => {
          if (b.id !== blockId || !b.tableData || b.tableData[0].length <= 1) return b;
          return { ...b, tableData: b.tableData.map(row => {
              const newRow = [...row];
              newRow.pop();
              return newRow;
          }) };
      }));
  };

  const saveCanvasToFile = async (canvas: HTMLCanvasElement, filename: string) => {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (!blob) {
          alert("이미지 데이터 생성에 실패했습니다.");
          return;
      }

      let handle: any = null;
      try {
          if ('showSaveFilePicker' in window) {
              try {
                  handle = await (window as any).showSaveFilePicker({
                      suggestedName: filename,
                      types: [{
                          description: 'JPEG Image',
                          accept: { 'image/jpeg': ['.jpg'] },
                      }],
                  });
              } catch (err: any) {
                  if (err.name === 'AbortError') return; 
              }
          }
      } catch (e) {
          console.warn("File System API not supported, falling back.");
      }

      if (handle) {
          try {
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              return;
          } catch(e) {
              console.error("Write failed", e);
          }
      }

      try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Legacy download failed", e);
          alert("저장에 실패했습니다.");
      }
  };

  const handleDownloadSizeChart = async (blockId: string) => {
      const element = document.getElementById(`size-chart-${blockId}`);
      if (!element) return;
      try {
          const canvas = await (window as any).html2canvas(element, { 
              scale: 2, 
              useCORS: true, 
              allowTaint: false, 
              backgroundColor: '#ffffff',
              onclone: (doc: any) => {
                  const el = doc.getElementById(`size-chart-${blockId}`);
                  if (el) {
                      el.style.padding = '40px'; 
                      const textareas = el.querySelectorAll('textarea');
                      textareas.forEach((ta: any) => {
                          ta.style.height = (ta.scrollHeight + 10) + 'px';
                      });
                  }
              }
          });
          await saveCanvasToFile(canvas, '사이즈표.jpg');
      } catch (e) {
          console.error(e);
          alert('사이즈표 저장 실패');
      }
  };

  const handleAiProcessMain = async (mode: ImageProcessMode) => {
      if (!mainImage) return;
      setIsProcessingMain(true);
      setActiveAiMenuId(null);
      try {
        const response = await fetch(mainImage);
        const blob = await response.blob();
        const file = new File([blob], "image.png", { type: blob.type });
        const newUrl = await processProductImage(file, mode);
        setMainImage(newUrl);
      } catch (e) {
          alert("이미지 처리 실패");
      } finally {
          setIsProcessingMain(false);
      }
  };

  const handleAiProcessBlock = async (blockId: string, imgUrl: string, section: 'DETAIL' | 'POINT', mode: ImageProcessMode) => {
      setActiveAiMenuId(null);
      if (section === 'DETAIL') {
        setDetailBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isProcessing: true } : b));
      } else {
        setPointBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isProcessing: true } : b));
      }
      try {
          const response = await fetch(imgUrl);
          const blob = await response.blob();
          const file = new File([blob], "detail.png", { type: blob.type });
          const newUrl = await processProductImage(file, mode);
          if (section === 'DETAIL') updateBlockContent(blockId, newUrl);
          else updatePointBlock(blockId, 'content', newUrl);
      } catch(e) {
          alert("이미지 처리 실패");
      } finally {
        if (section === 'DETAIL') {
            setDetailBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isProcessing: false } : b));
        } else {
            setPointBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isProcessing: false } : b));
        }
      }
  };

  const handleDownloadJpg = async () => {
    if (isEditMode) {
        alert("먼저 '편집 완료' 버튼을 눌러 미리보기 모드로 전환해주세요.");
        return;
    }
    
    setIsDownloading(true);
    // UI 업데이트를 위해 약간의 지연 시간을 둠
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = document.getElementById('capture-area');
    if (!element) {
        setIsDownloading(false);
        return;
    }
    
    window.scrollTo(0, 0);

    try {
      const scrollHeight = element.scrollHeight;
      // 브라우저 캔버스 메모리 한계를 고려하여 스케일 조절 (세로가 길수록 낮은 스케일 사용)
      // 16,384px 또는 32,768px 이상의 캔버스는 대부분의 브라우저에서 렌더링 오류를 일으킴
      const safeScale = scrollHeight > 8000 ? 1 : 1.5;
      
      const canvas = await (window as any).html2canvas(element, { 
          scale: safeScale, 
          useCORS: true, 
          allowTaint: false, 
          backgroundColor: '#ffffff', 
          width: 860, 
          height: scrollHeight,
          logging: false,
          onclone: (doc: any) => { 
              const el = doc.getElementById('capture-area'); 
              if (el) {
                  el.style.transform = 'none'; 
                  el.style.height = 'auto';
                  el.style.maxHeight = 'none';
                  el.style.overflow = 'visible';
                  
                  // 복제된 문서 내의 모든 텍스트영역 높이 재조정
                  const textareas = el.querySelectorAll('textarea');
                  textareas.forEach((ta: any) => {
                      ta.style.height = (ta.scrollHeight + 10) + 'px';
                  });
              }
          } 
      });
      
      if (canvas && canvas.height > 0) {
        await saveCanvasToFile(canvas, '상세이미지.jpg');
      } else {
          throw new Error("캔버스 생성 실패");
      }
    } catch (error) {
      console.error('Download failed', error);
      alert('이미지 생성 중 오류가 발생했습니다. 상세페이지 길이가 너무 길거나 브라우저 메모리가 부족할 수 있습니다.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const renderAiMenu = (id: string, onSelect: (mode: ImageProcessMode) => void) => {
      if (activeAiMenuId !== id) return null;
      return (
          <div className="absolute top-10 right-0 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-1 w-48 flex flex-col gap-1">
              <button onClick={() => onSelect('MAGIC_FIX')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left"><SparklesIcon className="w-4 h-4" /> ✨ 매직 픽스 (종합)</button>
              <button onClick={() => onSelect('MODEL_SWAP')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left"><UserCircleIcon className="w-4 h-4" /> 👤 모델 생성</button>
              <button onClick={() => onSelect('BG_CHANGE')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left"><HomeModernIcon className="w-4 h-4" /> 🏞️ 배경 변경</button>
          </div>
      );
  };

  const renderSectionContent = (type: SectionType) => {
    const theme = THEME_COLORS[pointTheme];
    const catDesign = CATEGORY_DESIGN[category];
    switch (type) {
        case 'HERO': return (
            <div className="w-full flex flex-col">
                {/* 이미지 영역 */}
                <div
                    className={`relative w-full overflow-hidden ${dragOverId === 'main' ? 'ring-4 ring-inset ring-white/50' : ''}`}
                    style={{ background: catDesign.heroBg, minHeight: mainImage ? 'auto' : '560px' }}
                    onDragEnter={(e) => handleDragEnter(e, 'main')}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleImageDrop(e, 'main', (file) => {
                        const url = URL.createObjectURL(file);
                        setMainImage(url);
                        openCropper('main', url, 'MAIN');
                    })}
                >
                    {mainImage ? (
                        <>
                            <img src={mainImage} alt="Main" className="w-full h-auto block" crossOrigin="anonymous" />
                            {/* 하단 그라디언트 오버레이 */}
                            <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: `linear-gradient(to top, ${catDesign.heroBg.split(',')[0].replace('linear-gradient(160deg, ', '')} 0%, transparent 100%)` }} />
                            {isEditMode && (
                                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                                    <label className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg cursor-pointer flex items-center gap-2 px-4 shadow-xl border border-gray-200 transition-all">
                                        <ArrowPathIcon className="w-4 h-4" /> <span className="text-xs font-bold">교체</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                                    </label>
                                    <button onClick={() => openCropper('main', mainImage, 'MAIN')} className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg cursor-pointer flex items-center gap-2 px-4 shadow-xl border border-gray-200 transition-all text-xs font-bold">
                                        <ScissorsIcon className="w-4 h-4" /> 자르기
                                    </button>
                                    <div className="relative">
                                        <button onClick={() => setActiveAiMenuId(activeAiMenuId === 'MAIN' ? null : 'MAIN')} disabled={isProcessingMain} className="text-white p-2 rounded-lg flex items-center gap-2 px-4 shadow-xl text-xs font-bold w-full justify-center" style={{ background: catDesign.pointPanel }}>
                                            {isProcessingMain ? "..." : <SparklesIcon className="w-4 h-4" />} AI 편집
                                        </button>
                                        {renderAiMenu('MAIN', (mode) => handleAiProcessMain(mode))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <label className="w-full h-[560px] flex flex-col items-center justify-center cursor-pointer group">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 border-2 border-dashed" style={{ borderColor: catDesign.heroAccent }}>
                                <PhotoIcon className="w-10 h-10" style={{ color: catDesign.heroAccent }} />
                            </div>
                            <span className="text-xl font-bold mb-2" style={{ color: catDesign.heroAccent }}>대표 이미지 업로드</span>
                            <span className="text-sm" style={{ color: `${catDesign.heroAccent}88` }}>또는 드래그 & 드롭</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                        </label>
                    )}

                    {/* 뱃지 - 이미지 위 */}
                    <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
                        {visibleHeaders.heroSubtitle && (
                            <EditableElement key={`sub-${pointTheme}`} value={headers.heroSubtitle} onChange={(v) => handleHeaderChange('heroSubtitle', v)} isEditMode={isEditMode} onDelete={() => toggleHeaderVisibility('heroSubtitle')} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-white', align: 'text-left', fontWeight: 'font-bold' }} className="px-4 py-2 uppercase tracking-[0.25em] text-xs" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderLeft: `3px solid ${catDesign.heroAccent}` }} toolbarPosition="right" />
                        )}
                        {visibleHeaders.heroBadge && (
                            <EditableElement value={headers.heroBadge} onChange={(v) => handleHeaderChange('heroBadge', v)} isEditMode={isEditMode} onDelete={() => toggleHeaderVisibility('heroBadge')} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-white', align: 'text-left', fontWeight: 'font-bold' }} className="px-4 py-2 uppercase tracking-[0.2em] text-xs" style={{ background: `${catDesign.heroAccent}cc`, backdropFilter: 'blur(4px)' }} toolbarPosition="right" />
                        )}
                    </div>
                </div>

                {/* 메인 카피 영역 */}
                <div className="w-full px-12 py-20 text-center relative" style={{ background: catDesign.heroBg }}>
                    {/* 장식선 */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="h-px w-16" style={{ background: catDesign.heroAccent }}></div>
                        {visibleHeaders.newArrival && (
                            <EditableElement key={`new-${pointTheme}`} value={headers.newArrival} onChange={(v) => handleHeaderChange('newArrival', v)} onDelete={() => toggleHeaderVisibility('newArrival')} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-xs', fontFamily: 'font-sans', color: 'text-white', align: 'text-center', fontWeight: 'font-bold' }} className="uppercase tracking-[0.4em] opacity-80" toolbarPosition="right" />
                        )}
                        <div className="h-px w-16" style={{ background: catDesign.heroAccent }}></div>
                    </div>

                    <EditableElement value={editableCopy.mainHook} onChange={(v) => handleCopyChange('mainHook', v)} isEditMode={isEditMode} aiLabel="Hook" defaultStyle={{ fontSize: 'text-5xl', fontFamily: 'font-sans', color: 'text-white', align: 'text-center', fontWeight: 'font-black' }} className="leading-tight mb-10" toolbarPosition="right" />

                    {/* 하단 장식 */}
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <div className="w-2 h-2 rounded-full" style={{ background: catDesign.heroAccent }}></div>
                        <div className="w-8 h-px" style={{ background: catDesign.heroAccent }}></div>
                        <div className="w-2 h-2 rounded-full" style={{ background: catDesign.heroAccent }}></div>
                    </div>
                </div>
            </div>
        );
        case 'STORY': return (
            <div className="w-full relative overflow-hidden" style={{ background: catDesign.storyBg }}>
                {/* 장식 배경 원 */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{ background: catDesign.storyAccent, transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8 pointer-events-none" style={{ background: catDesign.storyAccent, transform: 'translate(-30%, 30%)' }} />

                <div className="relative px-16 py-24 text-center">
                    {/* 섹션 레이블 */}
                    {visibleHeaders.moodStory && (
                        <div className="flex items-center justify-center gap-4 mb-12">
                            <div className="h-px w-12" style={{ background: catDesign.storyAccent }}></div>
                            <EditableElement key={`mood-${pointTheme}`} value={headers.moodStory} onChange={(v) => handleHeaderChange('moodStory', v)} onDelete={() => toggleHeaderVisibility('moodStory')} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-xs', fontFamily: 'font-sans', color: 'text-gray-500', align: 'text-center', fontWeight: 'font-bold' }} className="uppercase tracking-[0.4em]" toolbarPosition="right" />
                            <div className="h-px w-12" style={{ background: catDesign.storyAccent }}></div>
                        </div>
                    )}

                    {/* 대형 인용부호 */}
                    <div className="text-9xl leading-none mb-4 font-serif" style={{ color: `${catDesign.storyAccent}30` }}>"</div>

                    <EditableElement value={editableCopy.story} onChange={(v) => handleCopyChange('story', v)} isEditMode={isEditMode} aiLabel="Story" defaultStyle={{ fontSize: 'text-4xl', fontFamily: 'font-serif-kr', color: 'text-gray-800', align: 'text-center', fontWeight: 'font-medium', maxWidth: 'max-w-4xl' }} className="leading-loose mx-auto" toolbarPosition="right" />

                    {/* 닫는 인용부호 + 장식 */}
                    <div className="text-9xl leading-none mt-4 font-serif" style={{ color: `${catDesign.storyAccent}30` }}>"</div>

                    {/* 하단 장식 */}
                    <div className="mt-12 flex items-center justify-center gap-3">
                        <div className="w-1 h-1 rounded-full" style={{ background: catDesign.storyAccent }}></div>
                        <div className="w-6 h-px" style={{ background: catDesign.storyAccent }}></div>
                        <div className="w-3 h-3 rounded-full border" style={{ borderColor: catDesign.storyAccent }}></div>
                        <div className="w-6 h-px" style={{ background: catDesign.storyAccent }}></div>
                        <div className="w-1 h-1 rounded-full" style={{ background: catDesign.storyAccent }}></div>
                    </div>
                </div>
            </div>
        );
        case 'POINTS': return (
            <div className="w-full relative" style={{ background: catDesign.pointBg }}>
                        {isEditMode && (
                             <div className="absolute top-4 right-10 flex gap-2 flex-wrap justify-end z-10">
                                <div className="flex items-center bg-white/80 rounded-lg p-1 border border-gray-200 shadow-sm">
                                    <button onClick={() => setPointIconStyle('EMOJI')} className={`px-3 py-1 text-xs font-bold rounded ${pointIconStyle === 'EMOJI' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>😊</button>
                                    <button onClick={() => setPointIconStyle('NUMBER')} className={`px-3 py-1 text-xs font-bold rounded ${pointIconStyle === 'NUMBER' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>01</button>
                                    <button onClick={() => setPointIconStyle('NONE')} className={`px-3 py-1 text-xs font-bold rounded ${pointIconStyle === 'NONE' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>—</button>
                                </div>
                             </div>
                        )}

                        {/* 섹션 헤더 */}
                        <div className="text-center pt-24 pb-16 px-10">
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="h-px w-8" style={{ background: catDesign.pointAccent }}></div>
                                {visibleHeaders.whySub && (
                                    <EditableElement key={`whysub-${pointTheme}`} value={headers.whySub} onChange={(v) => handleHeaderChange('whySub', v)} onDelete={() => toggleHeaderVisibility('whySub')} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-xs', fontFamily: 'font-sans', color: 'text-gray-400', align: 'text-center', fontWeight: 'font-bold' }} className="uppercase tracking-[0.4em]" toolbarPosition="right" />
                                )}
                                <div className="h-px w-8" style={{ background: catDesign.pointAccent }}></div>
                            </div>
                            <EditableElement key={`why-${pointTheme}`} value={headers.whyThisItem} onChange={(v) => handleHeaderChange('whyThisItem', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-5xl', fontFamily: 'font-sans', color: 'text-gray-900', align: 'text-center', fontWeight: 'font-black' }} className="leading-tight" toolbarPosition="right" />
                        </div>

                        <div className={`px-10 pb-24 ${pointLayout === 'CARDS' ? 'grid gap-6' : pointLayout === 'SIMPLE' ? 'space-y-8' : 'flex flex-wrap'}`}>
                            {pointBlocks.map((block, idx) => {
                                if (block.type === 'POINT_ITEM') {
                                    return (
                                        <div key={block.id} className={`relative group/point w-full ${pointLayout === 'ZIGZAG' ? `flex ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-stretch min-h-[420px]` : ''} ${pointLayout === 'CARDS' ? 'rounded-2xl overflow-hidden' : ''} ${pointLayout === 'SIMPLE' ? 'flex flex-col items-start pl-10 py-6' : ''}`} style={pointLayout === 'CARDS' ? { background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' } : pointLayout === 'SIMPLE' ? { borderLeft: `4px solid ${catDesign.pointAccent}` } : {}}>
                                            {isEditMode && (
                                                <div className="absolute top-2 left-2 z-30 flex gap-1 opacity-0 group-hover/point:opacity-100 transition-opacity">
                                                    <button onClick={() => movePointBlock(idx, -1)} className="p-2 bg-white text-gray-500 rounded-full shadow border border-gray-200"><ChevronUpIcon className="w-3 h-3"/></button>
                                                    <button onClick={() => movePointBlock(idx, 1)} className="p-2 bg-white text-gray-500 rounded-full shadow border border-gray-200"><ChevronDownIcon className="w-3 h-3"/></button>
                                                    <button onClick={() => removePointBlock(block.id)} className="p-2 bg-red-50 text-red-500 rounded-full shadow border border-gray-200"><TrashIcon className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                            {pointLayout === 'ZIGZAG' && (
                                                <>
                                                    <div className="flex-1 p-14 flex flex-col justify-center bg-white relative">
                                                        {pointIconStyle !== 'NONE' && (
                                                            <div className="mb-6">
                                                                {pointIconStyle === 'NUMBER'
                                                                    ? <span className="text-7xl font-black opacity-15" style={{ color: catDesign.pointAccent }}>{`0${idx + 1}`}</span>
                                                                    : <span className="text-5xl">{block.icon}</span>
                                                                }
                                                            </div>
                                                        )}
                                                        {/* 악센트 라인 */}
                                                        <div className="w-10 h-1 mb-6 rounded-full" style={{ background: catDesign.pointAccent }}></div>
                                                        <EditableElement value={block.title || ''} onChange={(v) => updatePointBlock(block.id, 'title', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-4xl', fontFamily: 'font-sans', color: 'text-gray-900', align: 'text-left', fontWeight: 'font-black', maxWidth: 'max-w-2xl' }} className="mb-5 leading-tight" toolbarPosition="right" />
                                                        <EditableElement value={block.description || ''} onChange={(v) => updatePointBlock(block.id, 'description', v)} isEditMode={isEditMode} aiLabel="Point Desc" defaultStyle={{ fontSize: 'text-xl', fontFamily: 'font-sans', color: 'text-gray-500', align: 'text-left', fontWeight: 'font-medium', maxWidth: 'max-w-xl' }} className="leading-loose" toolbarPosition="right" />
                                                    </div>
                                                    <div
                                                        className={`w-2/5 flex items-center justify-center relative group/side overflow-hidden ${dragOverId === block.id ? 'ring-4 ring-inset ring-white/50' : ''}`}
                                                        style={{ background: block.sideImage ? 'transparent' : catDesign.pointPanel }}
                                                        onDragEnter={(e) => handleDragEnter(e, block.id)}
                                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleImageDrop(e, block.id, (file) => {
                                                            const url = URL.createObjectURL(file);
                                                            updatePointBlock(block.id, 'sideImage', url);
                                                            openCropper(block.id, url, 'POINT_SIDE');
                                                        })}
                                                    >
                                                        {block.sideImage ? (
                                                            <>
                                                                <img src={block.sideImage} alt="Point Side" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                                {isEditMode && (
                                                                    <div className="absolute top-2 right-2 z-40 flex gap-1 opacity-0 group-hover/side:opacity-100 transition-opacity">
                                                                        <label className="bg-white hover:bg-gray-50 text-gray-800 p-1.5 rounded-lg cursor-pointer shadow-lg border border-gray-200">
                                                                            <ArrowPathIcon className="w-4 h-4" />
                                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePointSideImageUpload(block.id, e)} />
                                                                        </label>
                                                                        <button onClick={() => openCropper(block.id, block.sideImage!, 'POINT_SIDE')} className="bg-white text-gray-800 p-1.5 rounded-lg cursor-pointer shadow-lg border border-gray-200 hover:bg-gray-50"><ScissorsIcon className="w-4 h-4" /></button>
                                                                        <button onClick={() => updatePointBlock(block.id, 'sideImage', undefined)} className="bg-white text-red-500 p-1.5 rounded-lg cursor-pointer shadow-lg border border-gray-200 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden" style={{ background: catDesign.pointPanel }}>
                                                                {/* 장식 원 */}
                                                                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: catDesign.pointAccent, transform: 'translate(30%, -30%)' }} />
                                                                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ background: catDesign.pointAccent, transform: 'translate(-30%, 30%)' }} />
                                                                {/* 번호 */}
                                                                <div className="text-8xl font-black mb-4 opacity-20" style={{ color: catDesign.pointAccent }}>{`0${idx+1}`}</div>
                                                                {isEditMode && (
                                                                    <label className="flex flex-col items-center cursor-pointer px-5 py-3 rounded-xl border border-dashed group/upload relative z-10" style={{ borderColor: `${catDesign.pointAccent}60` }}>
                                                                        <PhotoIcon className="w-6 h-6 mb-2" style={{ color: catDesign.pointAccent }} />
                                                                        <span className="text-xs font-bold" style={{ color: catDesign.pointAccent }}>이미지 추가</span>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePointSideImageUpload(block.id, e)} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                            {pointLayout === 'CARDS' && (
                                                <div className="flex flex-col items-center text-center w-full p-12 relative overflow-hidden">
                                                    {/* 배경 장식 */}
                                                    <div className="absolute top-0 left-0 right-0 h-2" style={{ background: catDesign.pointAccent }}></div>
                                                    {/* 번호 배지 */}
                                                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl mb-6 shadow-lg" style={{ background: catDesign.pointPanel }}>
                                                        {pointIconStyle === 'NUMBER' ? `0${idx+1}` : pointIconStyle === 'EMOJI' ? block.icon : `0${idx+1}`}
                                                    </div>
                                                    <EditableElement value={block.title || ''} onChange={(v) => updatePointBlock(block.id, 'title', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-3xl', fontFamily: 'font-sans', color: 'text-gray-900', align: 'text-center', fontWeight: 'font-black' }} className="mb-3" toolbarPosition="right" />
                                                    <div className="w-8 h-0.5 mb-5 rounded-full" style={{ background: catDesign.pointAccent }}></div>
                                                    <EditableElement value={block.description || ''} onChange={(v) => updatePointBlock(block.id, 'description', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-lg', fontFamily: 'font-sans', color: 'text-gray-500', align: 'text-center', fontWeight: 'font-normal', maxWidth: 'max-w-2xl' }} className="leading-loose" toolbarPosition="right" />
                                                </div>
                                            )}
                                            {pointLayout === 'SIMPLE' && (
                                                <div className="w-full py-4">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        {pointIconStyle !== 'NONE' && (
                                                            <span className="text-3xl">{pointIconStyle === 'NUMBER'
                                                                ? <span className="font-black text-2xl" style={{ color: catDesign.pointAccent }}>{`0${idx + 1}`}</span>
                                                                : block.icon}
                                                            </span>
                                                        )}
                                                        <EditableElement value={block.title || ''} onChange={(v) => updatePointBlock(block.id, 'title', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-3xl', fontFamily: 'font-sans', color: 'text-gray-900', align: 'text-left', fontWeight: 'font-bold' }} className="" toolbarPosition="right" />
                                                    </div>
                                                    <EditableElement value={block.description || ''} onChange={(v) => updatePointBlock(block.id, 'description', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-lg', fontFamily: 'font-sans', color: 'text-gray-500', align: 'text-left', fontWeight: 'font-normal', maxWidth: 'max-w-4xl' }} className="leading-loose pl-2" toolbarPosition="right" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else if (block.type === 'IMAGE') {
                                    const widthClass = block.width === 'HALF' ? 'w-1/2' : block.width === 'THIRD' ? 'w-1/3' : 'w-full';
                                    const toggleLabel = block.width === 'FULL' ? '◩ 2단' : block.width === 'HALF' ? '▦ 3단' : '⬛ 꽉참';
                                    return (
                                        <div key={block.id} className={`relative group ${widthClass} p-2`}>
                                            <div 
                                                className={`w-full h-full relative min-h-[200px] bg-gray-100 flex items-center justify-center rounded-xl overflow-hidden ${dragOverId === block.id ? 'border-4 border-dashed border-indigo-500' : ''}`}
                                                onDragEnter={(e) => handleDragEnter(e, block.id)}
                                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleImageDrop(e, block.id, (file) => {
                                                    const url = URL.createObjectURL(file);
                                                    updatePointBlock(block.id, 'content', url);
                                                    openCropper(block.id, url, 'POINT');
                                                })}
                                            >
                                                {block.content ? (
                                                    <>
                                                        <img src={block.content} alt="Point Detail" className="w-full h-auto block" crossOrigin="anonymous" />
                                                        {isEditMode && (
                                                            <div className="absolute top-2 right-2 z-50 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap justify-end">
                                                                <button onClick={() => movePointBlock(idx, -1)} className="p-1 bg-white text-gray-500 rounded shadow hover:text-indigo-600"><ChevronUpIcon className="w-4 h-4"/></button>
                                                                <button onClick={() => movePointBlock(idx, 1)} className="p-1 bg-white text-gray-500 rounded shadow hover:text-indigo-600"><ChevronDownIcon className="w-4 h-4"/></button>
                                                                <button onClick={() => togglePointBlockWidth(block.id)} className="bg-white text-gray-700 p-1 rounded shadow text-xs font-bold hover:bg-indigo-50 w-14">{toggleLabel}</button>
                                                                <label className="bg-white hover:bg-gray-50 text-gray-800 p-1 rounded cursor-pointer shadow border border-gray-200"><ArrowPathIcon className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e) => handlePointImageUpload(block.id, e)} /></label>
                                                                <button onClick={() => openCropper(block.id, block.content!, 'POINT')} className="bg-white text-gray-800 p-1 rounded cursor-pointer shadow border border-gray-200 hover:bg-gray-50"><ScissorsIcon className="w-4 h-4" /></button>
                                                                <button onClick={() => removePointBlock(block.id)} className="p-1 bg-red-50 text-red-500 rounded shadow hover:bg-red-100"><TrashIcon className="w-4 h-4"/></button>
                                                                <div className="relative">
                                                                    <button onClick={() => setActiveAiMenuId(activeAiMenuId === block.id ? null : block.id)} disabled={block.isProcessing} className="bg-indigo-600 text-white p-1 rounded shadow border border-indigo-400">{block.isProcessing ? "..." : <SparklesIcon className="w-4 h-4" />}</button>
                                                                    {renderAiMenu(block.id, (mode) => handleAiProcessBlock(block.id, block.content!, 'POINT', mode))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-gray-400 hover:text-gray-600 relative">
                                                        {isEditMode && (
                                                            <div className="absolute top-2 right-2 z-50 flex gap-1">
                                                                <button onClick={() => movePointBlock(idx, -1)} className="p-1 bg-white text-gray-500 rounded shadow hover:text-indigo-600"><ChevronUpIcon className="w-4 h-4"/></button>
                                                                <button onClick={() => movePointBlock(idx, 1)} className="p-1 bg-white text-gray-500 rounded shadow hover:text-indigo-600"><ChevronDownIcon className="w-4 h-4"/></button>
                                                                <button onClick={() => togglePointBlockWidth(block.id)} className="bg-white text-gray-700 p-1 rounded shadow text-xs font-bold hover:bg-indigo-50 w-14">{toggleLabel}</button>
                                                                <button onClick={() => removePointBlock(block.id)} className="p-1 bg-red-50 text-red-500 rounded shadow hover:bg-red-100"><TrashIcon className="w-4 h-4"/></button>
                                                            </div>
                                                        )}
                                                        <label className="flex flex-col items-center cursor-pointer relative z-10"><PhotoIcon className="w-8 h-8 mb-2" /><span className="text-sm font-bold">이미지 업로드</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handlePointImageUpload(block.id, e)} /></label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                } else if (block.type === 'TEXT') {
                                    return (
                                        <div key={block.id} className="relative group w-full py-4 px-2">
                                            {isEditMode && (
                                                 <div className="absolute top-0 right-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => movePointBlock(idx, -1)} className="p-2 bg-white text-gray-500 rounded shadow hover:text-indigo-600"><ChevronUpIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => movePointBlock(idx, 1)} className="p-2 bg-white text-gray-500 rounded shadow hover:text-indigo-600"><ChevronDownIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => removePointBlock(block.id)} className="p-2 bg-red-50 text-red-500 rounded shadow hover:bg-red-100"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            )}
                                            <EditableElement value={block.content || ''} onChange={(v) => updatePointBlock(block.id, 'content', v)} onStyleChange={(s) => setPointBlocks(prev => prev.map(b => b.id === block.id ? { ...b, style: s } : b))} isEditMode={isEditMode} aiLabel="Text" defaultStyle={block.style || { fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-gray-600', align: 'text-center', fontWeight: 'font-normal', maxWidth: 'max-w-4xl' }} className="p-6 rounded-xl leading-normal" toolbarPosition="right" />
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        {isEditMode && (
                            <div className="w-full flex justify-center gap-3 mt-12">
                                <button onClick={addPointItem} className="flex items-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full font-bold transition-all border border-indigo-200"><PlusIcon className="w-5 h-5" /> 포인트 추가</button>
                                <button onClick={() => addPointBlock('IMAGE')} className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-600 rounded-full font-bold transition-all border border-gray-300 shadow-sm"><PhotoIcon className="w-5 h-5" /> 이미지 추가</button>
                                <button onClick={() => addPointBlock('TEXT')} className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-600 rounded-full font-bold transition-all border border-gray-300 shadow-sm"><DocumentTextIcon className="w-5 h-5" /> 텍스트 추가</button>
                            </div>
                        )}
                </div>
        );
        case 'OPTIONS': return (
            <div className="w-full py-20 bg-gray-50 border-t border-gray-200">
                    <div className="text-center mb-10">
                        <EditableElement value="COLORS & OPTIONS" onChange={() => {}} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-4xl', fontFamily: 'font-sans', color: 'text-gray-900', align: 'text-center', fontWeight: 'font-black' }} className="uppercase tracking-widest leading-normal" toolbarPosition="right" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 px-6">
                        {optionBlocks.length === 0 && <div className="text-gray-400">옵션 이미지가 없습니다. 상단에서 추가하거나 아래 버튼을 눌러주세요.</div>}
                        {optionBlocks.map((block) => (
                            <div key={block.id} className="flex flex-col items-center w-[260px] group relative">
                                {isEditMode && (
                                    <button onClick={() => removeOptionBlock(block.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 z-30 opacity-0 group-hover:opacity-100 transition-opacity"><XMarkIcon className="w-4 h-4"/></button>
                                )}
                                <div 
                                    className={`w-full aspect-[3/4] bg-white rounded-lg shadow-sm overflow-hidden relative mb-4 ${dragOverId === block.id ? 'border-4 border-dashed border-indigo-500' : ''}`}
                                    onDragEnter={(e) => handleDragEnter(e, block.id)}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleImageDrop(e, block.id, (file) => {
                                        const url = URL.createObjectURL(file);
                                        updateOptionBlock(block.id, 'image', url);
                                        openCropper(block.id, url, 'OPTION');
                                    })}
                                >
                                    {block.image ? (
                                        <>
                                            <img src={block.image} alt="Option" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                            {isEditMode && (
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <label className="bg-white/90 p-1.5 rounded shadow cursor-pointer hover:bg-white"><ArrowPathIcon className="w-4 h-4 text-gray-700"/><input type="file" className="hidden" accept="image/*" onChange={(e) => handleOptionImageUpload(block.id, e)} /></label>
                                                    <button onClick={() => openCropper(block.id, block.image, 'OPTION')} className="bg-white/90 p-1.5 rounded shadow hover:bg-white"><ScissorsIcon className="w-4 h-4 text-gray-700"/></button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 text-gray-300 hover:text-gray-500"><PhotoIcon className="w-10 h-10 mb-2"/><span className="text-xs">이미지 추가</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleOptionImageUpload(block.id, e)} /></label>
                                    )}
                                </div>
                                <EditableElement value={block.text} onChange={(v) => updateOptionBlock(block.id, 'text', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-gray-700', align: 'text-center', fontWeight: 'font-bold' }} toolbarPosition="right" />
                            </div>
                        ))}
                        {isEditMode && (
                            <button onClick={addOptionBlock} className="w-[260px] aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all">
                                <PlusIcon className="w-10 h-10 mb-2" />
                                <span className="font-bold">옵션 추가</span>
                            </button>
                        )}
                    </div>
                </div>
        );
        case 'DETAILS': return (
                     <div className="w-full bg-gray-50 pb-20">
                        <div className="w-full py-16 text-center">
                            <EditableElement key={`detail-${pointTheme}`} value={headers.detailView} onChange={(v) => handleHeaderChange('detailView', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-gray-900', align: 'text-center', fontWeight: 'font-bold' }} className="inline-block border-2 border-gray-900 px-10 py-4 tracking-[0.2em] uppercase bg-white w-80" toolbarPosition="right" />
                        </div>
                        <div className="w-full flex flex-wrap">
                            {detailBlocks.map((block, bIdx) => {
                                const widthClass = block.width === 'FULL' ? 'w-full' : block.width === 'HALF' ? 'w-1/2' : 'w-1/3';
                                const toggleLabel = block.width === 'FULL' ? '◩ 2단' : block.width === 'HALF' ? '▦ 3단' : '⬛ 꽉참';
                                return (
                                <div key={block.id} className={`relative group border-b border-gray-100/50 ${widthClass}`}>
                                    {isEditMode && (
                                        <div className="absolute top-4 right-4 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveBlock(bIdx, -1)} className="bg-white text-gray-500 p-2 rounded shadow border border-gray-200 hover:text-indigo-600 hover:bg-indigo-50"><ChevronUpIcon className="w-4 h-4"/></button>
                                            <button onClick={() => moveBlock(bIdx, 1)} className="bg-white text-gray-500 p-2 rounded shadow border border-gray-200 hover:text-indigo-600 hover:bg-indigo-50"><ChevronDownIcon className="w-4 h-4"/></button>
                                            <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
                                            {block.type === 'IMAGE' && ( <button onClick={() => block.overlayText ? removeOverlayText(block.id) : addOverlayText(block.id)} className="bg-white text-gray-700 p-2 rounded shadow border border-gray-200 hover:bg-indigo-50 font-bold w-8 h-8 flex items-center justify-center">T</button> )}
                                            {block.type === 'SIZE_CHART' && ( <button onClick={() => handleDownloadSizeChart(block.id)} className="bg-white text-blue-600 p-2 rounded shadow border border-gray-200 hover:bg-blue-50 font-bold w-auto px-3 flex items-center gap-1 text-xs"><ArrowDownTrayIcon className="w-4 h-4" /> 표 저장</button> )}
                                            <button onClick={() => toggleBlockWidth(block.id)} className="bg-white text-gray-700 p-2 rounded shadow border border-gray-200 text-xs font-bold hover:bg-indigo-50 w-16">{toggleLabel}</button>
                                            <button onClick={() => removeBlock(block.id)} className="bg-white text-red-600 p-2 rounded shadow border border-gray-200 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                    {block.type === 'IMAGE' && (
                                        <div 
                                            className={`w-full relative min-h-[200px] bg-gray-200 flex items-center justify-center ${dragOverId === block.id ? 'border-4 border-dashed border-indigo-500' : ''}`}
                                            onDragEnter={(e) => handleDragEnter(e, block.id)}
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleImageDrop(e, block.id, (file) => {
                                                const url = URL.createObjectURL(file);
                                                updateBlockContent(block.id, url);
                                                openCropper(block.id, url, 'DETAIL');
                                            })}
                                        >
                                            {block.content ? (
                                                <>
                                                    <img src={block.content} alt="Detail" className="w-full h-auto block" crossOrigin="anonymous" />
                                                    {(block.overlayText !== undefined || isEditMode) && block.overlayText !== undefined && (
                                                        <EditableElement value={block.overlayText} onChange={(v) => updateOverlayText(block.id, v)} onStyleChange={(s) => updateOverlayStyle(block.id, s)} isEditMode={isEditMode} enableDrag={true} defaultStyle={block.overlayStyle || { fontSize: 'text-4xl', fontFamily: 'font-sans', color: 'text-white', align: 'text-center', verticalAlign: 'justify-center', fontWeight: 'font-bold', x: 50, y: 50 }} className="drop-shadow-md" toolbarPosition="right" />
                                                    )}
                                                    {isEditMode && (
                                                        <div className="absolute top-4 left-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <label className="bg-white hover:bg-gray-50 text-gray-800 p-2 rounded cursor-pointer shadow border border-gray-200"><ArrowPathIcon className="w-4 h-4" /><input type="file" className="hidden" accept="image/*" onChange={(e) => handleBlockImageUpload(block.id, e)} /></label>
                                                            <button onClick={() => openCropper(block.id, block.content, 'DETAIL')} className="bg-white text-gray-800 p-2 rounded cursor-pointer shadow border border-gray-200 hover:bg-gray-50"><ScissorsIcon className="w-4 h-4" /></button>
                                                            <div className="relative">
                                                                <button onClick={() => setActiveAiMenuId(activeAiMenuId === block.id ? null : block.id)} disabled={block.isProcessing} className="bg-indigo-600 text-white p-2 rounded shadow border border-indigo-400">{block.isProcessing ? "..." : <SparklesIcon className="w-4 h-4" />}</button>
                                                                {renderAiMenu(block.id, (mode) => handleAiProcessBlock(block.id, block.content, 'DETAIL', mode))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center cursor-pointer p-10 text-gray-400 hover:text-gray-600"><PhotoIcon className="w-12 h-12 mb-2" /><span className="text-sm font-bold">이미지 업로드</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleBlockImageUpload(block.id, e)} /></label>
                                            )}
                                        </div>
                                    )}
                                    {block.type === 'TEXT' && (
                                        <div className="w-full bg-[#f4f1ea] p-12 relative group/textblock h-full flex items-center">
                                            <EditableElement value={block.content} onChange={(v) => updateBlockContent(block.id, v)} onStyleChange={(s) => setDetailBlocks(prev => prev.map(b => b.id === block.id ? { ...b, style: s } : b))} isEditMode={isEditMode} aiLabel="Detail Text" defaultStyle={block.style || { fontSize: 'text-2xl', fontFamily: 'font-serif-kr', color: 'text-gray-800', align: 'text-center', fontWeight: 'font-medium', maxWidth: 'max-w-4xl' }} className="leading-normal" toolbarPosition="right" />
                                        </div>
                                    )}
                                    {block.type === 'SIZE_CHART' && block.tableData && (
                                        <div className="w-full bg-white p-12 flex flex-col items-center justify-center">
                                            <div id={`size-chart-${block.id}`} className="bg-white p-4 w-full max-w-3xl">
                                                <div className="w-full text-center mb-6">
                                                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{block.content}</h3>
                                                </div>
                                                <div className="w-full overflow-x-auto">
                                                    <div className="flex flex-col border-t-2 border-gray-900 w-full min-w-[500px]">
                                                        {block.tableData.map((row, rIdx) => (
                                                            <div key={rIdx} className={`flex w-full border-b ${rIdx === 0 ? 'border-gray-400 bg-gray-50' : 'border-gray-200'}`}>
                                                                {row.map((cell, cIdx) => (
                                                                    <div key={cIdx} className="flex-1 p-4 min-w-[80px] relative border-r border-gray-100 last:border-0 align-top">
                                                                        <AutoResizeTextarea
                                                                            value={cell} 
                                                                            onChange={(e) => updateTableCell(block.id, rIdx, cIdx, e.target.value)} 
                                                                            className={`text-center text-2xl ${rIdx === 0 ? 'font-bold text-gray-800' : 'text-gray-600'}`}
                                                                            readOnly={!isEditMode}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {isEditMode && (
                                                <div className="mt-4 flex gap-4 text-xs">
                                                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded">
                                                        <span className="text-gray-500 font-bold px-2">행(Row)</span>
                                                        <button onClick={() => addTableRow(block.id)} className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-600 rounded border border-gray-300">+</button>
                                                        <button onClick={() => removeTableRow(block.id)} className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 rounded border border-gray-300">-</button>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded">
                                                        <span className="text-gray-500 font-bold px-2">열(Col)</span>
                                                        <button onClick={() => addTableCol(block.id)} className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-600 rounded border border-gray-300">+</button>
                                                        <button onClick={() => removeTableCol(block.id)} className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 rounded border border-gray-300">-</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                )
                            })}
                        </div>
                        {isEditMode && (
                            <div className="w-full flex justify-center gap-4 mt-10 px-10">
                                <button onClick={() => addDetailBlock('IMAGE')} className="flex items-center gap-2 py-4 px-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all"><PhotoIcon className="w-6 h-6" /><span className="font-bold">이미지 블록 추가</span></button>
                                <button onClick={() => addDetailBlock('TEXT')} className="flex items-center gap-2 py-4 px-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all"><DocumentTextIcon className="w-6 h-6" /><span className="font-bold">텍스트 블록 추가</span></button>
                                <button onClick={() => addDetailBlock('SIZE_CHART')} className="flex items-center gap-2 py-4 px-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all"><TableCellsIcon className="w-6 h-6" /><span className="font-bold">사이즈표 추가</span></button>
                            </div>
                        )}
                    </div>
            );
        case 'INFO': return (
                    <div className="w-full pt-24 pb-40 px-10" style={{ background: catDesign.infoBg }}>
                        {/* 주의사항 */}
                        <div className="mb-10 text-center">
                            <EditableElement value={disclaimerText} onChange={setDisclaimerText} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-400', align: 'text-center', fontWeight: 'font-normal' }} toolbarPosition="right" />
                        </div>

                        {/* 체크포인트 */}
                        <div className="rounded-2xl p-12 text-center mb-16 relative overflow-hidden" style={{ background: catDesign.pointPanel }}>
                            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: catDesign.pointAccent, transform: 'translate(20%, -20%)' }} />
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="h-px w-8" style={{ background: catDesign.pointAccent }}></div>
                                <span className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: catDesign.pointAccent }}>✦ CHECK POINT</span>
                                <div className="h-px w-8" style={{ background: catDesign.pointAccent }}></div>
                            </div>
                            <EditableElement key={`size-${pointTheme}`} value={editableCopy.sizeTip} onChange={(v) => handleCopyChange('sizeTip', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-white', align: 'text-center', fontWeight: 'font-bold' }} className="relative z-10" toolbarPosition="right" />
                        </div>

                        {/* 상품 정보 테이블 */}
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-center gap-4 mb-10">
                                <div className="h-px flex-1" style={{ background: catDesign.storyAccent, opacity: 0.3 }}></div>
                                <EditableElement key={`info-${pointTheme}`} value={headers.productInfo} onChange={(v) => handleHeaderChange('productInfo', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-gray-800', align: 'text-center', fontWeight: 'font-black' }} className="uppercase tracking-[0.2em] px-6" toolbarPosition="right" />
                                <div className="h-px flex-1" style={{ background: catDesign.storyAccent, opacity: 0.3 }}></div>
                            </div>
                            <table className="w-full text-base border-t-2 table-fixed" style={{ borderColor: catDesign.storyAccent }}>
                                <colgroup><col className="w-[22%]" /><col className="w-[28%]" /><col className="w-[22%]" /><col className="w-[28%]" /></colgroup>
                                <tbody>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-5 px-5 text-left font-bold text-gray-600 align-top bg-white/60 text-sm"><EditableElement value={infoLabels.product} onChange={(v) => handleInfoLabelChange('product', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-600', align: 'text-left', fontWeight: 'font-bold' }} toolbarPosition="right" /></th>
                                        <td className="py-5 px-5 text-gray-700 align-top text-sm" colSpan={3}><EditableElement value={editableProductName} onChange={setEditableProductName} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} toolbarPosition="right" /></td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-5 px-5 text-left font-bold text-gray-600 align-top bg-white/60 text-sm"><EditableElement value={infoLabels.material} onChange={(v) => handleInfoLabelChange('material', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-600', align: 'text-left', fontWeight: 'font-bold' }} toolbarPosition="right" /></th>
                                        <td className="py-5 px-5 text-gray-700 align-top text-sm"><EditableElement value={editableCopy.productInfo.material} onChange={(v) => handleProductInfoChange('material', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} toolbarPosition="right" /></td>
                                        <th className="py-5 px-5 text-left font-bold text-gray-600 align-top bg-white/60 text-sm"><EditableElement value={infoLabels.color} onChange={(v) => handleInfoLabelChange('color', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-600', align: 'text-left', fontWeight: 'font-bold' }} toolbarPosition="right" /></th>
                                        <td className="py-5 px-5 text-gray-700 align-top text-sm"><EditableElement value={infoLabels.imgRef} onChange={(v) => handleInfoLabelChange('imgRef', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} toolbarPosition="right" /></td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-5 px-5 text-left font-bold text-gray-600 align-top bg-white/60 text-sm"><EditableElement value={infoLabels.origin} onChange={(v) => handleInfoLabelChange('origin', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-600', align: 'text-left', fontWeight: 'font-bold' }} toolbarPosition="right" /></th>
                                        <td className="py-5 px-5 text-gray-700 align-top text-sm"><EditableElement value={editableCopy.productInfo.origin} onChange={(v) => handleProductInfoChange('origin', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} toolbarPosition="right" /></td>
                                        <th className="py-5 px-5 text-left font-bold text-gray-600 align-top bg-white/60 text-sm"><EditableElement value={infoLabels.wash} onChange={(v) => handleInfoLabelChange('wash', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-600', align: 'text-left', fontWeight: 'font-bold' }} toolbarPosition="right" /></th>
                                        <td className="py-5 px-5 text-gray-700 align-top text-sm"><EditableElement value={infoLabels.washGuide} onChange={(v) => handleInfoLabelChange('washGuide', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: 'font-sans', color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} toolbarPosition="right" /></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* 푸터 브랜드 */}
                            <div className="mt-16 flex items-center justify-center gap-4">
                                <div className="h-px w-20" style={{ background: catDesign.storyAccent, opacity: 0.3 }}></div>
                                <EditableElement value={copyright} onChange={setCopyright} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-xs', fontFamily: 'font-sans', color: 'text-gray-400', align: 'text-center', fontWeight: 'font-normal' }} className="uppercase tracking-[0.3em]" toolbarPosition="right" />
                                <div className="h-px w-20" style={{ background: catDesign.storyAccent, opacity: 0.3 }}></div>
                            </div>
                        </div>
                    </div>
            );
        default: return null;
    }
  };

  return (
    <div className="flex flex-row justify-center min-h-screen bg-gray-100 py-10 relative">
      {cropTarget && ( <ImageCropper imageUrl={cropTarget.url} onCrop={handleCropComplete} onCancel={() => setCropTarget(null)} /> )}
      <div className={`fixed left-4 top-24 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-40 hidden xl:block transition-opacity duration-300 ${isEditMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><SwatchIcon className="w-5 h-5 text-indigo-600" /> 레이아웃 설정</h3>
        <div className="mb-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Check Point 스타일</h4>
            <div className="flex flex-col gap-2">
                <button onClick={() => setPointLayout('ZIGZAG')} className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${pointLayout === 'ZIGZAG' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}><ListBulletIcon className="w-5 h-5" /> 매거진 (지그재그)</button>
                <button onClick={() => setPointLayout('CARDS')} className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${pointLayout === 'CARDS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}><Square2StackIcon className="w-5 h-5" /> 박스형 카드</button>
                <button onClick={() => setPointLayout('SIMPLE')} className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${pointLayout === 'SIMPLE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}><ViewColumnsIcon className="w-5 h-5" /> 심플 리스트</button>
            </div>
        </div>
        <div className="border-t border-gray-100 pt-6">
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">섹션 이동 팁</h4>
             <p className="text-sm text-gray-500 leading-relaxed">각 섹션의 <span className="font-bold text-gray-800">왼쪽 여백</span>에 마우스를 올리면 순서를 변경할 수 있는 화살표가 나타납니다.</p>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[860px] flex justify-between items-center bg-white p-4 rounded-xl shadow-lg z-50 sticky top-4 border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">{isEditMode ? (<span className="flex items-center gap-2 text-indigo-600"><PencilSquareIcon className="w-5 h-5" /> 편집 모드</span>) : (<span className="flex items-center gap-2 text-green-600"><CheckIcon className="w-5 h-5" /> 미리보기 & 저장</span>)}</h2>
            <div className="flex gap-2">
                {isEditMode ? (
                    <>
                        <button onClick={onReset} className="py-2 px-4 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">처음으로</button>
                        <button onClick={() => setIsEditMode(false)} className="flex items-center gap-2 py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-md text-sm"><CheckIcon className="w-4 h-4" /> 편집 완료 (미리보기)</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-bold text-sm"><PencilSquareIcon className="w-4 h-4" /> 다시 수정하기</button>
                        <button onClick={handleDownloadJpg} disabled={isDownloading} className="flex items-center gap-2 py-2 px-5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold shadow-md text-sm disabled:opacity-50">{isDownloading ? <span className="animate-pulse">변환 중...</span> : <><ArrowDownTrayIcon className="w-4 h-4" /> 이미지 저장</>}</button>
                    </>
                )}
            </div>
        </div>
        <div id="capture-area" className={`w-[860px] min-w-[860px] bg-white text-gray-800 flex flex-col items-center shadow-2xl origin-top ${isEditMode ? 'ring-1 ring-gray-200' : ''}`}>
            {sectionOrder.map((sectionType, idx) => ( <SectionControlWrapper key={sectionType} type={sectionType} index={idx} isEditMode={isEditMode} isFirst={idx === 0} isLast={idx === sectionOrder.length - 1} onMove={moveSection} onDelete={sectionType === 'OPTIONS' ? () => removeSection('OPTIONS') : undefined}>{renderSectionContent(sectionType)}</SectionControlWrapper> ))}
        </div>
      </div>
    </div>
  );
};
