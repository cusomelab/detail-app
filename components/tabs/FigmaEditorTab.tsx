import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ProductCategory, ProductInfoDisclosure } from '../../types';
import { generateProductCopy, generateStyledShots, setApiKey } from '../../services/geminiService';
import {
  ArrowUpTrayIcon, PhotoIcon, SparklesIcon,
  ShoppingBagIcon, HomeIcon, FireIcon, CakeIcon, SwatchIcon,
  PlusIcon, TrashIcon, ArrowsPointingOutIcon, EyeIcon, EyeSlashIcon,
  ChevronUpIcon, ChevronDownIcon, DocumentTextIcon, ArrowDownTrayIcon,
  Square2StackIcon, PaintBrushIcon, CursorArrowRaysIcon,
  Squares2X2Icon, RectangleGroupIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

// ── 캔버스 블록 타입 ──
type CanvasBlockType = 'IMAGE' | 'TEXT' | 'DIVIDER' | 'SPACER' | 'BANNER' | 'POINT_GROUP' | 'INFO_TABLE' | 'OPTION_GRID';

interface CanvasBlock {
  id: string;
  type: CanvasBlockType;
  content: string;
  width: 'FULL' | 'HALF' | 'THIRD';
  height?: number;
  visible: boolean;
  locked: boolean;
  // 스타일
  bgColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: string;
  padding?: string;
  borderRadius?: string;
  opacity?: number;
  // 이미지
  imageUrl?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  // 포인트 그룹
  points?: { icon: string; title: string; desc: string; image?: string }[];
  // 옵션 그리드
  options?: { image: string; label: string }[];
  // 정보 테이블
  tableRows?: { label: string; value: string }[];
  // 배너
  badgeText?: string;
  subText?: string;
  // overlay
  overlayText?: string;
  overlayColor?: string;
  overlaySize?: string;
}

// ── 섹션 프리셋 ──
interface SectionPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  blocks: Partial<CanvasBlock>[];
}

const SECTION_PRESETS: SectionPreset[] = [
  {
    id: 'hero', name: '히어로 배너', icon: '🎯',
    description: '대표 이미지 + 메인 카피',
    blocks: [{
      type: 'BANNER', width: 'FULL', content: '당신의 일상을 바꿀 특별한 아이템',
      bgColor: '#ffffff', badgeText: 'NEW ARRIVAL', subText: 'BEST OF BEST',
      height: 600
    }]
  },
  {
    id: 'story', name: '스토리 섹션', icon: '💬',
    description: '감성 스토리텔링 영역',
    blocks: [{
      type: 'TEXT', width: 'FULL', content: '일상 속 특별함을 선사하는\n당신만을 위한 아이템',
      bgColor: '#fdfbf7', textColor: '#374151', fontSize: '24px', fontFamily: 'serif',
      textAlign: 'center', padding: '80px 40px', height: 300
    }]
  },
  {
    id: 'points', name: '포인트 섹션', icon: '✨',
    description: '핵심 포인트 3~4개',
    blocks: [{
      type: 'POINT_GROUP', width: 'FULL', content: 'WHY THIS ITEM',
      bgColor: '#f5f5f5', height: 500,
      points: [
        { icon: '✨', title: '프리미엄 소재', desc: '최상급 원단으로 부드러운 터치감', image: '' },
        { icon: '👗', title: '완벽한 핏', desc: '체형에 맞는 편안한 실루엣', image: '' },
        { icon: '🎨', title: '다양한 컬러', desc: '취향에 맞는 풍성한 색상 라인업', image: '' },
      ]
    }]
  },
  {
    id: 'image-banner', name: '이미지 배너', icon: '🖼️',
    description: '전체 폭 이미지',
    blocks: [{
      type: 'IMAGE', width: 'FULL', content: '', bgColor: '#f0f0f0', height: 400
    }]
  },
  {
    id: 'image-grid', name: '이미지 그리드', icon: '📐',
    description: '2~3열 이미지 그리드',
    blocks: [
      { type: 'IMAGE', width: 'HALF', content: '', bgColor: '#f0f0f0', height: 300 },
      { type: 'IMAGE', width: 'HALF', content: '', bgColor: '#f0f0f0', height: 300 },
    ]
  },
  {
    id: 'text-block', name: '텍스트 블록', icon: '📝',
    description: '자유 텍스트 영역',
    blocks: [{
      type: 'TEXT', width: 'FULL', content: '텍스트를 입력하세요',
      bgColor: '#ffffff', textColor: '#111827', fontSize: '18px',
      textAlign: 'center', padding: '40px', height: 200
    }]
  },
  {
    id: 'divider', name: '구분선', icon: '➖',
    description: '섹션 구분선',
    blocks: [{
      type: 'DIVIDER', width: 'FULL', content: '', height: 60, bgColor: '#ffffff'
    }]
  },
  {
    id: 'spacer', name: '여백', icon: '⬜',
    description: '빈 공간',
    blocks: [{
      type: 'SPACER', width: 'FULL', content: '', height: 80, bgColor: '#ffffff'
    }]
  },
  {
    id: 'options', name: '옵션 그리드', icon: '🎨',
    description: '색상/옵션 선택 영역',
    blocks: [{
      type: 'OPTION_GRID', width: 'FULL', content: 'COLOR OPTIONS',
      bgColor: '#ffffff', height: 300,
      options: [
        { image: '', label: '블랙' },
        { image: '', label: '화이트' },
        { image: '', label: '베이지' },
      ]
    }]
  },
  {
    id: 'info-table', name: '상품 정보', icon: '📋',
    description: '상품정보고시 테이블',
    blocks: [{
      type: 'INFO_TABLE', width: 'FULL', content: '상품 정보고시',
      bgColor: '#f9fafb', height: 400,
      tableRows: [
        { label: '제품명', value: '' },
        { label: '소재', value: '' },
        { label: '색상', value: '' },
        { label: '제조국', value: '' },
        { label: '세탁방법', value: '' },
        { label: '제조자/수입자', value: '' },
      ]
    }]
  },
];

