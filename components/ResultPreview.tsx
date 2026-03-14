
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { GeneratedCopy, ProcessedImage, ProductCategory, ProductInfoDisclosure, PlanSection } from '../types';
import { processProductImage, regenerateCopy, ImageProcessMode } from '../services/geminiService';
import { 
    ArrowDownTrayIcon, ArrowPathIcon, SwatchIcon, ViewColumnsIcon, ListBulletIcon, Square2StackIcon, 
    PhotoIcon, PlusIcon, SparklesIcon, TrashIcon, DocumentTextIcon, CheckIcon, PencilSquareIcon, 
    ChevronUpIcon, ChevronDownIcon, ScissorsIcon, XMarkIcon, LanguageIcon, EllipsisHorizontalIcon,
    UserCircleIcon, HomeModernIcon, PaintBrushIcon, ArrowsUpDownIcon, HandRaisedIcon, ArrowsPointingOutIcon,
    TableCellsIcon, ChatBubbleBottomCenterTextIcon, ComputerDesktopIcon, HeartIcon, BoltIcon
} from '@heroicons/react/24/outline';

interface ResultPreviewProps {
  copy: GeneratedCopy;
  images: ProcessedImage[];
  productName: string; 
  category: ProductCategory;
  infoDisclosure?: ProductInfoDisclosure;
  planSections?: PlanSection[];
  onReset: () => void;
}

type PointLayoutType = 'ZIGZAG' | 'CARDS' | 'SIMPLE';
type PageDesignType = 'MODERN' | 'EMOTIONAL' | 'IMPACT';
type PointIconStyle = 'EMOJI' | 'NUMBER' | 'NONE';
type PointThemeColor = 'INDIGO' | 'BLACK' | 'PINK' | 'BLUE' | 'GREEN' | 'ORANGE';
type SectionType = 'HERO' | 'STORY' | 'VISUAL_CLOSEUP' | 'REVIEW' | 'POINTS' | 'OPTIONS' | 'RECOMMEND' | 'SIZE_GUIDE' | 'PRODUCT_GUIDE' | 'CAUTION_NOTE' | 'DETAILS' | 'INFO';

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
            newArrival: "Fresh Food Market",
            whyThisItem: "Why This Taste?",
            whySub: "이 맛을 선택해야 하는 이유",
            detailView: "Detail View",
            productInfo: "Product Info",
            moodStory: "Delicious Recipe"
        };
        case 'LIVING': return {
            newArrival: "Home & Living Best",
            whyThisItem: "Check Point",
            whySub: "이 상품을 선택해야 하는 이유",
            detailView: "Detail View",
            productInfo: "Product Info",
            moodStory: "Space & Mood"
        };
        case 'KITCHEN': return {
            newArrival: "Premium Kitchenware",
            whyThisItem: "Smart Point",
            whySub: "이 상품을 선택해야 하는 이유",
            detailView: "Detail View",
            productInfo: "Product Info",
            moodStory: "Kitchen Guide"
        };
        default: return {
            newArrival: "New Arrival Collection",
            whyThisItem: "Why This Item?",
            whySub: "이 상품을 선택해야 하는 이유",
            detailView: "Detail View",
            productInfo: "Product Info",
            moodStory: "Mood & Story"
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
    const imageRef = useRef<HTMLElement>(null);
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
                     <img ref={imageRef as any} src={imageUrl} alt="Crop Target" className="block max-w-full max-h-full" crossOrigin="anonymous" />
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

// --- Mask Editor Component ---
interface MaskEditorProps {
    imageUrl: string;
    onSave: (maskFile: File) => void;
    onCancel: () => void;
}

const MaskEditor: React.FC<MaskEditorProps> = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            const scale = Math.min(containerWidth / img.width, containerHeight / img.height);
            const width = img.width * scale;
            const height = img.height * scale;

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = brushSize;
            }
        };
    }, [imageUrl]);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.lineWidth = brushSize;
    }, [brushSize]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.closePath();
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;

        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        maskCtx.drawImage(canvas, 0, 0);
        
        const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
             if (data[i] > 0 || data[i+1] > 0 || data[i+2] > 0) {
                 data[i] = 255;
                 data[i+1] = 255;
                 data[i+2] = 255;
                 data[i+3] = 255;
             }
        }
        maskCtx.putImageData(imageData, 0, 0);

        maskCanvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "mask.png", { type: "image/png" });
                onSave(file);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
             <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-gray-900 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2"><PaintBrushIcon className="w-5 h-5"/> 지울 영역 선택 (색칠하기)</h3>
                    <button onClick={onCancel}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                </div>
                <div ref={containerRef} className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden cursor-crosshair">
                     <img src={imageUrl} alt="Target" className="absolute max-w-full max-h-full object-contain pointer-events-none" crossOrigin="anonymous"/>
                     <canvas 
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="absolute"
                     />
                </div>
                <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">브러쉬 크기</span>
                        <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={brushSize} 
                            onChange={(e) => setBrushSize(Number(e.target.value))} 
                            className="w-40"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">취소</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 flex items-center gap-2"><CheckIcon className="w-5 h-5"/> 지우기 실행</button>
                    </div>
                </div>
             </div>
        </div>
    );
};

// --- Custom Prompt Modal ---
interface CustomPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string) => void;
}

const CustomPromptModal: React.FC<CustomPromptModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [prompt, setPrompt] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-indigo-600" /> 직접 입력 (프롬프트)
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    원하는 편집 내용을 AI에게 구체적으로 명령하세요. (예: "배경에 벚꽃을 추가해줘", "상품 색상을 파스텔 톤으로 변경해줘")
                </p>
                <textarea 
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none mb-4 text-gray-800"
                    placeholder="편집 요청 사항 입력..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">취소</button>
                    <button 
                        onClick={() => {
                            if (prompt.trim()) onSubmit(prompt);
                            setPrompt("");
                        }} 
                        disabled={!prompt.trim()}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <SparklesIcon className="w-4 h-4"/> 생성하기
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Helper: AI 응답 마크다운 제거 ---
const stripMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')    // **볼드** → 볼드
        .replace(/\*(.+?)\*/g, '$1')          // *이탤릭* → 이탤릭
        .replace(/__(.+?)__/g, '$1')          // __볼드__ → 볼드
        .replace(/_(.+?)_/g, '$1')            // _이탤릭_ → 이탤릭
        .replace(/^#+\s*/gm, '')              // # 헤딩 → 헤딩
        .replace(/^[-*•]\s+/gm, '')           // - 리스트 → 리스트
        .replace(/^\d+\.\s+/gm, '')           // 1. 번호 리스트 → 리스트
        .replace(/`(.+?)`/g, '$1')            // `코드` → 코드
        .replace(/\\n/g, '\n')                // 리터럴 \n → 실제 줄바꿈
        .replace(/\n{3,}/g, '\n\n')           // 연속 줄바꿈 정리
        .trim();
};