// ── 컬러 프리셋 ──
const COLOR_PRESETS = [
  { name: '화이트', bg: '#ffffff', text: '#111827' },
  { name: '라이트그레이', bg: '#f5f5f5', text: '#111827' },
  { name: '베이지', bg: '#fdfbf7', text: '#374151' },
  { name: '블랙', bg: '#111827', text: '#ffffff' },
  { name: '다크', bg: '#1a1a1a', text: '#f5f5f5' },
  { name: '인디고', bg: '#eef2ff', text: '#3730a3' },
  { name: '핑크', bg: '#fdf2f8', text: '#9d174d' },
  { name: '그린', bg: '#ecfdf5', text: '#065f46' },
];

// ── 메인 컴포넌트 ──
export const FigmaEditorTab: React.FC = () => {
  type EditorStep = 'SETUP' | 'EDITOR';

  const [editorStep, setEditorStep] = useState<EditorStep>('SETUP');
  const [category, setCategory] = useState<ProductCategory>('FASHION');
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [detailImages, setDetailImages] = useState<File[]>([]);
  const [optionImages, setOptionImages] = useState<File[]>([]);
  const [infoDisclosure, setInfoDisclosure] = useState<ProductInfoDisclosure>({
    manufacturer: '', origin: 'Made in China', customerService: '', material: '', size: '', color: '', wash: '',
    ingredients: '', capacity: '', expiry: '', storage: '', haccp: '', certifications: '', warranty: '', caution: ''
  });

  // 캔버스 상태
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPresetPanel, setShowPresetPanel] = useState(true);
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const idCounter = useRef(0);

  const genId = () => `block-${Date.now()}-${idCounter.current++}`;

  // 정보고시 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('saved_info_disclosure');
    if (saved) {
      try { setInfoDisclosure(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {}
    }
  }, []);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // ── 블록 관리 ──
  const addBlocksFromPreset = (preset: SectionPreset) => {
    const newBlocks: CanvasBlock[] = preset.blocks.map(b => ({
      id: genId(),
      type: b.type || 'TEXT',
      content: b.content || '',
      width: b.width || 'FULL',
      height: b.height || 200,
      visible: true,
      locked: false,
      bgColor: b.bgColor,
      textColor: b.textColor,
      fontSize: b.fontSize,
      fontWeight: b.fontWeight,
      fontFamily: b.fontFamily,
      textAlign: b.textAlign,
      padding: b.padding,
      borderRadius: b.borderRadius,
      opacity: b.opacity || 1,
      imageUrl: b.imageUrl,
      objectFit: b.objectFit || 'cover',
      points: b.points,
      options: b.options,
      tableRows: b.tableRows,
      badgeText: b.badgeText,
      subText: b.subText,
      overlayText: b.overlayText,
      overlayColor: b.overlayColor,
      overlaySize: b.overlaySize,
    }));
    setBlocks(prev => [...prev, ...newBlocks]);
  };

  const updateBlock = (id: string, updates: Partial<CanvasBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const newBlock = { ...blocks[idx], id: genId() };
    setBlocks(prev => [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)]);
  };

  const moveBlock = (fromIdx: number, toIdx: number) => {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIdx, 1);
    newBlocks.splice(toIdx, 0, moved);
    setBlocks(newBlocks);
  };

  const moveBlockUp = (idx: number) => { if (idx > 0) moveBlock(idx, idx - 1); };
  const moveBlockDown = (idx: number) => { if (idx < blocks.length - 1) moveBlock(idx, idx + 1); };

  // ── 드래그 앤 드롭 ──
  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragItem.current !== null && dragItem.current !== idx) {
      moveBlock(dragItem.current, idx);
    }
    dragItem.current = null;
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { dragItem.current = null; setDragOverIndex(null); };

  // ── AI 자동 생성 ──
  const handleAIGenerate = async () => {
    if (!productName) { alert('상품명을 입력해주세요'); return; }
    setIsGenerating(true);
    try {
      const copy = await generateProductCopy(productName, features, category, '', mainImage);
      const ts = Date.now();
      const newBlocks: CanvasBlock[] = [];

      // 히어로
      const heroBlock: CanvasBlock = {
        id: genId(), type: 'BANNER', content: copy.mainHook, width: 'FULL',
        height: 600, visible: true, locked: false, bgColor: '#ffffff',
        badgeText: 'NEW ARRIVAL', subText: productName,
      };
      if (mainImage) heroBlock.imageUrl = URL.createObjectURL(mainImage);
      newBlocks.push(heroBlock);

      // 스토리
      if (copy.story) {
        newBlocks.push({
          id: genId(), type: 'TEXT', content: copy.story, width: 'FULL',
          height: 250, visible: true, locked: false,
          bgColor: '#fdfbf7', textColor: '#374151', fontSize: '20px', fontFamily: 'serif',
          textAlign: 'center', padding: '60px 40px',
        });
      }

      // AI 연출 이미지 생성
      let styledImages: string[] = [];
      if (mainImage) {
        try {
          const shots = await generateStyledShots(mainImage, category, () => {});
          styledImages = shots.map(s => s.imageUrl);
        } catch {}
      }

      // 포인트
      newBlocks.push({
        id: genId(), type: 'POINT_GROUP', content: 'WHY THIS ITEM', width: 'FULL',
        height: 500, visible: true, locked: false, bgColor: '#f5f5f5',
        points: copy.sellingPoints.map((p, i) => ({
          icon: p.icon || '✨', title: p.title, desc: p.description,
          image: styledImages[i] || ''
        })),
      });

      // 상세 이미지들
      detailImages.forEach((f, i) => {
        newBlocks.push({
          id: genId(), type: 'IMAGE', content: '', width: 'FULL',
          height: 500, visible: true, locked: false,
          imageUrl: URL.createObjectURL(f), bgColor: '#ffffff',
        });
        // 중간 카피 삽입
        if (copy.detailCopies && copy.detailCopies[Math.floor(i / 2)] && i % 2 === 1) {
          newBlocks.push({
            id: genId(), type: 'TEXT', content: copy.detailCopies[Math.floor(i / 2)],
            width: 'FULL', height: 120, visible: true, locked: false,
            bgColor: '#ffffff', textColor: '#374151', fontSize: '22px',
            textAlign: 'center', padding: '40px', fontWeight: 'bold',
          });
        }
      });

      // 옵션
      if (optionImages.length > 0) {
        newBlocks.push({
          id: genId(), type: 'OPTION_GRID', content: 'COLOR OPTIONS', width: 'FULL',
          height: 300, visible: true, locked: false, bgColor: '#ffffff',
          options: optionImages.map(f => ({
            image: URL.createObjectURL(f),
            label: f.name.replace(/\.[^/.]+$/, '')
          })),
        });
      }

      // 정보 테이블
      const rows: { label: string; value: string }[] = [
        { label: '제품명', value: productName },
        { label: '소재', value: infoDisclosure.material || copy.productInfo?.material || '' },
        { label: '색상', value: infoDisclosure.color || '' },
        { label: '제조국', value: infoDisclosure.origin || 'Made in China' },
        { label: '세탁방법', value: infoDisclosure.wash || copy.productInfo?.wash || '' },
        { label: '제조자/수입자', value: infoDisclosure.manufacturer || '' },
        { label: '고객센터', value: infoDisclosure.customerService || '' },
      ].filter(r => r.value);

      newBlocks.push({
        id: genId(), type: 'INFO_TABLE', content: '상품 정보고시', width: 'FULL',
        height: 400, visible: true, locked: false, bgColor: '#f9fafb',
        tableRows: rows,
      });

      setBlocks(newBlocks);
      setEditorStep('EDITOR');
    } catch (err) {
      alert('생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── 빈 캔버스로 시작 ──
  const handleStartEmpty = () => {
    setBlocks([]);
    setEditorStep('EDITOR');
  };

  // ── 이미지 파일 핸들러 ──
  const handleBlockImageUpload = (blockId: string, file: File) => {
    updateBlock(blockId, { imageUrl: URL.createObjectURL(file) });
  };

  // ── 다운로드 ──
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setIsDownloading(true);
    setSelectedBlockId(null);
    try {
      await new Promise(r => setTimeout(r, 200));
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2, useCORS: true, allowTaint: true,
        width: canvasRef.current.scrollWidth,
        height: canvasRef.current.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `${productName || '상세이미지'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch { alert('다운로드 실패'); }
    finally { setIsDownloading(false); }
  };

  // ── SETUP 화면 ──
  if (editorStep === 'SETUP') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-4">
            <RectangleGroupIcon className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-600">FIGMA-STYLE EDITOR</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">고급형 상세페이지 에디터</h2>
          <p className="text-gray-500 text-sm">피그마처럼 자유롭게 섹션을 배치하고 편집하세요</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 왼쪽: 상품 정보 */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-bold text-gray-700 mb-3">카테고리 *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['FASHION','LIVING','KITCHEN','FOOD'] as ProductCategory[]).map(cat=>(
                  <button key={cat} type="button" onClick={()=>setCategory(cat)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${category===cat?'border-purple-600 bg-purple-50 text-purple-700':'border-gray-200 hover:border-purple-300 text-gray-500'}`}>
                    {cat==='FASHION'&&<ShoppingBagIcon className="w-5 h-5"/>}
                    {cat==='LIVING'&&<HomeIcon className="w-5 h-5"/>}
                    {cat==='KITCHEN'&&<FireIcon className="w-5 h-5"/>}
                    {cat==='FOOD'&&<CakeIcon className="w-5 h-5"/>}
                    <span className="text-xs font-bold">{cat==='FASHION'?'의류/패션':cat==='LIVING'?'리빙/홈':cat==='KITCHEN'?'주방/유아':'식품/건강'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">상품명 *</label>
                <input value={productName} onChange={e=>setProductName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                  placeholder="예: 마켓피아 니트 리본 포인트 긴팔 티셔츠" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">주요 특징</label>
                <textarea value={features} onChange={e=>setFeatures(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none"
                  placeholder="예: 100% 면, 오버핏, 4가지 컬러" />
              </div>
            </div>

            {/* 상품정보고시 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button type="button" onClick={()=>setShowInfoForm(!showInfoForm)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-gray-400"/>
                  <span className="text-sm font-bold text-gray-700">상품 정보고시</span>
                </div>
                {showInfoForm?<ChevronUpIcon className="w-4 h-4 text-gray-400"/>:<ChevronDownIcon className="w-4 h-4 text-gray-400"/>}
              </button>
              {showInfoForm && (
                <div className="px-5 pb-4 border-t border-gray-50 space-y-2 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[{name:'manufacturer',label:'제조자/수입자',ph:'(주)폰이지'},{name:'origin',label:'원산지',ph:'Made in China'},{name:'customerService',label:'고객센터',ph:'0507-1311-1108'}].map(f=>(
                      <div key={f.name}><label className="block text-[10px] font-bold text-gray-500 mb-0.5">{f.label}</label>
                      <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={e=>setInfoDisclosure(p=>({...p,[f.name]:e.target.value}))} placeholder={f.ph} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                    ))}
                  </div>
                  {category==='FASHION'&&(
                    <div className="grid grid-cols-2 gap-2">
                      {[{name:'material',label:'소재',ph:'폴리에스터 95%'},{name:'size',label:'사이즈',ph:'S/M/L/XL'},{name:'color',label:'색상',ph:'화이트, 블랙'},{name:'wash',label:'세탁방법',ph:'울코스 세탁'}].map(f=>(
                        <div key={f.name}><label className="block text-[10px] font-bold text-gray-500 mb-0.5">{f.label}</label>
                        <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={e=>setInfoDisclosure(p=>({...p,[f.name]:e.target.value}))} placeholder={f.ph} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                      ))}
                    </div>
                  )}
                  {category==='FOOD'&&(
                    <div className="grid grid-cols-2 gap-2">
                      {[{name:'ingredients',label:'원재료명',ph:'밀가루, 설탕'},{name:'capacity',label:'용량/중량',ph:'200g'},{name:'expiry',label:'유통기한',ph:'제조일로부터 1년'},{name:'storage',label:'보관방법',ph:'냉장보관'}].map(f=>(
                        <div key={f.name}><label className="block text-[10px] font-bold text-gray-500 mb-0.5">{f.label}</label>
                        <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={e=>setInfoDisclosure(p=>({...p,[f.name]:e.target.value}))} placeholder={f.ph} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                      ))}
                    </div>
                  )}
                  {(category==='LIVING'||category==='KITCHEN')&&(
                    <div className="grid grid-cols-2 gap-2">
                      {[{name:'material',label:'소재/재질',ph:'ABS 플라스틱'},{name:'certifications',label:'인증/허가',ph:'KC 인증'},{name:'warranty',label:'품질보증',ph:'구매일로부터 1년'},{name:'caution',label:'주의사항',ph:'직사광선 피해 보관'}].map(f=>(
                        <div key={f.name}><label className="block text-[10px] font-bold text-gray-500 mb-0.5">{f.label}</label>
                        <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={e=>setInfoDisclosure(p=>({...p,[f.name]:e.target.value}))} placeholder={f.ph} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                      ))}
                    </div>
                  )}
                  <button onClick={()=>{localStorage.setItem('saved_info_disclosure',JSON.stringify(infoDisclosure));alert('저장됨');}} className="w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">저장</button>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 이미지 업로드 */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-bold text-gray-700 mb-3">이미지 업로드</label>
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer relative h-32 transition-all border-gray-200 hover:border-purple-400 hover:bg-purple-50/30">
                  <input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0])setMainImage(e.target.files[0])}} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {mainImage ? (
                    <div className="pointer-events-none flex flex-col items-center">
                      <img src={URL.createObjectURL(mainImage)} alt="" className="h-16 object-contain mb-1"/>
                      <p className="text-xs text-green-600 font-bold truncate max-w-full px-2">{mainImage.name}</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none flex flex-col items-center">
                      <PhotoIcon className="h-8 w-8 mb-1 text-gray-300"/>
                      <span className="text-sm font-medium text-gray-500">대표 이미지</span>
                    </div>
                  )}
                </div>

                <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer relative h-24 transition-all border-gray-200 hover:border-purple-400 hover:bg-purple-50/30">
                  <input type="file" accept="image/*" multiple onChange={e=>{if(e.target.files)setDetailImages(prev=>[...prev,...Array.from(e.target.files!)])}} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="pointer-events-none flex flex-col items-center">
                    {detailImages.length > 0 ? (
                      <><span className="text-2xl font-black text-purple-600">{detailImages.length}</span><span className="text-xs text-gray-500">상세 이미지</span></>
                    ) : (
                      <><ArrowUpTrayIcon className="h-6 w-6 mb-1 text-gray-300"/><span className="text-sm font-medium text-gray-500">상세 이미지</span></>
                    )}
                  </div>
                </div>

                <div className="border-2 border-dashed rounded-xl p-3 flex items-center justify-center cursor-pointer relative h-14 transition-all border-gray-200 hover:border-purple-400 hover:bg-purple-50/30">
                  <input type="file" accept="image/*" multiple onChange={e=>{if(e.target.files)setOptionImages(prev=>[...prev,...Array.from(e.target.files!)])}} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="pointer-events-none flex items-center gap-2 text-gray-400">
                    <SwatchIcon className="w-5 h-5"/>
                    {optionImages.length > 0 ? <span className="font-bold text-purple-600 text-sm">{optionImages.length}개 옵션</span> : <span className="text-sm font-medium">옵션 이미지</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* 시작 버튼 */}
            <button onClick={handleAIGenerate} disabled={isGenerating || !productName}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-black text-base rounded-2xl shadow-xl shadow-purple-200 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]">
              {isGenerating ? (
                <><ArrowPathIcon className="w-5 h-5 animate-spin"/> AI 생성 중...</>
              ) : (
                <><SparklesIcon className="w-5 h-5"/> AI 자동 구성으로 시작</>
              )}
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="absolute bg-gray-50 px-3 text-xs text-gray-400">또는</span>
            </div>

            <button onClick={handleStartEmpty}
              className="w-full py-3 bg-white border-2 border-gray-200 hover:border-purple-400 text-gray-700 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all">
              <Squares2X2Icon className="w-5 h-5"/> 빈 캔버스로 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EDITOR 화면 ──
  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* 왼쪽 패널: 섹션 프리셋 + 레이어 */}
      {showPresetPanel && (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0">
          {/* 섹션 프리셋 */}
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-900 mb-2 flex items-center gap-1.5">
              <PlusIcon className="w-3.5 h-3.5"/> 섹션 추가
            </h3>
            <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
              {SECTION_PRESETS.map(preset => (
                <button key={preset.id} onClick={() => addBlocksFromPreset(preset)}
                  className="flex flex-col items-center p-2 rounded-lg border border-gray-100 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-center">
                  <span className="text-lg mb-0.5">{preset.icon}</span>
                  <span className="text-[10px] font-bold text-gray-700 leading-tight">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 레이어 목록 */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-black text-gray-900 mb-2 flex items-center gap-1.5">
              <Square2StackIcon className="w-3.5 h-3.5"/> 레이어 ({blocks.length})
            </h3>
            <div className="space-y-1">
              {blocks.map((block, idx) => (
                <div key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all ${
                    selectedBlockId === block.id ? 'bg-purple-100 border border-purple-300' :
                    dragOverIndex === idx ? 'bg-blue-50 border border-blue-300' :
                    'hover:bg-gray-50 border border-transparent'
                  } ${!block.visible ? 'opacity-40' : ''}`}>
                  <span className="cursor-grab text-gray-400 hover:text-gray-600">⠿</span>
                  <span className="truncate flex-1 font-medium text-gray-700">
                    {block.type === 'BANNER' ? '🎯 배너' :
                     block.type === 'IMAGE' ? '🖼️ 이미지' :
                     block.type === 'TEXT' ? '📝 텍스트' :
                     block.type === 'POINT_GROUP' ? '✨ 포인트' :
                     block.type === 'OPTION_GRID' ? '🎨 옵션' :
                     block.type === 'INFO_TABLE' ? '📋 정보' :
                     block.type === 'DIVIDER' ? '➖ 구분선' :
                     '⬜ 여백'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { visible: !block.visible }); }}
                    className="text-gray-400 hover:text-gray-600">
                    {block.visible ? <EyeIcon className="w-3 h-3"/> : <EyeSlashIcon className="w-3 h-3"/>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 중앙: 캔버스 */}
      <div className="flex-1 overflow-auto bg-gray-100 relative">
        {/* 캔버스 툴바 */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPresetPanel(!showPresetPanel)}
              className={`p-1.5 rounded-lg transition-all ${showPresetPanel ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-100'}`}>
              <Squares2X2Icon className="w-4 h-4"/>
            </button>
            <span className="text-xs text-gray-400 mx-2">|</span>
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="text-xs text-gray-500 hover:text-gray-700 font-bold px-1">-</button>
            <span className="text-xs font-bold text-gray-700 min-w-[40px] text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="text-xs text-gray-500 hover:text-gray-700 font-bold px-1">+</button>
            <button onClick={() => setZoom(100)} className="text-[10px] text-gray-400 hover:text-gray-600 ml-1">리셋</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} disabled={isDownloading || blocks.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-all">
              <ArrowDownTrayIcon className="w-3.5 h-3.5"/> {isDownloading ? '저장 중...' : 'JPG 다운로드'}
            </button>
            <button onClick={() => setShowPropertyPanel(!showPropertyPanel)}
              className={`p-1.5 rounded-lg transition-all ${showPropertyPanel ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-100'}`}>
              <PaintBrushIcon className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* 캔버스 영역 */}
        <div className="flex justify-center py-6 px-4">
          <div ref={canvasRef}
            className="bg-white shadow-2xl border border-gray-200"
            style={{ width: `${860 * zoom / 100}px`, transform: `scale(1)`, transformOrigin: 'top center' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedBlockId(null); }}>

            {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <RectangleGroupIcon className="w-16 h-16 mb-4 text-gray-300"/>
                <p className="text-lg font-bold mb-1">빈 캔버스</p>
                <p className="text-sm">왼쪽 패널에서 섹션을 추가하세요</p>
              </div>
            )}

            {blocks.filter(b => b.visible).map((block, idx) => (
              <div key={block.id}
                draggable
                onDragStart={() => handleDragStart(blocks.indexOf(block))}
                onDragOver={(e) => handleDragOver(e, blocks.indexOf(block))}
                onDrop={(e) => handleDrop(e, blocks.indexOf(block))}
                onDragEnd={handleDragEnd}
                onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                className={`relative group transition-all ${
                  selectedBlockId === block.id ? 'ring-2 ring-purple-500 ring-offset-1' : 'hover:ring-1 hover:ring-purple-300'
                } ${dragOverIndex === blocks.indexOf(block) ? 'border-t-4 border-blue-500' : ''}`}
                style={{
                  width: block.width === 'HALF' ? '50%' : block.width === 'THIRD' ? '33.333%' : '100%',
                  display: block.width !== 'FULL' ? 'inline-block' : 'block',
                  verticalAlign: 'top',
                }}>

                {/* 블록 액션 바 */}
                {selectedBlockId === block.id && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900 rounded-lg px-2 py-1 shadow-lg z-10">
                    <button onClick={() => moveBlockUp(blocks.indexOf(block))} className="text-white/70 hover:text-white p-0.5"><ChevronUpIcon className="w-3.5 h-3.5"/></button>
                    <button onClick={() => moveBlockDown(blocks.indexOf(block))} className="text-white/70 hover:text-white p-0.5"><ChevronDownIcon className="w-3.5 h-3.5"/></button>
                    <span className="w-px h-3 bg-white/20 mx-0.5"></span>
                    <button onClick={() => duplicateBlock(block.id)} className="text-white/70 hover:text-white p-0.5"><Square2StackIcon className="w-3.5 h-3.5"/></button>
                    <button onClick={() => deleteBlock(block.id)} className="text-red-400 hover:text-red-300 p-0.5"><TrashIcon className="w-3.5 h-3.5"/></button>
                  </div>
                )}

                {/* 블록 내용 렌더링 */}
                <RenderBlock block={block} onUpdate={(updates) => updateBlock(block.id, updates)} onImageUpload={(f) => handleBlockImageUpload(block.id, f)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 패널: 속성 */}
      {showPropertyPanel && (
        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
          {selectedBlock ? (
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-black text-gray-900">블록 속성</h3>

              {/* 너비 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">너비</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['FULL', 'HALF', 'THIRD'] as const).map(w => (
                    <button key={w} onClick={() => updateBlock(selectedBlock.id, { width: w })}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedBlock.width === w ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {w === 'FULL' ? '100%' : w === 'HALF' ? '50%' : '33%'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 높이 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">높이 ({selectedBlock.height || 200}px)</label>
                <input type="range" min={60} max={1000} step={10}
                  value={selectedBlock.height || 200}
                  onChange={e => updateBlock(selectedBlock.id, { height: parseInt(e.target.value) })}
                  className="w-full accent-purple-600" />
              </div>

              {/* 배경색 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">배경색</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COLOR_PRESETS.map(c => (
                    <button key={c.bg} onClick={() => updateBlock(selectedBlock.id, { bgColor: c.bg, textColor: c.text })}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${selectedBlock.bgColor === c.bg ? 'border-purple-600 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: c.bg }} title={c.name} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={selectedBlock.bgColor || '#ffffff'}
                    onChange={e => updateBlock(selectedBlock.id, { bgColor: e.target.value })}
                    className="w-8 h-6 rounded cursor-pointer border border-gray-200" />
                  <input type="text" value={selectedBlock.bgColor || '#ffffff'}
                    onChange={e => updateBlock(selectedBlock.id, { bgColor: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-[10px] font-mono" />
                </div>
              </div>

              {/* 텍스트 속성 (TEXT / BANNER) */}
              {(selectedBlock.type === 'TEXT' || selectedBlock.type === 'BANNER') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">글자색</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedBlock.textColor || '#111827'}
                        onChange={e => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                        className="w-8 h-6 rounded cursor-pointer border border-gray-200" />
                      <input type="text" value={selectedBlock.textColor || '#111827'}
                        onChange={e => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-[10px] font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">글자 크기</label>
                    <select value={selectedBlock.fontSize || '18px'}
                      onChange={e => updateBlock(selectedBlock.id, { fontSize: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                      {['12px','14px','16px','18px','20px','24px','28px','32px','36px','40px','48px','56px','64px'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">글자 굵기</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[{v:'normal',l:'기본'},{v:'500',l:'중간'},{v:'bold',l:'굵게'},{v:'900',l:'블랙'}].map(w => (
                        <button key={w.v} onClick={() => updateBlock(selectedBlock.id, { fontWeight: w.v })}
                          className={`py-1 rounded text-[10px] font-bold ${(selectedBlock.fontWeight || 'normal') === w.v ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {w.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">글꼴</label>
                    <select value={selectedBlock.fontFamily || 'sans-serif'}
                      onChange={e => updateBlock(selectedBlock.id, { fontFamily: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                      <option value="sans-serif">고딕 (Sans)</option>
                      <option value="serif">명조 (Serif)</option>
                      <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">정렬</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[{v:'left',l:'왼쪽'},{v:'center',l:'가운데'},{v:'right',l:'오른쪽'}].map(a => (
                        <button key={a.v} onClick={() => updateBlock(selectedBlock.id, { textAlign: a.v })}
                          className={`py-1 rounded text-[10px] font-bold ${(selectedBlock.textAlign || 'center') === a.v ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {a.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 이미지 속성 */}
              {selectedBlock.type === 'IMAGE' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">이미지 맞춤</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[{v:'cover' as const,l:'채우기'},{v:'contain' as const,l:'맞추기'},{v:'fill' as const,l:'늘리기'}].map(f => (
                      <button key={f.v} onClick={() => updateBlock(selectedBlock.id, { objectFit: f.v })}
                        className={`py-1 rounded text-[10px] font-bold ${(selectedBlock.objectFit || 'cover') === f.v ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 불투명도 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">불투명도 ({Math.round((selectedBlock.opacity || 1) * 100)}%)</label>
                <input type="range" min={0} max={100} step={5}
                  value={(selectedBlock.opacity || 1) * 100}
                  onChange={e => updateBlock(selectedBlock.id, { opacity: parseInt(e.target.value) / 100 })}
                  className="w-full accent-purple-600" />
              </div>

              {/* 삭제 */}
              <button onClick={() => deleteBlock(selectedBlock.id)}
                className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5">
                <TrashIcon className="w-3.5 h-3.5"/> 블록 삭제
              </button>
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center justify-center h-full text-gray-400">
              <CursorArrowRaysIcon className="w-10 h-10 mb-3 text-gray-300"/>
              <p className="text-sm font-bold">블록을 선택하세요</p>
              <p className="text-xs mt-1">속성을 편집할 수 있습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── 블록 렌더러 ──
const RenderBlock: React.FC<{
  block: CanvasBlock;
  onUpdate: (updates: Partial<CanvasBlock>) => void;
  onImageUpload: (file: File) => void;
}> = ({ block, onUpdate, onImageUpload }) => {
  const commonStyle = {
    backgroundColor: block.bgColor || '#ffffff',
    minHeight: `${block.height || 200}px`,
    opacity: block.opacity ?? 1,
  };

  switch (block.type) {
    case 'BANNER':
      return (
        <div style={commonStyle} className="relative flex flex-col items-center justify-center overflow-hidden">
          {block.imageUrl && (
            <img src={block.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover"/>
          )}
          <div className="relative z-10 text-center px-8">
            {block.badgeText && (
              <div className="inline-block px-4 py-1 bg-black/80 text-white text-xs font-bold tracking-[0.2em] mb-4 rounded-full"
                contentEditable suppressContentEditableWarning
                onBlur={e => onUpdate({ badgeText: e.currentTarget.textContent || '' })}>
                {block.badgeText}
              </div>
            )}
            <div contentEditable suppressContentEditableWarning
              onBlur={e => onUpdate({ content: e.currentTarget.textContent || '' })}
              className="text-3xl font-black leading-snug mb-3 outline-none"
              style={{ color: block.textColor || '#111827', fontSize: block.fontSize || '36px', fontWeight: block.fontWeight || '900', fontFamily: block.fontFamily || 'sans-serif', textAlign: (block.textAlign || 'center') as any }}>
              {block.content}
            </div>
            {block.subText && (
              <div contentEditable suppressContentEditableWarning
                onBlur={e => onUpdate({ subText: e.currentTarget.textContent || '' })}
                className="text-sm tracking-[0.15em] uppercase outline-none"
                style={{ color: block.textColor ? block.textColor + '99' : '#9ca3af' }}>
                {block.subText}
              </div>
            )}
          </div>
          {!block.imageUrl && (
            <div className="absolute bottom-3 right-3">
              <label className="flex items-center gap-1 px-2 py-1 bg-gray-900/70 text-white rounded-lg text-[10px] cursor-pointer hover:bg-gray-900/90">
                <PhotoIcon className="w-3 h-3"/> 이미지 추가
                <input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0])onImageUpload(e.target.files[0])}} className="hidden"/>
              </label>
            </div>
          )}
        </div>
      );

    case 'IMAGE':
      return (
        <div style={commonStyle} className="relative flex items-center justify-center overflow-hidden">
          {block.imageUrl ? (
            <img src={block.imageUrl} alt="" className="w-full h-full" style={{ objectFit: block.objectFit || 'cover', minHeight: `${block.height || 200}px` }}/>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-gray-400 hover:text-purple-500 transition-colors">
              <PhotoIcon className="w-12 h-12 mb-2"/>
              <span className="text-sm font-medium">이미지를 업로드하세요</span>
              <input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0])onImageUpload(e.target.files[0])}} className="hidden"/>
            </label>
          )}
          {block.imageUrl && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <label className="flex items-center gap-1 px-2 py-1 bg-gray-900/70 text-white rounded-lg text-[10px] cursor-pointer hover:bg-gray-900/90">
                <ArrowPathIcon className="w-3 h-3"/> 변경
                <input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0])onImageUpload(e.target.files[0])}} className="hidden"/>
              </label>
            </div>
          )}
        </div>
      );

    case 'TEXT':
      return (
        <div style={{ ...commonStyle, padding: block.padding || '40px' }} className="flex items-center justify-center">
          <div contentEditable suppressContentEditableWarning
            onBlur={e => onUpdate({ content: e.currentTarget.innerText || '' })}
            className="w-full outline-none whitespace-pre-line"
            style={{
              color: block.textColor || '#111827',
              fontSize: block.fontSize || '18px',
              fontWeight: block.fontWeight || 'normal',
              fontFamily: block.fontFamily || 'sans-serif',
              textAlign: (block.textAlign || 'center') as any,
            }}>
            {block.content}
          </div>
        </div>
      );

    case 'DIVIDER':
      return (
        <div style={{ ...commonStyle, minHeight: `${block.height || 60}px` }} className="flex items-center justify-center px-20">
          <div className="w-full border-t border-gray-300"></div>
        </div>
      );

    case 'SPACER':
      return <div style={{ ...commonStyle, minHeight: `${block.height || 80}px` }}></div>;

    case 'POINT_GROUP':
      return (
        <div style={commonStyle} className="py-14 px-10">
          <div contentEditable suppressContentEditableWarning
            onBlur={e => onUpdate({ content: e.currentTarget.textContent || '' })}
            className="text-3xl font-black text-center mb-10 outline-none"
            style={{ color: block.textColor || '#111827' }}>
            {block.content}
          </div>
          <div className="space-y-8 max-w-3xl mx-auto">
            {block.points?.map((point, i) => (
              <div key={i} className={`flex items-start gap-8 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                {/* 이미지 영역 */}
                <div className="w-1/2 aspect-[4/3] rounded-xl overflow-hidden bg-gray-200 shrink-0 relative">
                  {point.image ? (
                    <img src={point.image} alt="" className="w-full h-full object-cover"/>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-purple-500">
                      <PhotoIcon className="w-8 h-8 mb-1"/>
                      <span className="text-xs">이미지 추가</span>
                      <input type="file" accept="image/*" onChange={e => {
                        if (e.target.files?.[0]) {
                          const newPoints = [...(block.points || [])];
                          newPoints[i] = { ...newPoints[i], image: URL.createObjectURL(e.target.files[0]) };
                          onUpdate({ points: newPoints });
                        }
                      }} className="hidden"/>
                    </label>
                  )}
                </div>
                {/* 텍스트 영역 */}
                <div className="w-1/2 flex flex-col justify-center">
                  <span className="text-3xl mb-3">{point.icon}</span>
                  <div contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newPoints = [...(block.points || [])];
                      newPoints[i] = { ...newPoints[i], title: e.currentTarget.textContent || '' };
                      onUpdate({ points: newPoints });
                    }}
                    className="text-xl font-black mb-2 outline-none" style={{ color: block.textColor || '#111827' }}>
                    {point.title}
                  </div>
                  <div contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newPoints = [...(block.points || [])];
                      newPoints[i] = { ...newPoints[i], desc: e.currentTarget.textContent || '' };
                      onUpdate({ points: newPoints });
                    }}
                    className="text-sm leading-relaxed outline-none" style={{ color: (block.textColor || '#111827') + 'aa' }}>
                    {point.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* 포인트 추가 버튼 */}
          <div className="flex justify-center mt-6">
            <button onClick={() => {
              const newPoints = [...(block.points || []), { icon: '✨', title: '새 포인트', desc: '설명을 입력하세요', image: '' }];
              onUpdate({ points: newPoints });
            }} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
              <PlusIcon className="w-3.5 h-3.5"/> 포인트 추가
            </button>
          </div>
        </div>
      );

    case 'OPTION_GRID':
      return (
        <div style={commonStyle} className="py-10 px-10">
          <div contentEditable suppressContentEditableWarning
            onBlur={e => onUpdate({ content: e.currentTarget.textContent || '' })}
            className="text-2xl font-black text-center mb-8 outline-none"
            style={{ color: block.textColor || '#111827' }}>
            {block.content}
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {block.options?.map((opt, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 relative">
                  {opt.image ? (
                    <img src={opt.image} alt="" className="w-full h-full object-cover"/>
                  ) : (
                    <label className="flex items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-purple-500">
                      <PhotoIcon className="w-8 h-8"/>
                      <input type="file" accept="image/*" onChange={e => {
                        if (e.target.files?.[0]) {
                          const newOpts = [...(block.options || [])];
                          newOpts[i] = { ...newOpts[i], image: URL.createObjectURL(e.target.files[0]) };
                          onUpdate({ options: newOpts });
                        }
                      }} className="hidden"/>
                    </label>
                  )}
                </div>
                <div contentEditable suppressContentEditableWarning
                  onBlur={e => {
                    const newOpts = [...(block.options || [])];
                    newOpts[i] = { ...newOpts[i], label: e.currentTarget.textContent || '' };
                    onUpdate({ options: newOpts });
                  }}
                  className="text-sm font-bold text-center outline-none" style={{ color: block.textColor || '#111827' }}>
                  {opt.label}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <button onClick={() => {
              const newOpts = [...(block.options || []), { image: '', label: '옵션명' }];
              onUpdate({ options: newOpts });
            }} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
              <PlusIcon className="w-3.5 h-3.5"/> 옵션 추가
            </button>
          </div>
        </div>
      );

    case 'INFO_TABLE':
      return (
        <div style={commonStyle} className="py-10 px-10">
          <div contentEditable suppressContentEditableWarning
            onBlur={e => onUpdate({ content: e.currentTarget.textContent || '' })}
            className="text-xl font-black text-center mb-6 outline-none"
            style={{ color: block.textColor || '#111827' }}>
            {block.content}
          </div>
          <div className="max-w-2xl mx-auto border border-gray-200 rounded-xl overflow-hidden">
            {block.tableRows?.map((row, i) => (
              <div key={i} className={`flex ${i > 0 ? 'border-t border-gray-200' : ''}`}>
                <div className="w-1/3 bg-gray-100 px-4 py-3">
                  <div contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newRows = [...(block.tableRows || [])];
                      newRows[i] = { ...newRows[i], label: e.currentTarget.textContent || '' };
                      onUpdate({ tableRows: newRows });
                    }}
                    className="text-xs font-bold text-gray-600 outline-none">{row.label}</div>
                </div>
                <div className="w-2/3 px-4 py-3 bg-white">
                  <div contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newRows = [...(block.tableRows || [])];
                      newRows[i] = { ...newRows[i], value: e.currentTarget.textContent || '' };
                      onUpdate({ tableRows: newRows });
                    }}
                    className="text-xs text-gray-700 outline-none">{row.value || '입력하세요'}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <button onClick={() => {
              const newRows = [...(block.tableRows || []), { label: '항목', value: '' }];
              onUpdate({ tableRows: newRows });
            }} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
              <PlusIcon className="w-3.5 h-3.5"/> 행 추가
            </button>
          </div>
        </div>
      );

    default:
      return <div style={commonStyle}></div>;
  }
};