// --- Helper: planSection content를 항목별로 분리 ---
// "1. 항목A / 2. 항목B / 3. 항목C" 또는 "\n" 구분 모두 지원
const splitContentItems = (content: string): string[] => {
    if (!content || !content.trim()) return [];
    
    // 1) " / " 구분자로 된 번호 리스트 감지: "1. xxx / 2. xxx / 3. xxx"
    if (/\d+\.\s*.+\s*\/\s*\d+\./.test(content)) {
        return content
            .split(/\s*\/\s*/)
            .map(s => s.replace(/^\d+\.\s*/, '').replace(/^['"]|['"]$/g, '').trim())
            .filter(s => s.length > 0);
    }
    
    // 2) 줄바꿈으로 된 번호 리스트: "1. xxx\n2. xxx"
    if (/^\d+\.\s/m.test(content)) {
        return content
            .split(/\n/)
            .map(s => s.replace(/^\d+\.\s*/, '').replace(/^['"]|['"]$/g, '').trim())
            .filter(s => s.length > 0);
    }
    
    // 3) 단순 줄바꿈
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 1) return lines.map(l => l.trim());
    
    // 4) " / " 구분 (번호 없이)
    if (content.includes(' / ')) {
        return content.split(' / ').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // 5) 단일 항목
    return [content.trim()];
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
          onUpdate(stripMarkdown(newText));
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

const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(({ style, setStyle, onDelete, enableDrag, handleDragStart }, ref) => {
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

    const stopPropagationAndKeepFocus = (e: React.MouseEvent) => {
        if (!(e.target instanceof HTMLSelectElement)) {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    return (
        <div 
            ref={ref}
            className="fixed top-24 z-[9999] bg-gray-900/95 backdrop-blur text-white p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[260px] animate-fade-in border border-gray-700 select-none"
            style={{ left: 'calc(50% + 440px)' }}
            onMouseDown={stopPropagationAndKeepFocus}
        >
            <div className="text-xs font-bold text-gray-400 mb-1 flex items-center justify-between">
                <span>텍스트 편집</span>
                <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">편집 중</span>
            </div>
            <div className="flex items-center gap-2 border-b border-gray-700 pb-3 w-full">
                <select 
                    value={style.fontFamily} 
                    onChange={(e) => setStyle(prev => ({...prev, fontFamily: e.target.value as any}))}
                    className="bg-gray-800 text-xs text-white rounded p-1.5 border border-gray-600 outline-none w-28 cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()} 
                >
                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
                <button onMouseDown={stopPropagationAndKeepFocus} onClick={handleFontWeightToggle} className={`p-1.5 w-7 h-7 rounded text-xs font-serif flex items-center justify-center ${style.fontWeight === 'font-bold' ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>B</button>
                <div className="w-[1px] h-4 bg-gray-600"></div>
                <button onMouseDown={stopPropagationAndKeepFocus} onClick={() => handleFontSizeChange(-1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold w-7 h-7">A-</button>
                <button onMouseDown={stopPropagationAndKeepFocus} onClick={() => handleFontSizeChange(1)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold w-7 h-7">A+</button>
            </div>
            <div className="flex items-center gap-2 border-b border-gray-700 pb-3 w-full justify-between">
                <div className="flex gap-1">
                    <button onMouseDown={stopPropagationAndKeepFocus} onClick={() => setStyle(prev => ({ ...prev, align: 'text-left' }))} className={`p-1.5 rounded text-[10px] w-7 h-7 ${style.align === 'text-left' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>L</button>
                    <button onMouseDown={stopPropagationAndKeepFocus} onClick={() => setStyle(prev => ({ ...prev, align: 'text-center' }))} className={`p-1.5 rounded text-[10px] w-7 h-7 ${style.align === 'text-center' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>C</button>
                    <button onMouseDown={stopPropagationAndKeepFocus} onClick={() => setStyle(prev => ({ ...prev, align: 'text-right' }))} className={`p-1.5 rounded text-[10px] w-7 h-7 ${style.align === 'text-right' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>R</button>
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">텍스트 색상</span>
                    <label className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-white" onMouseDown={stopPropagationAndKeepFocus}>
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-blue-500 block"></span>
                        커스텀
                        <input type="color" className="w-0 h-0 opacity-0" onChange={(e) => setStyle(prev => ({ ...prev, color: e.target.value }))} />
                    </label>
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
                    {colors.map(c => (
                        <button 
                            key={c.name}
                            onMouseDown={stopPropagationAndKeepFocus}
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
                    <label className="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-white" onMouseDown={stopPropagationAndKeepFocus}>
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-black block"></span>
                        커스텀
                        <input type="color" className="w-0 h-0 opacity-0" onChange={(e) => setStyle(prev => ({ ...prev, backgroundColor: e.target.value }))} />
                    </label>
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
                    {bgColors.map(c => (
                        <button 
                            key={c.name}
                            onMouseDown={stopPropagationAndKeepFocus}
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
                <button onMouseDown={stopPropagationAndKeepFocus} onClick={() => setStyle(prev => ({ ...prev, maxWidth: 'max-w-full' }))} className={`px-2 py-1 hover:bg-gray-700 rounded text-[10px] ${!style.maxWidth || style.maxWidth === 'max-w-full' ? 'text-green-400 font-bold' : ''}`}>100%</button>
                <button onMouseDown={stopPropagationAndKeepFocus} onClick={() => setStyle(prev => ({ ...prev, maxWidth: 'max-w-2xl' }))} className={`px-2 py-1 hover:bg-gray-700 rounded text-[10px] ${style.maxWidth === 'max-w-2xl' ? 'text-green-400 font-bold' : ''}`}>50%</button>
                <div className="flex-1"></div>
                {onDelete && (
                    <button onMouseDown={stopPropagationAndKeepFocus} onClick={onDelete} className="p-1.5 hover:bg-red-600 bg-red-500 rounded text-white flex items-center gap-1 text-xs">
                        <TrashIcon className="w-3 h-3" /> 삭제
                    </button>
                )}
            </div>
        </div>
    );
});

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
    aiLabel?: string; 
    toolbarPosition?: 'default' | 'right';
    onDragStart?: (e: React.MouseEvent) => void;
}

const EditableElement: React.FC<EditableElementProps> = ({
    value, onChange, onDelete, onStyleChange, isEditMode, placeholder, defaultStyle, 
    allowStyleChange = true, enableVerticalAlign = false, enableDrag = false, 
    className = "", aiLabel, toolbarPosition = 'default'
}) => {
    const [style, setStyle] = useState<TextStyle>(defaultStyle);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

    // ★ 스타일 영구 저장: defaultStyle 변경 시 현재 스타일 덮어쓰지 않음
    const isStyleInitialized = useRef(false);
    useEffect(() => {
        if (!isStyleInitialized.current) {
            setStyle(defaultStyle);
            isStyleInitialized.current = true;
        }
    }, []); // 최초 1회만 실행

    useEffect(() => {
        if (onStyleChange && isFocused) {
            onStyleChange(style);
        }
    }, [style, onStyleChange, isFocused]);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '0px';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 10}px`;
        }
    }, [value, isEditMode, style, style.fontSize, style.fontWeight, style.fontFamily]); 

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!enableDrag || !isEditMode || !containerRef.current || isFocused) return;
        
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.isDragging = false;
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
        if (!containerRef.current?.offsetParent) return;
        
        if (!dragRef.current.isDragging) {
             const dist = Math.hypot(e.clientX - dragRef.current.startX, e.clientY - dragRef.current.startY);
             if (dist > 5) dragRef.current.isDragging = true;
        }

        if (dragRef.current.isDragging) {
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
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (!dragRef.current.isDragging) {
            textareaRef.current?.focus();
            setIsFocused(true);
        }
        dragRef.current.isDragging = false;
    };

    const handleBlur = (e: React.FocusEvent) => {
        const relatedTarget = e.relatedTarget as Node;
        if (toolbarRef.current?.contains(relatedTarget)) {
            return;
        }
        // ★ 스타일 저장: blur 시 현재 스타일을 외부로 전달
        if (onStyleChange) onStyleChange(style);
        setIsFocused(false);
    };

    const handleToolbarDragStart = (e: React.MouseEvent) => {
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

    const containerWidthClass = style.maxWidth || 'max-w-full';
    const isHexColor = style.color.startsWith('#') || style.color.startsWith('rgb');
    const isHexBg = style.backgroundColor && (style.backgroundColor.startsWith('#') || style.backgroundColor.startsWith('rgb'));
    const colorClass = isHexColor ? '' : style.color;
    const bgColorClass = isHexBg ? '' : style.backgroundColor;
    const paddingClass = (style.backgroundColor || isHexBg) ? 'p-6 rounded-xl shadow-sm' : '';
    const inlineStyle: React.CSSProperties = {
        color: isHexColor ? style.color : undefined,
        backgroundColor: isHexBg ? style.backgroundColor : undefined,
    };
    
    const positionStyle: React.CSSProperties = enableDrag ? {
        position: 'absolute',
        left: `${style.x ?? 50}%`,
        top: `${style.y ?? 50}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isFocused ? 40 : 20,
        width: style.maxWidth ? 'auto' : undefined,
        minWidth: '200px',
        cursor: isFocused ? 'default' : 'move',
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
                    style={{
                      ...(!enableDrag ? previewStyle : {}),
                      wordBreak: 'keep-all',
                      overflowWrap: 'break-word'
                    }}
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
            onMouseDown={handleMouseDown}
            className={`relative group/edit transition-all flex ${!enableDrag ? 'w-full' : ''} ${style.align === 'text-center' ? 'justify-center' : style.align === 'text-right' ? 'justify-end' : 'justify-start'} ${isFocused ? 'z-40' : ''} ${enableDrag ? bgColorClass + ' ' + paddingClass : ''} ${enableDrag && !isFocused ? 'hover:outline hover:outline-2 hover:outline-indigo-400 hover:outline-dashed' : ''}`}
        >
            {allowStyleChange && isFocused && createPortal(
                <Toolbar 
                    ref={toolbarRef}
                    style={style} 
                    setStyle={setStyle} 
                    onDelete={onDelete} 
                    enableDrag={enableDrag} 
                    handleDragStart={handleToolbarDragStart} 
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
                onBlur={handleBlur}
                placeholder={placeholder}
                className={`bg-transparent border-0 p-2 resize-none overflow-hidden outline-none focus:ring-2 focus:ring-indigo-400/50 w-full ${style.fontSize} ${style.fontFamily} ${colorClass} ${style.align} ${style.fontWeight} ${containerWidthClass} ${!enableDrag ? bgColorClass + ' ' + paddingClass : ''} ${className} leading-normal ${isFocused ? 'cursor-text' : 'cursor-move'}`}
                style={{
                  ...(!enableDrag ? inlineStyle : {}),
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word'
                }}
                rows={1}
                spellCheck={false}
                onMouseDown={(e) => isFocused && e.stopPropagation()}
            />
        </div>
    );
};

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

export const ResultPreview: React.FC<ResultPreviewProps> = ({ copy, images, productName, category, infoDisclosure, planSections, onReset }) => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [pointLayout, setPointLayout] = useState<PointLayoutType>('ZIGZAG');
  const [pageDesign, setPageDesign] = useState<PageDesignType>('MODERN');
  const [pointIconStyle, setPointIconStyle] = useState<PointIconStyle>('EMOJI');
  const [pointTheme, setPointTheme] = useState<PointThemeColor>(getThemeByCategory(category));
  // planSections를 기반으로 섹션 순서 결정
  const getInitialSectionOrder = (): SectionType[] => {
    if (!planSections || planSections.length === 0) {
      return ['HERO', 'STORY', 'POINTS', 'OPTIONS', 'DETAILS', 'INFO'];
    }
    // ★ planSection.type → SectionType 1:1 매핑 (축소 금지)
    const planTypeMap: Record<string, SectionType> = {
      'HERO': 'HERO',
      'OVERVIEW': 'HERO',
      'STORY': 'STORY',
      'CLOSEUP': 'VISUAL_CLOSEUP',
      'VISUAL_CLOSEUP': 'VISUAL_CLOSEUP',
      'REVIEW': 'REVIEW',
      'POINT': 'POINTS',
      'OPTIONS': 'OPTIONS',
      'RECOMMEND': 'RECOMMEND',
      'SIZE': 'SIZE_GUIDE',
      // 'GUIDE': 'PRODUCT_GUIDE',  // ★ 제거 - 세탁가이드는 기본 비표시
      'CAUTION': 'CAUTION_NOTE',
      'DETAIL': 'DETAILS',
      'INFO': 'INFO',
      'CUSTOM': 'DETAILS'
    };
    const seen = new Set<SectionType>();
    const order: SectionType[] = [];
    planSections.filter(s => s.enabled).forEach(s => {
      const mapped = planTypeMap[s.type] || 'DETAILS';
      if (!seen.has(mapped)) { seen.add(mapped); order.push(mapped); }
    });
    // 기본 섹션(HERO, OPTIONS, DETAILS, INFO)이 빠졌으면 끝에 추가
    (['HERO','OPTIONS','DETAILS','INFO'] as SectionType[]).forEach(s => {
      if (!seen.has(s)) order.push(s);
    });
    return order;
  };
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>(getInitialSectionOrder);

  const [cropTarget, setCropTarget] = useState<{ id: string, url: string, type: 'MAIN' | 'DETAIL' | 'POINT' | 'POINT_SIDE' | 'OPTION' } | null>(null);
  const [maskEditorTarget, setMaskEditorTarget] = useState<{ id: string, url: string } | null>(null);
  const [customPromptTarget, setCustomPromptTarget] = useState<{ id: string, type: 'MAIN'|'POINT'|'DETAIL' } | null>(null);
  const [activeAiMenuId, setActiveAiMenuId] = useState<string | null>(null);

  // ★ 신규 섹션(planSections 기반) 편집용 state
  const [editablePlanData, setEditablePlanData] = useState<Record<string, { title: string; content: string }>>(() => {
    const initial: Record<string, { title: string; content: string }> = {};
    if (planSections) {
      planSections.filter(s => s.enabled).forEach(s => {
        initial[s.type] = { title: s.title, content: s.content };
      });
    }
    return initial;
  });
  const getPlanTitle = (planType: string, fallback: string): string => editablePlanData[planType]?.title || fallback;
  const getPlanContent = (planType: string, fallback: string): string => editablePlanData[planType]?.content || fallback;
  const updatePlanTitle = (planType: string, value: string) => {
    setEditablePlanData(prev => ({ ...prev, [planType]: { ...prev[planType], title: value } }));
  };
  const updatePlanContent = (planType: string, value: string) => {
    setEditablePlanData(prev => ({ ...prev, [planType]: { ...prev[planType], content: value } }));
  };

  const [editableProductName, setEditableProductName] = useState(productName);
  // planSections의 내용을 카피에 반영
  const getEnrichedCopy = (): GeneratedCopy => {
    if (!planSections) return copy;
    const heroSection = planSections.find(s => s.type === 'HERO' && s.enabled);
    const storySection = planSections.find(s => s.type === 'STORY' && s.enabled);
    const points = planSections.filter(s => s.type === 'POINT' && s.enabled);
    return {
      ...copy,
      mainHook: heroSection?.title || copy.mainHook,
      story: storySection?.content || copy.story,
      sellingPoints: copy.sellingPoints.map((sp, i) => points[i] ? {
        ...sp, title: points[i].title, description: points[i].content
      } : sp),
    };
  };
  const [editableCopy, setEditableCopy] = useState<GeneratedCopy>(getEnrichedCopy);
  
  // ★ 텍스트 스타일 영구 저장 (편집 후 다른 곳 클릭해도 유지)
  const [textStyles, setTextStyles] = useState<Record<string, TextStyle>>({});
  const getTextStyle = (key: string, defaultStyle: TextStyle): TextStyle => {
    return textStyles[key] || defaultStyle;
  };
  const saveTextStyle = (key: string, style: TextStyle) => {
    setTextStyles(prev => ({ ...prev, [key]: style }));
  };
  
  const [headers, setHeaders] = useState(getHeadersByCategory(category));
  const [copyright, setCopyright] = useState("MARKETPIA BEST OF BEST");

  const [infoLabels, setInfoLabels] = useState({
      product: "제품명",
      material: "소재",
      color: "색상",
      origin: "제조국",
      wash: "세탁방법",
      caution: "주의사항",
      imgRef: "이미지 참조",
      washGuide: "미지근한 물에 중성세제로 손세탁 또는 세탁망에 넣어 울코스 세탁을 권장합니다"
  });

  const [disclaimerText, setDisclaimerText] = useState(
      "본 제품은 모니터 해상도 상 실제 제품과 색상 차이가 있을 수 있습니다\n" +
      "본 제품은 실측 사이즈는 재는 위치나 방식에 따라 약간의 오차가 발생 할 수 있습니다\n" +
      "본 제품은 14세 이상 사용 가능합니다"
  );

  const [visibleHeaders, setVisibleHeaders] = useState({
      heroSubtitle: false,
      heroBadge: false,
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

  const stripExtension = (filename: string) => {
      return filename.replace(/\.[^/.]+$/, "");
  };

  useEffect(() => {
    // ★ planSections 기반 enriched copy 사용
    const newCopy = getEnrichedCopy();
    if (newCopy.productInfo) {
        newCopy.productInfo.origin = "Made in China";
    }
    setEditableCopy(newCopy);
    setEditableProductName(productName);
    
    // ★ 세탁방법/주의사항 기본값 설정
    const info = {...infoLabels};
    if (category === 'FASHION') {
        // FASHION: 세탁방법 (wash가 있으면 사용, 없으면 기본값 유지)
        if (copy.productInfo.wash) {
            info.washGuide = copy.productInfo.wash;
        }
        // 기본값: "미지근한 물에 중성세제로 손세탁..." (state 초기값)
    } else {
        // 비패션: 주의사항
        if (copy.productInfo.caution) {
            info.washGuide = copy.productInfo.caution;
        } else {
            info.washGuide = "14세 이상 사용가능\n화기에 주의 하세요";
        }
    }
    setInfoLabels(info);

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
            style: { fontSize: 'text-2xl', fontFamily: 'font-sans', color: 'text-gray-800', align: 'text-center', fontWeight: 'font-medium', maxWidth: 'max-w-4xl', backgroundColor: 'bg-yellow-50' }
        });
    }
    setDetailBlocks(initialDetailBlocks);

    const propOptions = images.filter(img => img.type === 'option');
    const initialOptionBlocks: OptionBlock[] = propOptions.map((img, idx) => {
        // ★ 디버그: fileName이 왜 안 오는지 추적
        if (!img.fileName) console.warn(`[옵션 ${idx + 1}] fileName 누락 — App.tsx에서 processedImages에 fileName: file.name 전달 필요`, img);
        return {
            id: `opt-${Date.now()}-${idx}`,
            image: img.processedUrl || img.originalUrl,
            text: img.fileName ? stripExtension(img.fileName) : `컬러 ${idx + 1}`
        };
    });
    setOptionBlocks(initialOptionBlocks);

    const initialPointBlocks: PointBlock[] = copy.sellingPoints.map((p, i) => ({
        id: `pt-${Date.now()}-${i}`,
        type: 'POINT_ITEM',
        icon: p.icon,
        title: p.title,
        description: p.description
    }));
    setPointBlocks(initialPointBlocks);

  }, [copy, images, productName, category]);

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
      
      // Fix for drag flicker: Only clear if leaving the main drop target for a non-child
      if (e.relatedTarget && (e.currentTarget.contains(e.relatedTarget as Node) || e.currentTarget === e.relatedTarget)) {
         return;
      }
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
      setOptionBlocks(prev => [...prev, { id: `opt-${Date.now()}`, image: '', text: `컬러 ${prev.length + 1}` }]);
  };
  const updateOptionBlock = (id: string, field: keyof OptionBlock, value: string) => {
      setOptionBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  const removeOptionBlock = (id: string) => {
      setOptionBlocks(prev => prev.filter(b => b.id !== id));
  };
  const handleOptionImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          const nameWithoutExt = stripExtension(file.name);
          setOptionBlocks(prev => prev.map(b => b.id === id ? { ...b, image: url, text: nameWithoutExt } : b));
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
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 1.0));
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
                  console.warn("File Picker cancelled or failed", err);
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
              scale: 3, 
              useCORS: true, 
              allowTaint: false, 
              backgroundColor: '#ffffff',
              onclone: (doc: any) => {
                  const el = doc.getElementById(`size-chart-${blockId}`);
                  if (el) {
                      el.style.position = 'static';
                      el.style.transform = 'none';
                      el.style.margin = '0';
                      el.style.width = 'fit-content';
                      el.style.minWidth = '860px'; 
                      el.style.height = 'auto';
                      el.style.padding = '100px'; 
                      el.style.boxSizing = 'border-box';
                      
                      const wrapper = el.querySelector('.overflow-x-auto');
                      if (wrapper) {
                          wrapper.style.overflow = 'visible';
                          wrapper.style.width = '100%';
                          wrapper.style.display = 'block';
                      }
                      
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

  const handleMaskSave = async (maskFile: File) => {
    if (!maskEditorTarget) return;
    setMaskEditorTarget(null);
    if (maskEditorTarget.id === 'MAIN') {
        await handleAiProcessMain('ERASE_PART', maskFile);
    } else {
         const pointBlock = pointBlocks.find(b => b.id === maskEditorTarget.id);
         if (pointBlock) {
             await handleAiProcessBlock(maskEditorTarget.id, pointBlock.content!, 'POINT', 'ERASE_PART', maskFile);
             return;
         }
         const detailBlock = detailBlocks.find(b => b.id === maskEditorTarget.id);
         if (detailBlock) {
             await handleAiProcessBlock(maskEditorTarget.id, detailBlock.content, 'DETAIL', 'ERASE_PART', maskFile);
             return;
         }
    }
  };

  const handleCustomPromptSubmit = async (prompt: string) => {
      if (!customPromptTarget) return;
      setCustomPromptTarget(null);

      if (customPromptTarget.type === 'MAIN') {
          await handleAiProcessMain('CUSTOM', undefined, prompt);
      } else {
          const blockId = customPromptTarget.id;
          const section = customPromptTarget.type === 'DETAIL' ? 'DETAIL' : 'POINT';
          let imgUrl = "";
          
          if (section === 'POINT') {
              const b = pointBlocks.find(b => b.id === blockId);
              if (b) imgUrl = b.content || "";
          } else {
              const b = detailBlocks.find(b => b.id === blockId);
              if (b) imgUrl = b.content || "";
          }
          
          if (imgUrl) {
              await handleAiProcessBlock(blockId, imgUrl, section, 'CUSTOM', undefined, prompt);
          }
      }
  };

  const handleAiProcessMain = async (mode: ImageProcessMode, maskFile?: File, customPrompt?: string) => {
      if (!mainImage) return;
      if (mode === 'ERASE_PART' && !maskFile) {
        setMaskEditorTarget({ id: 'MAIN', url: mainImage });
        return;
      }
      if (mode === 'CUSTOM' && !customPrompt) {
        setCustomPromptTarget({ id: 'MAIN', type: 'MAIN' });
        return;
      }

      setIsProcessingMain(true);
      setActiveAiMenuId(null);
      try {
        const response = await fetch(mainImage);
        const blob = await response.blob();
        const file = new File([blob], "image.png", { type: blob.type });
        const newUrl = await processProductImage(file, mode, maskFile, customPrompt);
        setMainImage(newUrl);
      } catch (e) {
          alert("이미지 처리 실패");
      } finally {
          setIsProcessingMain(false);
      }
  };

  const handleAiProcessBlock = async (blockId: string, imgUrl: string, section: 'DETAIL' | 'POINT', mode: ImageProcessMode, maskFile?: File, customPrompt?: string) => {
      if (!imgUrl) return;
      if (mode === 'ERASE_PART' && !maskFile) {
        setMaskEditorTarget({ id: blockId, url: imgUrl });
        return;
      }
      if (mode === 'CUSTOM' && !customPrompt) {
        setCustomPromptTarget({ id: blockId, type: section === 'DETAIL' ? 'DETAIL' : 'POINT' });
        return;
      }

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
          const newUrl = await processProductImage(file, mode, maskFile, customPrompt);
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
    const element = document.getElementById('capture-area');
    if (!element) return;
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const scrollHeight = element.scrollHeight;
      const safeScale = scrollHeight > 8000 ? 1 : 2;
      const canvas = await (window as any).html2canvas(element, { 
          scale: safeScale, 
          useCORS: true, 
          allowTaint: false, 
          backgroundColor: '#ffffff', 
          width: 860,
          height: scrollHeight,
          windowWidth: 860, 
          windowHeight: scrollHeight,
          scrollY: 0, 
          x: 0,
          y: 0,
          logging: false,
          imageTimeout: 0,
          onclone: (doc: any) => { 
              const el = doc.getElementById('capture-area'); 
              if (el) {
                  el.style.transform = 'none'; 
                  el.style.height = 'auto';
                  el.style.maxHeight = 'none';
                  el.style.overflow = 'visible';
                  el.style.backgroundColor = '#ffffff';
                  el.style.display = 'flex';
                  el.style.visibility = 'visible';
                  let parent = el.parentElement;
                  while (parent) {
                      parent.style.overflow = 'visible';
                      parent.style.height = 'auto';
                      parent.style.maxHeight = 'none';
                      parent.style.visibility = 'visible';
                      parent = parent.parentElement;
                  }
                  const textareas = el.querySelectorAll('textarea');
                  textareas.forEach((ta: any) => {
                      ta.style.height = (ta.scrollHeight + 10) + 'px';
                      ta.style.visibility = 'visible';
                  });
              }
          } 
      });
      await saveCanvasToFile(canvas, '상세이미지.jpg');
    } catch (error) {
      console.error('Download failed', error);
      alert('이미지 생성에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const renderAiMenu = (id: string, onSelect: (mode: ImageProcessMode) => void) => {
      if (activeAiMenuId !== id) return null;
      const handleAction = (e: React.MouseEvent, mode: ImageProcessMode) => {
          e.preventDefault();
          e.stopPropagation();
          setActiveAiMenuId(null);
          onSelect(mode);
      };
      return (
          <div className="absolute top-10 right-0 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-1 w-56 flex flex-col gap-1"
               onMouseDown={(e) => e.stopPropagation()}>
              <button onClick={(e) => handleAction(e, 'MAGIC_FIX')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left font-bold"><SparklesIcon className="w-4 h-4 text-indigo-500" /> ✨ AI 일반 변환 (고화질)</button>
              <button onClick={(e) => handleAction(e, 'CUSTOM')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left font-medium"><ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-purple-500" /> 💬 직접 입력 (프롬프트)</button>
              <div className="h-[1px] bg-gray-100 my-1"></div>
              <button onClick={(e) => handleAction(e, 'REMOVE_TEXT')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left font-medium"><LanguageIcon className="w-4 h-4 text-orange-500" /> 🔤 중국어/텍스트 지우개</button>
              <button onClick={(e) => handleAction(e, 'ERASE_PART')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left font-medium"><PaintBrushIcon className="w-4 h-4 text-red-500" /> 🖌️ 브러시 지우개</button>
              <div className="h-[1px] bg-gray-100 my-1"></div>
              <button onClick={(e) => handleAction(e, 'MODEL_SWAP')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left font-medium"><UserCircleIcon className="w-4 h-4 text-blue-500" /> 👤 모델 생성</button>
              <button onClick={(e) => handleAction(e, 'BG_CHANGE')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded text-left font-medium"><HomeModernIcon className="w-4 h-4 text-green-500" /> 🏞️ 배경 변경</button>
          </div>
      );
  };

  const getThemeStyles = () => {
    switch(pageDesign) {
        case 'EMOTIONAL': return {
            bg: 'bg-[#fdfbf7]', 
            text: 'text-gray-800', 
            fontHead: 'font-serif-kr', 
            fontBody: 'font-serif-kr',
            storyQuote: 'text-gray-400 font-serif',
            sectionDivider: 'bg-[#e0dcd0]',
            cardBg: 'bg-white',
            tableHeader: 'bg-[#f7f5f0] text-gray-800',
            tableBorder: 'border-[#d4d1c9]'
        };
        case 'IMPACT': return {
            bg: 'bg-white', 
            text: 'text-black', 
            fontHead: 'font-sans', 
            fontBody: 'font-sans',
            storyQuote: 'text-black font-sans',
            sectionDivider: 'bg-black',
            cardBg: 'bg-gray-100',
            tableHeader: 'bg-black text-white',
            tableBorder: 'border-black'
        };
        case 'MODERN':
        default: return {
            bg: 'bg-white', 
            text: 'text-gray-900', 
            fontHead: 'font-sans', 
            fontBody: 'font-sans',
            storyQuote: 'text-gray-300 font-serif',
            sectionDivider: 'bg-gray-100',
            cardBg: 'bg-gray-50',
            tableHeader: 'bg-gray-50 text-gray-700',
            tableBorder: 'border-gray-200'
        };
    }
  };
  const themeStyles = getThemeStyles();

  const renderSectionContent = (type: SectionType) => {
    const theme = THEME_COLORS[pointTheme];
    // ★ planSection 데이터 접근 헬퍼: SectionType → planSection 매핑
    const sectionTypeToplanType: Record<string, string[]> = {
      'VISUAL_CLOSEUP': ['CLOSEUP', 'VISUAL_CLOSEUP'],
      'REVIEW': ['REVIEW'],
      'RECOMMEND': ['RECOMMEND'],
      'SIZE_GUIDE': ['SIZE'],
      'PRODUCT_GUIDE': ['GUIDE'],
      'CAUTION_NOTE': ['CAUTION'],
    };
    const getPlanData = (sType: SectionType) => {
      const planTypes = sectionTypeToplanType[sType] || [];
      return planSections?.find(s => s.enabled && planTypes.includes(s.type));
    };
    switch (type) {
        case 'HERO': return (
            <div className={`w-full flex flex-col ${themeStyles.bg}`}>
                        <div 
                            className={`relative w-full bg-gray-50 min-h-[500px] flex items-center justify-center overflow-hidden transition-all border-b-0 ${dragOverId === 'main' ? 'border-4 border-dashed border-indigo-500 bg-indigo-50' : ''}`}
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
                                    <img src={mainImage} alt="Main" className="w-full h-auto block object-cover" crossOrigin="anonymous" />
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
                                                <button onClick={() => setActiveAiMenuId(activeAiMenuId === 'MAIN' ? null : 'MAIN')} disabled={isProcessingMain} className="bg-indigo-600 text-white p-2 rounded-lg flex items-center gap-2 px-4 shadow-xl text-xs font-bold hover:bg-indigo-700 w-full justify-center">
                                                    {isProcessingMain ? "..." : <SparklesIcon className="w-4 h-4" />} AI 편집 도구
                                                </button>
                                                {renderAiMenu('MAIN', (mode) => handleAiProcessMain(mode))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <label className="w-full h-[500px] flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100">
                                    <PhotoIcon className="w-20 h-20 mb-4" />
                                    <span className="text-2xl font-bold">대표 이미지 업로드</span>
                                    <span className="text-sm font-normal mt-2">또는 이미지를 드래그하세요</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                                </label>
                            )}
                        </div>
                        <div className={`w-full ${themeStyles.bg} px-10 py-16 text-center border-b ${themeStyles.tableBorder} relative`}>
                            {visibleHeaders.newArrival && (
                                <div className="mb-6 flex justify-center">
                                     <EditableElement key={`new-${pointTheme}`} value={headers.newArrival} onChange={(v) => handleHeaderChange('newArrival', v)} onDelete={() => toggleHeaderVisibility('newArrival')} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-4xl', fontFamily: themeStyles.fontHead as any, color: pageDesign === 'EMOTIONAL' ? theme.text : themeStyles.text, align: 'text-center', fontWeight: 'font-bold' }} className="uppercase tracking-[0.3em]" toolbarPosition="right" />
                                </div>
                            )}
                            <EditableElement value={editableCopy.mainHook} onChange={(v) => handleCopyChange('mainHook', v)} isEditMode={isEditMode} aiLabel="Hook" defaultStyle={{ fontSize: 'text-4xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} className="mb-8 leading-normal" toolbarPosition="right" />
                            {pageDesign !== 'EMOTIONAL' && <div className={`w-20 h-2 ${pageDesign === 'IMPACT' ? 'bg-black' : 'bg-gray-900'} mx-auto`}></div>}
                        </div>
                </div>
        );
        case 'STORY': return (
            <div className={`w-full ${themeStyles.bg} py-24 px-12 text-center relative`}>
                        <span className={`text-8xl ${themeStyles.storyQuote} mb-6 block leading-none`}>"</span>
                        <EditableElement value={editableCopy.story} onChange={(v) => handleCopyChange('story', v)} isEditMode={isEditMode} aiLabel="Story" defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontBody as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-medium', maxWidth: 'max-w-4xl' }} className="leading-normal mx-auto" toolbarPosition="right" />
                        <span className={`text-8xl ${themeStyles.storyQuote} mt-6 block leading-none`}>"</span>
                        {visibleHeaders.moodStory && (
                            <div className="mt-16 flex justify-center items-center gap-6">
                                <span className={`h-[1px] w-32 ${themeStyles.sectionDivider}`}></span>
                                <EditableElement key={`mood-${pointTheme}`} value={headers.moodStory} onChange={(v) => handleHeaderChange('moodStory', v)} onDelete={() => toggleHeaderVisibility('moodStory')} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-4xl', fontFamily: themeStyles.fontHead as any, color: pageDesign === 'IMPACT' ? 'text-black' : 'text-gray-400', align: 'text-center', fontWeight: 'font-normal' }} className="tracking-[0.2em] uppercase" toolbarPosition="right" />
                                <span className={`h-[1px] w-32 ${themeStyles.sectionDivider}`}></span>
                            </div>
                        )}
                </div>
        );
        case 'POINTS': return (
            <div className={`w-full py-24 ${themeStyles.bg} relative`}>
                        {isEditMode && (
                             <div className="absolute top-4 right-10 flex gap-2 flex-wrap justify-end">
                                <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                                    <button onClick={() => setPointIconStyle('EMOJI')} className={`px-3 py-1 text-xs font-bold rounded ${pointIconStyle === 'EMOJI' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>😊 이모지</button>
                                    <button onClick={() => setPointIconStyle('NUMBER')} className={`px-3 py-1 text-xs font-bold rounded ${pointIconStyle === 'NUMBER' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>🔢 숫자</button>
                                    <button onClick={() => setPointIconStyle('NONE')} className={`px-3 py-1 text-xs font-bold rounded ${pointIconStyle === 'NONE' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>🚫 없음</button>
                                </div>
                                <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 gap-1">
                                    <div className="px-2 text-xs font-bold text-gray-400 flex items-center gap-1"><PaintBrushIcon className="w-3 h-3"/> 테마</div>
                                    {(Object.keys(THEME_COLORS) as PointThemeColor[]).map(c => (
                                        <button key={c} onClick={() => setPointTheme(c)} className={`w-5 h-5 rounded-full border-2 ${pointTheme === c ? 'border-gray-400 scale-110' : 'border-transparent'} ${THEME_COLORS[c].bg}`} title={c} />
                                    ))}
                                </div>
                             </div>
                        )}
                        <div className="text-center mb-20 px-10">
                            <EditableElement key={`why-${pointTheme}`} value={headers.whyThisItem} onChange={(v) => handleHeaderChange('whyThisItem', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-4xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} className="uppercase tracking-tight mb-4" toolbarPosition="right" />
                            {visibleHeaders.whySub && (
                                <EditableElement key={`whysub-${pointTheme}`} value={headers.whySub} onChange={(v) => handleHeaderChange('whySub', v)} onDelete={() => toggleHeaderVisibility('whySub')} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-xl', fontFamily: themeStyles.fontBody as any, color: pageDesign === 'IMPACT' ? 'text-gray-900' : 'text-gray-500', align: 'text-center', fontWeight: 'font-normal' }} toolbarPosition="right" />
                            )}
                        </div>
                        <div className={`px-10 ${pointLayout === 'CARDS' ? 'grid gap-10' : pointLayout === 'SIMPLE' ? 'space-y-12' : 'flex flex-wrap'}`}>
                            {pointBlocks.map((block, idx) => {
                                if (block.type === 'POINT_ITEM') {
                                    return (
                                        <div key={block.id} className={`relative group/point w-full ${pointLayout === 'ZIGZAG' ? `flex ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-stretch min-h-[400px] border-b ${themeStyles.tableBorder} last:border-0` : ''} ${pointLayout === 'CARDS' ? `${themeStyles.cardBg} rounded-3xl p-12 border border-gray-200` : ''} ${pointLayout === 'SIMPLE' ? `flex flex-col items-start border-l-8 ${theme.border} pl-10 py-4` : ''}`}>   
                                            {isEditMode && (
                                                <div className="absolute top-2 left-2 z-30 flex gap-1 opacity-0 group-hover/point:opacity-100 transition-opacity">
                                                    <button onClick={() => movePointBlock(idx, -1)} className="p-2 bg-white text-gray-500 rounded-full shadow border border-gray-200 hover:text-indigo-600"><ChevronUpIcon className="w-3 h-3"/></button>
                                                    <button onClick={() => movePointBlock(idx, 1)} className="p-2 bg-white text-gray-500 rounded-full shadow border border-gray-200 hover:text-indigo-600"><ChevronDownIcon className="w-3 h-3"/></button>
                                                    <button onClick={() => removePointBlock(block.id)} className="p-2 bg-red-50 text-red-500 rounded-full shadow border border-gray-200 hover:bg-red-100"><TrashIcon className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                            {pointLayout === 'ZIGZAG' && (
                                                <>
                                                    <div className={`flex-1 p-12 flex flex-col justify-center ${themeStyles.bg} relative`}>
                                                        {pointIconStyle !== 'NONE' && <div className="text-6xl mb-6">{pointIconStyle === 'NUMBER' ? <span className={`font-serif-kr font-bold ${theme.text}`}>{`0${idx + 1}`}</span> : block.icon}</div>}
                                                        <EditableElement value={block.title || ''} onChange={(v) => updatePointBlock(block.id, 'title', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-3xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-left', fontWeight: 'font-bold', maxWidth: 'max-w-2xl' }} className="mb-6 leading-tight" toolbarPosition="right" />
                                                        <EditableElement value={block.description || ''} onChange={(v) => updatePointBlock(block.id, 'description', v)} isEditMode={isEditMode} aiLabel="Point Desc" defaultStyle={{ fontSize: 'text-lg', fontFamily: themeStyles.fontBody as any, color: pageDesign === 'IMPACT' ? 'text-gray-800' : 'text-gray-600', align: 'text-left', fontWeight: 'font-medium', maxWidth: 'max-w-full' }} className="leading-normal" toolbarPosition="right" />
                                                    </div>
                                                    <div 
                                                        className={`w-1/3 ${theme.lightBg} flex items-center justify-center relative group/side overflow-hidden ${dragOverId === block.id ? 'border-4 border-dashed border-indigo-500' : ''}`}
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
                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100/50 hover:bg-gray-100 transition-colors p-4">
                                                                <span className="text-gray-900 font-bold border-4 border-gray-900 p-4 text-2xl opacity-10 mb-4">POINT {idx+1}</span>
                                                                {isEditMode && (
                                                                    <label className="flex flex-col items-center cursor-pointer bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-400 group/upload">
                                                                        <div className="bg-gray-50 p-3 rounded-full mb-2 group-hover/upload:bg-indigo-50"><PhotoIcon className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" /></div>
                                                                        <span className="text-xs font-bold text-gray-500 group-hover/upload:text-indigo-600">이미지 추가</span>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePointSideImageUpload(block.id, e)} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                            {pointLayout === 'CARDS' && (
                                                <div className="flex flex-col items-center text-center w-full">
                                                    <div className={`absolute top-0 right-0 ${theme.badge} text-white font-bold text-xl px-4 py-2 rounded-bl-2xl`}>POINT {idx+1}</div>
                                                    {pointIconStyle !== 'NONE' && ( <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-md mb-6">{pointIconStyle === 'NUMBER' ? <span className={`font-serif-kr font-bold ${theme.text}`}>{`0${idx + 1}`}</span> : block.icon}</div> )}
                                                    <EditableElement value={block.title || ''} onChange={(v) => updatePointBlock(block.id, 'title', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} className="mb-4" toolbarPosition="right" />
                                                    <div className="w-10 h-1 bg-gray-300 mb-6"></div>
                                                    <EditableElement value={block.description || ''} onChange={(v) => updatePointBlock(block.id, 'description', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontBody as any, color: pageDesign === 'IMPACT' ? 'text-gray-800' : 'text-gray-600', align: 'text-center', fontWeight: 'font-normal', maxWidth: 'max-w-2xl' }} className="leading-normal" toolbarPosition="right" />
                                                </div>
                                            )}
                                            {pointLayout === 'SIMPLE' && (
                                                <div className="w-full">
                                                    {pointIconStyle !== 'NONE' && ( <div className="flex items-center gap-4 mb-2"><span className="text-4xl">{pointIconStyle === 'NUMBER' ? <span className={`font-serif-kr font-bold ${theme.text}`}>{`0${idx + 1}`}</span> : block.icon}</span></div> )}
                                                    <EditableElement value={block.title || ''} onChange={(v) => updatePointBlock(block.id, 'title', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-left', fontWeight: 'font-bold' }} className="mb-2" toolbarPosition="right" />
                                                    <EditableElement value={block.description || ''} onChange={(v) => updatePointBlock(block.id, 'description', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontBody as any, color: pageDesign === 'IMPACT' ? 'text-gray-800' : 'text-gray-500', align: 'text-left', fontWeight: 'font-normal', maxWidth: 'max-w-4xl' }} className="leading-normal" toolbarPosition="right" />
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
                                            <EditableElement value={block.content || ''} onChange={(v) => updatePointBlock(block.id, 'content', v)} onStyleChange={(s) => setPointBlocks(prev => prev.map(b => b.id === block.id ? { ...b, style: s } : b))} isEditMode={isEditMode} aiLabel="Text" defaultStyle={block.style || { fontSize: 'text-2xl', fontFamily: themeStyles.fontBody as any, color: 'text-gray-600', align: 'text-center', fontWeight: 'font-normal', maxWidth: 'max-w-4xl' }} className="p-6 rounded-xl leading-normal" toolbarPosition="right" />
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
            <div className={`w-full py-20 ${themeStyles.cardBg} border-t ${themeStyles.tableBorder}`}>
                    <div className="text-center mb-10">
                        <EditableElement value="COLORS & OPTIONS" onChange={() => {}} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-4xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} className="uppercase tracking-widest leading-normal" toolbarPosition="right" />
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
                                        const nameWithoutExt = stripExtension(file.name);
                                        setOptionBlocks(prev => prev.map(b => b.id === block.id ? { ...b, image: url, text: nameWithoutExt } : b));
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
                                <EditableElement value={block.text} onChange={(v) => updateOptionBlock(block.id, 'text', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontBody as any, color: 'text-gray-700', align: 'text-center', fontWeight: 'font-bold' }} toolbarPosition="right" />
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
                     <div className={`w-full ${pageDesign === 'IMPACT' ? 'bg-white' : 'bg-gray-50'} pb-20`}>
                        <div className="w-full py-16 text-center">
                            <EditableElement key={`detail-${pointTheme}`} value={headers.detailView} onChange={(v) => handleHeaderChange('detailView', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-bold' }} className={`inline-block border-2 ${themeStyles.tableBorder} px-10 py-4 tracking-[0.2em] uppercase bg-white w-80`} toolbarPosition="right" />
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
                                        <div className={`w-full ${pageDesign === 'EMOTIONAL' ? 'bg-[#f4f1ea]' : 'bg-gray-100'} p-12 relative group/textblock h-full flex items-center`}>
                                            <EditableElement value={block.content} onChange={(v) => updateBlockContent(block.id, v)} onStyleChange={(s) => setDetailBlocks(prev => prev.map(b => b.id === block.id ? { ...b, style: s } : b))} isEditMode={isEditMode} aiLabel="Detail Text" defaultStyle={block.style || { fontSize: 'text-2xl', fontFamily: themeStyles.fontBody as any, color: 'text-gray-800', align: 'text-center', fontWeight: 'font-medium', maxWidth: 'max-w-4xl' }} className="leading-normal" toolbarPosition="right" />
                                        </div>
                                    )}
                                    {block.type === 'SIZE_CHART' && block.tableData && (
                                        <div className="w-full bg-white p-12 flex flex-col items-center justify-center">
                                            <div id={`size-chart-${block.id}`} className="bg-white p-4 w-full max-w-3xl">
                                                <div className="w-full text-center mb-6">
                                                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{block.content}</h3>
                                                </div>
                                                <div className="w-full overflow-x-auto">
                                                    <div className={`flex flex-col border-t-2 ${themeStyles.tableBorder} w-full min-w-[500px]`}>
                                                        {block.tableData.map((row, rIdx) => (
                                                            <div key={rIdx} className={`flex w-full border-b ${rIdx === 0 ? `${themeStyles.tableHeader}` : `${themeStyles.tableBorder}`}`}>
                                                                {row.map((cell, cIdx) => (
                                                                    <div key={cIdx} className="flex-1 p-4 min-w-[80px] relative border-r border-gray-100 last:border-0 align-top">
                                                                        <AutoResizeTextarea
                                                                            value={cell} 
                                                                            onChange={(e) => updateTableCell(block.id, rIdx, cIdx, e.target.value)} 
                                                                            className={`text-center text-2xl ${rIdx === 0 ? 'font-bold' : 'text-gray-600'}`}
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
                    <div className={`w-full ${themeStyles.bg} pt-24 pb-40 px-10`}>
                        <div className="mb-8 text-center text-gray-500 space-y-1">
                             <EditableElement value={disclaimerText} onChange={setDisclaimerText} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-sm', fontFamily: themeStyles.fontBody as any, color: 'text-gray-500', align: 'text-center', fontWeight: 'font-normal' }} toolbarPosition="right" />
                        </div>
                        <div className={`bg-red-50 border-2 border-red-100 p-12 text-center rounded-lg mb-24 ${pageDesign === 'IMPACT' ? 'border-4 border-red-600 bg-white' : ''}`}>
                            <h4 className="text-red-600 font-black text-2xl mb-4 uppercase tracking-wide flex items-center justify-center gap-3">⚠️ Check Point</h4>
                            <EditableElement key={`size-${pointTheme}`} value={editableCopy.sizeTip} onChange={(v) => handleCopyChange('sizeTip', v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-bold' }} toolbarPosition="right" />
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <div className="mt-12 text-center"><EditableElement value={copyright} onChange={setCopyright} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-xl', fontFamily: themeStyles.fontBody as any, color: 'text-gray-400', align: 'text-center', fontWeight: 'font-normal' }} toolbarPosition="right" /></div>
                        </div>

                        {/* ── 상품 정보고시 ─────────────────── */}
                        {infoDisclosure && (infoDisclosure.manufacturer || infoDisclosure.customerService) && (
                            <div className="max-w-4xl mx-auto px-10 pb-16">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                    <span className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">상품 정보고시</span>
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                </div>
                                <table className="w-full text-sm border border-gray-200">
                                    <tbody>
                                        {[
                                            { label: '제품명', value: editableProductName },
                                            { label: '제조자/수입자', value: infoDisclosure.manufacturer },
                                            { label: '원산지', value: infoDisclosure.origin || editableCopy.productInfo.origin },
                                            { label: '소재/재질', value: infoDisclosure.material || editableCopy.productInfo.material },
                                            { label: '사이즈', value: infoDisclosure.size },
                                            { label: '색상', value: infoDisclosure.color },
                                            { label: '세탁방법', value: infoDisclosure.wash || (category === 'FASHION' ? '미지근한 물에 중성세제로 손세탁 또는 세탁망에 넣어 울코스 세탁을 권장합니다' : undefined) },
                                            { label: '원재료명', value: infoDisclosure.ingredients },
                                            { label: '용량/중량', value: infoDisclosure.capacity },
                                            { label: '유통기한', value: infoDisclosure.expiry },
                                            { label: '보관방법', value: infoDisclosure.storage },
                                            { label: '인증여부', value: infoDisclosure.haccp || infoDisclosure.certifications },
                                            { label: '품질보증', value: infoDisclosure.warranty },
                                            { label: '주의사항', value: infoDisclosure.caution },
                                            { label: '고객센터', value: infoDisclosure.customerService },
                                        ].filter(r => r.value).map((row, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                <th className="py-3 px-5 text-left text-xs font-bold text-gray-500 w-32 border-b border-gray-100 whitespace-nowrap">{row.label}</th>
                                                <td className="py-3 px-5 text-xs text-gray-700 border-b border-gray-100">{row.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
            );

        /* ═══════════════════════════════════════════════════════
           ★ 신규 섹션 렌더러 (planSections 기반, 편집 가능)
           ═══════════════════════════════════════════════════════ */

        // ── 비주얼 클로즈업 ───────────────────
        case 'VISUAL_CLOSEUP': {
            const planType = getPlanData('VISUAL_CLOSEUP')?.type || 'CLOSEUP';
            return (
                <div className={`w-full py-20 ${themeStyles.bg}`}>
                    <div className="text-center mb-14 px-10">
                        <EditableElement value={getPlanTitle(planType, '비주얼 클로즈업')} onChange={(v) => updatePlanTitle(planType, v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-3xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} className="tracking-tight mb-4" toolbarPosition="right" />
                        <EditableElement value={getPlanContent(planType, '제품의 디테일을 가까이에서 확인하세요')} onChange={(v) => updatePlanContent(planType, v)} isEditMode={isEditMode} aiLabel="Visual Closeup" defaultStyle={{ fontSize: 'text-xl', fontFamily: themeStyles.fontBody as any, color: 'text-gray-500', align: 'text-center', fontWeight: 'font-normal' }} toolbarPosition="right" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                        {detailBlocks.filter(b => b.type === 'IMAGE').slice(0, 4).map((block, idx) => (
                            <div key={block.id + '-closeup-' + idx} className="relative aspect-square overflow-hidden bg-gray-100">
                                <img src={block.content} alt={`Closeup ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" crossOrigin="anonymous" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // ── 고객 후기 ───────────────────
        case 'REVIEW': {
            const planType = getPlanData('REVIEW')?.type || 'REVIEW';
            const contentVal = getPlanContent(planType, '');
            const rawReviews = splitContentItems(contentVal);
            const displayReviews = rawReviews.length >= 3 ? rawReviews : [
                rawReviews[0] || '화면보다 실물이 훨씬 고급스러워요. 디테일이 포인트가 되어서 얼굴이 확 살아나네요',
                rawReviews[1] || '재질이 너무 부드러워서 단독으로 입어도 깔깔함이 전혀 없어요. 핏도 예술입니다',
                rawReviews[2] || '소개팅 룩으로 입었는데 예쁘다는 소리 정말 많이 들었어요. 무조건 추천합니다!',
            ];
            return (
                <div className={`w-full py-20 ${pageDesign === 'EMOTIONAL' ? 'bg-[#fdfbf7]' : themeStyles.cardBg}`}>
                    <div className="text-center mb-6 px-10">
                        <div className="text-4xl mb-3">💬</div>
                        <EditableElement value={getPlanTitle(planType, '실제 구매 고객이 증명하는 핏과 분위기')} onChange={(v) => updatePlanTitle(planType, v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} className="tracking-tight" toolbarPosition="right" />
                    </div>
                    {/* ★ 평점 별도 줄 */}
                    <div className="text-center mb-12">
                        <span className="text-yellow-400 text-lg tracking-wider">★★★★★</span>
                        <span className="ml-2 text-sm text-gray-500 font-medium">평점 4.9 / 5.0</span>
                    </div>
                    <div className="max-w-3xl mx-auto px-10 space-y-5">
                        {displayReviews.map((review, i) => (
                            <div key={`review-${i}`} className={`${themeStyles.bg} rounded-2xl p-6 shadow-sm border border-gray-100 ${pageDesign === 'IMPACT' ? 'border-2 border-black' : ''}`}>
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, s) => (
                                        <span key={s} className="text-yellow-400 text-sm">★</span>
                                    ))}
                                </div>
                                <EditableElement value={review} onChange={(v) => {
                                    const items = [...displayReviews];
                                    items[i] = v;
                                    updatePlanContent(planType, items.join('\n'));
                                }} isEditMode={isEditMode} aiLabel="Review" defaultStyle={{ fontSize: 'text-sm', fontFamily: themeStyles.fontBody as any, color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} className="leading-relaxed" toolbarPosition="right" />
                                <div className="mt-3 text-xs text-gray-400 font-medium">구매 고객 {String.fromCharCode(65 + i)}** 님</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // ── 추천 대상 ───────────────────
        case 'RECOMMEND': {
            const planType = getPlanData('RECOMMEND')?.type || 'RECOMMEND';
            const contentVal = getPlanContent(planType, '모든 분께 추천드립니다');
            const items = splitContentItems(contentVal);
            return (
                <div className={`w-full py-20 ${themeStyles.bg}`}>
                    <div className="text-center mb-12 px-10">
                        <EditableElement value={getPlanTitle(planType, '이런 분들께 추천합니다')} onChange={(v) => updatePlanTitle(planType, v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-2xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} toolbarPosition="right" />
                    </div>
                    <div className="max-w-2xl mx-auto px-10 space-y-3">
                        {items.map((item, i) => (
                            <div key={`recommend-${i}`} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                                <span className={`shrink-0 ${theme.text} text-lg`}>✓</span>
                                <EditableElement value={item} onChange={(v) => {
                                    const all = splitContentItems(contentVal);
                                    all[i] = v;
                                    updatePlanContent(planType, all.join('\n'));
                                }} isEditMode={isEditMode} aiLabel="Recommend" defaultStyle={{ fontSize: 'text-sm', fontFamily: themeStyles.fontBody as any, color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} className="leading-relaxed" toolbarPosition="right" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // ── 사이즈 가이드 ───────────────────
        case 'SIZE_GUIDE': {
            const planType = getPlanData('SIZE_GUIDE')?.type || 'SIZE';
            return (
                <div className={`w-full py-20 ${themeStyles.cardBg}`}>
                    <div className="text-center mb-14 px-10">
                        <div className="text-5xl mb-4">📐</div>
                        <EditableElement value={getPlanTitle(planType, '사이즈 가이드')} onChange={(v) => updatePlanTitle(planType, v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-3xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} toolbarPosition="right" />
                    </div>
                    <div className="max-w-4xl mx-auto px-10">
                        <div className={`${themeStyles.bg} rounded-2xl p-8 shadow-sm border ${themeStyles.tableBorder}`}>
                            <EditableElement value={getPlanContent(planType, '상세 사이즈 정보를 확인하세요')} onChange={(v) => updatePlanContent(planType, v)} isEditMode={isEditMode} aiLabel="Size Guide" defaultStyle={{ fontSize: 'text-base', fontFamily: themeStyles.fontBody as any, color: 'text-gray-700', align: 'text-center', fontWeight: 'font-normal' }} className="leading-relaxed whitespace-pre-wrap" toolbarPosition="right" />
                        </div>
                        {detailBlocks.filter(b => b.type === 'SIZE_CHART').slice(0, 1).map(block => (
                            <div key={block.id + '-size-ref'} className="mt-6">
                                <table className={`w-full text-sm border ${themeStyles.tableBorder}`}>
                                    <tbody>
                                        {block.tableData?.map((row, ri) => (
                                            <tr key={ri} className={ri === 0 ? themeStyles.tableHeader : ''}>
                                                {row.map((cell, ci) => ri === 0 ? (
                                                    <th key={ci} className="py-3 px-4 text-center font-bold border-b border-gray-200">{cell}</th>
                                                ) : (
                                                    <td key={ci} className="py-3 px-4 text-center border-b border-gray-100">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // ── 제품 가이드 (세탁/관리법) ───────────────────
        case 'PRODUCT_GUIDE': {
            const planType = getPlanData('PRODUCT_GUIDE')?.type || 'GUIDE';
            const contentVal = getPlanContent(planType, '올바른 사용법을 확인하세요');
            const steps = splitContentItems(contentVal);
            return (
                <div className={`w-full py-20 ${themeStyles.bg}`}>
                    <div className="text-center mb-14 px-10">
                        <EditableElement value={getPlanTitle(planType, '제품 관리 가이드')} onChange={(v) => updatePlanTitle(planType, v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-3xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} toolbarPosition="right" />
                    </div>
                    <div className="max-w-3xl mx-auto px-10 space-y-0">
                        {steps.map((step, i) => (
                            <div key={`guide-${i}`} className={`flex items-start gap-5 py-5 ${i < steps.length - 1 ? (pageDesign === 'IMPACT' ? 'border-b-2 border-black' : `border-b ${themeStyles.tableBorder}`) : ''}`}>
                                <div className={`shrink-0 w-10 h-10 rounded-full ${theme.bg} text-white flex items-center justify-center font-black text-base`}>{i + 1}</div>
                                <EditableElement value={step} onChange={(v) => {
                                    const all = splitContentItems(contentVal);
                                    all[i] = v;
                                    updatePlanContent(planType, all.join('\n'));
                                }} isEditMode={isEditMode} aiLabel="Product Guide" defaultStyle={{ fontSize: 'text-base', fontFamily: themeStyles.fontBody as any, color: 'text-gray-800', align: 'text-left', fontWeight: 'font-normal' }} className="leading-relaxed pt-2" toolbarPosition="right" />
                            </div>
                        ))}
                    </div>
                    {isEditMode && (
                        <div className="max-w-3xl mx-auto px-10 mt-8">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all cursor-pointer">
                                <PhotoIcon className="w-8 h-8 mx-auto mb-2" />
                                <span className="text-sm font-bold">세탁/관리 안내 이미지 추가 (선택)</span>
                                <p className="text-xs text-gray-400 mt-1">세탁 기호 이미지를 여기에 드래그하세요</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // ── 구매 전 확인사항 ───────────────────
        case 'CAUTION_NOTE': {
            const planType = getPlanData('CAUTION_NOTE')?.type || 'CAUTION';
            const contentVal = getPlanContent(planType, '구매 전 꼭 확인해주세요');
            const notes = splitContentItems(contentVal);
            return (
                <div className={`w-full py-20 ${themeStyles.cardBg}`}>
                    <div className="text-center mb-14 px-10">
                        <EditableElement value={getPlanTitle(planType, '구매 전 확인사항')} onChange={(v) => updatePlanTitle(planType, v)} isEditMode={isEditMode} defaultStyle={{ fontSize: 'text-3xl', fontFamily: themeStyles.fontHead as any, color: themeStyles.text, align: 'text-center', fontWeight: 'font-black' }} toolbarPosition="right" />
                    </div>
                    <div className="max-w-3xl mx-auto px-10">
                        <div className={`${pageDesign === 'IMPACT' ? 'bg-white border-4 border-black' : 'bg-amber-50 border-2 border-amber-200'} rounded-xl p-8`}>
                            <div className="flex items-center gap-3 mb-5">
                                <span className="text-2xl">⚠️</span>
                                <span className={`text-lg font-bold ${pageDesign === 'IMPACT' ? 'text-black' : 'text-amber-700'}`}>반드시 확인해주세요</span>
                            </div>
                            <div className="space-y-3">
                                {notes.map((note, i) => (
                                    <div key={`caution-${i}`} className="flex items-start gap-3">
                                        <span className={`shrink-0 mt-2 w-1.5 h-1.5 rounded-full ${pageDesign === 'IMPACT' ? 'bg-black' : 'bg-amber-500'}`}></span>
                                        <EditableElement value={note} onChange={(v) => {
                                            const all = splitContentItems(contentVal);
                                            all[i] = v;
                                            updatePlanContent(planType, all.join('\n'));
                                        }} isEditMode={isEditMode} aiLabel="Caution" defaultStyle={{ fontSize: 'text-sm', fontFamily: themeStyles.fontBody as any, color: 'text-gray-700', align: 'text-left', fontWeight: 'font-normal' }} className="leading-relaxed" toolbarPosition="right" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }


        default: return null;
    }
  };

  return (
    <div className="flex flex-row justify-center min-h-screen bg-gray-100 py-10 relative">
      {cropTarget && ( <ImageCropper imageUrl={cropTarget.url} onCrop={handleCropComplete} onCancel={() => setCropTarget(null)} /> )}
      {maskEditorTarget && ( <MaskEditor imageUrl={maskEditorTarget.url} onSave={handleMaskSave} onCancel={() => setMaskEditorTarget(null)} /> )}
      {customPromptTarget && ( <CustomPromptModal isOpen={!!customPromptTarget} onClose={() => setCustomPromptTarget(null)} onSubmit={handleCustomPromptSubmit} /> )}
      <div className={`fixed left-4 top-24 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-40 hidden xl:block transition-opacity duration-300 ${isEditMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Page Design Selector */}
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><ComputerDesktopIcon className="w-5 h-5 text-indigo-600" /> 전체 디자인 무드</h3>
        <div className="flex flex-col gap-2 mb-8">
             <button onClick={() => setPageDesign('MODERN')} className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${pageDesign === 'MODERN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                 <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center font-sans text-xs">Ab</div>
                 <div className="text-left"><div className="font-bold">모던 (기본)</div><div className="text-xs opacity-70">깔끔한 고딕, 화이트</div></div>
             </button>
             <button onClick={() => setPageDesign('EMOTIONAL')} className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${pageDesign === 'EMOTIONAL' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                 <div className="w-8 h-8 rounded bg-[#fdfbf7] border border-[#e0dcd0] flex items-center justify-center font-serif-kr text-xs">가</div>
                 <div className="text-left"><div className="font-bold">감성 (무드)</div><div className="text-xs opacity-70">명조체, 웜톤 배경</div></div>
             </button>
             <button onClick={() => setPageDesign('IMPACT')} className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${pageDesign === 'IMPACT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                 <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-sans text-xs font-black">B</div>
                 <div className="text-left"><div className="font-bold">임팩트 (강조)</div><div className="text-xs opacity-70">볼드체, 블랙 라인</div></div>
             </button>
        </div>

        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><SwatchIcon className="w-5 h-5 text-indigo-600" /> 레이아웃 설정</h3>
        <div className="mb-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">포인트 섹션 스타일</h4>
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
            {sectionOrder.map((sectionType, idx) => { 
                // ★ 필수 섹션(HERO, DETAILS, INFO)을 제외한 나머지는 삭제 가능
                const deletableSections: SectionType[] = ['STORY', 'VISUAL_CLOSEUP', 'REVIEW', 'POINTS', 'OPTIONS', 'RECOMMEND', 'SIZE_GUIDE', 'PRODUCT_GUIDE', 'CAUTION_NOTE'];
                const canDelete = deletableSections.includes(sectionType);
                return (
                    <SectionControlWrapper key={sectionType} type={sectionType} index={idx} isEditMode={isEditMode} isFirst={idx === 0} isLast={idx === sectionOrder.length - 1} onMove={moveSection} onDelete={canDelete ? () => removeSection(sectionType) : undefined}>{renderSectionContent(sectionType)}</SectionControlWrapper>
                );
            })}
        </div>
      </div>
    </div>
  );
};
