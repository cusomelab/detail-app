import React, { useState, useRef, useEffect } from 'react';
import { ProductData, GeneratedCopy, ProcessedImage, AppStep, ProductCategory, PlanSection, ProductInfoDisclosure } from '../../types';
import { generateProductCopy, generatePlan, generateStyledShots, translateSizeChart } from '../../services/geminiService';
import { ProcessingStep } from '../ProcessingStep';
import { PlanStep } from '../PlanStep';
import { ResultPreview } from '../ResultPreview';
import {
  ArrowUpTrayIcon, PhotoIcon, SparklesIcon, LinkIcon,
  ShoppingBagIcon, HomeIcon, FireIcon, CakeIcon, SwatchIcon,
  ChevronDownIcon, ChevronUpIcon, DocumentTextIcon, CheckCircleIcon,
  TableCellsIcon, ArrowPathIcon, RectangleGroupIcon, PaintBrushIcon,
  StarIcon, EyeIcon
} from '@heroicons/react/24/outline';

// ── 고급형 디자인 시스템 ──
type DesignSystemId = 'MAGAZINE' | 'EDITORIAL' | 'LOOKBOOK' | 'CATALOG' | 'BRANDSTORY';

interface DesignSystem {
  id: DesignSystemId;
  name: string;
  subtitle: string;
  description: string;
  designType: 'MODERN' | 'EMOTIONAL' | 'IMPACT';
  themeColor: string;
  pointLayout: 'ZIGZAG' | 'CARDS' | 'SIMPLE';
  features: string[];
  preview: {
    gradient: string;
    accent: string;
    headerFont: string;
    bodyFont: string;
    mockup: 'magazine' | 'editorial' | 'lookbook' | 'catalog' | 'story';
  };
}

const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'MAGAZINE',
    name: '매거진 에디토리얼',
    subtitle: 'Magazine Editorial',
    description: '하이엔드 매거진 느낌의 세련된 레이아웃. 대형 이미지와 미니멀한 타이포그래피로 브랜드 가치를 극대화',
    designType: 'MODERN',
    themeColor: 'INDIGO',
    pointLayout: 'ZIGZAG',
    features: ['풀블리드 이미지', '미니멀 타이포', 'AI 연출 3장', '여백의 미학'],
    preview: {
      gradient: 'from-slate-900 to-slate-700',
      accent: 'bg-white',
      headerFont: 'font-sans',
      bodyFont: 'font-sans',
      mockup: 'magazine',
    }
  },
  {
    id: 'EDITORIAL',
    name: '럭셔리 에디토리얼',
    subtitle: 'Luxury Editorial',
    description: '다크 톤에 골드 포인트. 프리미엄 브랜드 감성을 살린 고급스러운 상세페이지',
    designType: 'IMPACT',
    themeColor: 'ORANGE',
    pointLayout: 'SIMPLE',
    features: ['다크 배경', '골드 액센트', '세리프 타이포', '럭셔리 무드'],
    preview: {
      gradient: 'from-amber-900 to-gray-900',
      accent: 'bg-amber-500',
      headerFont: 'font-serif',
      bodyFont: 'font-serif',
      mockup: 'editorial',
    }
  },
  {
    id: 'LOOKBOOK',
    name: '감성 룩북',
    subtitle: 'Emotional Lookbook',
    description: '따뜻한 톤의 감성적 디자인. 스토리텔링과 무드 이미지로 고객의 마음을 사로잡는 레이아웃',
    designType: 'EMOTIONAL',
    themeColor: 'PINK',
    pointLayout: 'SIMPLE',
    features: ['베이지 톤', '명조 타이포', '감성 스토리', '부드러운 무드'],
    preview: {
      gradient: 'from-rose-100 to-orange-50',
      accent: 'bg-rose-400',
      headerFont: 'font-serif',
      bodyFont: 'font-serif',
      mockup: 'lookbook',
    }
  },
  {
    id: 'CATALOG',
    name: '프로 카탈로그',
    subtitle: 'Professional Catalog',
    description: '정보 밀도 높은 전문 카탈로그 스타일. 스펙과 디테일을 명확하게 전달하는 체계적 레이아웃',
    designType: 'MODERN',
    themeColor: 'BLACK',
    pointLayout: 'CARDS',
    features: ['체계적 구성', '스펙 강조', '넘버링 포인트', '깔끔한 그리드'],
    preview: {
      gradient: 'from-gray-800 to-gray-600',
      accent: 'bg-red-600',
      headerFont: 'font-sans',
      bodyFont: 'font-sans',
      mockup: 'catalog',
    }
  },
  {
    id: 'BRANDSTORY',
    name: '브랜드 스토리',
    subtitle: 'Brand Storytelling',
    description: '브랜드의 철학과 가치를 전하는 스토리텔링 중심 레이아웃. 신뢰와 감동을 함께 전달',
    designType: 'MODERN',
    themeColor: 'GREEN',
    pointLayout: 'ZIGZAG',
    features: ['스토리 중심', '그린 톤', '자연스러운', '신뢰감 강화'],
    preview: {
      gradient: 'from-emerald-800 to-teal-700',
      accent: 'bg-emerald-500',
      headerFont: 'font-sans',
      bodyFont: 'font-sans',
      mockup: 'story',
    }
  },
];

// ── 디자인 시스템 카드 ──
const DesignSystemCard: React.FC<{
  system: DesignSystem;
  isSelected: boolean;
  onClick: () => void;
}> = ({ system, isSelected, onClick }) => (
  <button onClick={onClick}
    className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${
      isSelected ? 'border-purple-600 shadow-2xl shadow-purple-100 ring-2 ring-purple-600/20' : 'border-gray-200 hover:border-purple-300'
    }`}>
    {isSelected && (
      <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
        <CheckCircleIcon className="w-5 h-5 text-white" />
      </div>
    )}
    {/* 프리뷰 영역 */}
    <div className={`bg-gradient-to-br ${system.preview.gradient} p-6 h-56 flex flex-col justify-between relative overflow-hidden`}>
      {/* 장식 요소 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      {/* 미니 레이아웃 프리뷰 */}
      <div className="relative z-10">
        <div className={`${system.preview.accent} w-10 h-1 rounded-full mb-3 opacity-80`}></div>
        <div className="h-2.5 bg-white/30 rounded w-2/3 mb-1.5"></div>
        <div className="h-2 bg-white/15 rounded w-1/2"></div>
      </div>
      <div className="relative z-10 flex gap-2">
        <div className="flex-1 bg-white/10 rounded-lg h-16 backdrop-blur-sm"></div>
        <div className="flex-1 bg-white/10 rounded-lg h-16 backdrop-blur-sm flex flex-col justify-center px-2">
          <div className="h-1.5 bg-white/30 rounded w-3/4 mb-1"></div>
          <div className="h-1 bg-white/15 rounded w-1/2"></div>
        </div>
      </div>
      <div className="relative z-10 flex gap-1.5">
        {[1,2,3].map(i => (
          <div key={i} className="flex-1 bg-white/8 rounded p-1.5 backdrop-blur-sm">
            <div className={`${system.preview.accent} w-3 h-3 rounded-full mb-1 opacity-60`}></div>
            <div className="h-1 bg-white/20 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
    {/* 설명 */}
    <div className="p-5 bg-white">
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="font-black text-gray-900">{system.name}</h3>
      </div>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">{system.subtitle}</p>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{system.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {system.features.map(f => (
          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-bold">{f}</span>
        ))}
      </div>
    </div>
  </button>
);

// ── 메인 컴포넌트 ──
export const FigmaEditorTab: React.FC = () => {
  type Step = 'DESIGN' | 'INPUT' | 'PROCESSING' | 'PLAN' | 'RESULT';

  const [currentStep, setCurrentStep] = useState<Step>('DESIGN');
  const [selectedDesign, setSelectedDesign] = useState<DesignSystemId>('MAGAZINE');
  const [logs, setLogs] = useState<string[]>([]);
  const [planSections, setPlanSections] = useState<PlanSection[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingDetail, setIsDraggingDetail] = useState(false);
  const [isDraggingOption, setIsDraggingOption] = useState(false);
  const dcMain = useRef(0); const dcDetail = useRef(0); const dcOption = useRef(0);

  const [productData, setProductData] = useState<ProductData>({
    productName: '', category: 'FASHION', features: '', mainImage: null, detailImages: [], optionImages: [], benchmarkUrl: ''
  });
  const [infoDisclosure, setInfoDisclosure] = useState<ProductInfoDisclosure>({
    manufacturer: '', origin: 'Made in China', customerService: '', material: '', size: '', color: '', wash: '',
    ingredients: '', capacity: '', expiry: '', storage: '', haccp: '', certifications: '', warranty: '', caution: ''
  });
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [sizeChartImage, setSizeChartImage] = useState<File | null>(null);
  const [sizeChartData, setSizeChartData] = useState<string[][] | null>(null);
  const [isTranslatingSizeChart, setIsTranslatingSizeChart] = useState(false);

  const hi = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProductData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const ii = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInfoDisclosure(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const de = (e: React.DragEvent, t: 'MAIN'|'DETAIL'|'OPTION') => {
    e.preventDefault(); e.stopPropagation();
    if (t==='MAIN'){dcMain.current++;if(e.dataTransfer.items.length>0)setIsDraggingMain(true);}
    else if(t==='DETAIL'){dcDetail.current++;if(e.dataTransfer.items.length>0)setIsDraggingDetail(true);}
    else{dcOption.current++;if(e.dataTransfer.items.length>0)setIsDraggingOption(true);}
  };
  const dl = (e: React.DragEvent, t: 'MAIN'|'DETAIL'|'OPTION') => {
    e.preventDefault(); e.stopPropagation();
    if(t==='MAIN'){dcMain.current--;if(dcMain.current===0)setIsDraggingMain(false);}
    else if(t==='DETAIL'){dcDetail.current--;if(dcDetail.current===0)setIsDraggingDetail(false);}
    else{dcOption.current--;if(dcOption.current===0)setIsDraggingOption(false);}
  };
  const dd = (e: React.DragEvent, t: 'MAIN'|'DETAIL'|'OPTION') => {
    e.preventDefault(); e.stopPropagation();
    if(t==='MAIN'){setIsDraggingMain(false);dcMain.current=0;if(e.dataTransfer.files[0])setProductData(p=>({...p,mainImage:e.dataTransfer.files[0]}));}
    else if(t==='DETAIL'){setIsDraggingDetail(false);dcDetail.current=0;if(e.dataTransfer.files.length>0)setProductData(p=>({...p,detailImages:[...p.detailImages,...Array.from(e.dataTransfer.files)]}));}
    else{setIsDraggingOption(false);dcOption.current=0;if(e.dataTransfer.files.length>0)setProductData(p=>({...p,optionImages:[...p.optionImages,...Array.from(e.dataTransfer.files)]}));}
  };

  const addLog = (m: string) => setLogs(p => [...p, m]);
  const designInfo = DESIGN_SYSTEMS.find(d => d.id === selectedDesign)!;

  // 정보고시 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('saved_info_disclosure');
    if (saved) {
      try { setInfoDisclosure(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {}
    }
  }, []);

  const saveInfoDisclosure = () => {
    localStorage.setItem('saved_info_disclosure', JSON.stringify(infoDisclosure));
    alert('저장됨');
  };

  // 사이즈표 번역
  const handleSizeChartUpload = async (file: File) => {
    setSizeChartImage(file);
    setIsTranslatingSizeChart(true);
    try {
      const data = await translateSizeChart(file);
      setSizeChartData(data);
    } catch { alert('사이즈표 번역 실패'); }
    finally { setIsTranslatingSizeChart(false); }
  };

  // 기획안 생성
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.productName) { alert('상품명을 입력해주세요'); return; }
    setCurrentStep('PROCESSING'); setLogs(['🎯 상품 정보 분석 중...', '📝 기획안 작성 중...']);
    try {
      const sections = await generatePlan(productData.productName, productData.category, productData.features, productData.mainImage);
      setPlanSections(sections); setCurrentStep('PLAN');
    } catch { alert('기획안 생성 실패'); setCurrentStep('INPUT'); }
  };

  // 상세페이지 생성
  const handleGenerateDetail = async (confirmed: PlanSection[]) => {
    setCurrentStep('PROCESSING'); setLogs([]); setProcessedImages([]);
    try {
      addLog('🤖 AI 카피라이터 호출 중...'); addLog('✍️ 카피 작성 중...');
      const copy = await generateProductCopy(productData.productName, productData.features, productData.category, productData.benchmarkUrl, productData.mainImage, confirmed);
      setGeneratedCopy(copy); addLog('✅ 카피 완성!');
      if (productData.mainImage) setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(productData.mainImage!),processedUrl:URL.createObjectURL(productData.mainImage!),type:'main',status:'done'}]);
      productData.detailImages.forEach(f=>setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(f),processedUrl:URL.createObjectURL(f),type:'detail',status:'done'}]));
      productData.optionImages.forEach(f=>setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(f),processedUrl:URL.createObjectURL(f),type:'option',status:'done',fileName:f.name}]));

      if (productData.mainImage) {
        addLog('📸 AI 연출 이미지 생성 중... (1/3)');
        try {
          const styledShots = await generateStyledShots(productData.mainImage, productData.category, (idx, total) => {
            setLogs(prev => {
              const newLogs = [...prev];
              const lastIdx = newLogs.length - 1;
              if (lastIdx >= 0 && newLogs[lastIdx].startsWith('📸')) newLogs[lastIdx] = `📸 AI 연출 이미지 생성 중... (${idx}/${total})`;
              return newLogs;
            });
          });
          styledShots.forEach(shot => setProcessedImages(p => [...p, { originalUrl: shot.imageUrl, processedUrl: shot.imageUrl, type: 'styled', status: 'done' }]));
          addLog(`✅ 연출 이미지 ${styledShots.length}장 생성 완료!`);
        } catch { addLog('⚠️ 연출 이미지 생성 스킵 (API 제한)'); }
      }
      setTimeout(() => setCurrentStep('RESULT'), 800);
    } catch { alert('오류 발생'); setCurrentStep('PLAN'); }
  };

  const resetAll = () => {
    setCurrentStep('DESIGN');
    setProductData({productName:'',category:'FASHION',features:'',mainImage:null,detailImages:[],optionImages:[],benchmarkUrl:''});
    setGeneratedCopy(null); setProcessedImages([]); setPlanSections([]);
    setSizeChartImage(null); setSizeChartData(null);
  };

  // ── Processing ──
  if (currentStep === 'PROCESSING') return <ProcessingStep logs={logs} />;

  // ── Plan ──
  if (currentStep === 'PLAN') return (
    <PlanStep sections={planSections} productName={productData.productName} category={productData.category}
      onConfirm={handleGenerateDetail} onBack={() => setCurrentStep('INPUT')} />
  );

  // ── Result ──
  if (currentStep === 'RESULT' && generatedCopy) return (
    <ResultPreview
      copy={generatedCopy} images={processedImages}
      productName={productData.productName} category={productData.category}
      infoDisclosure={infoDisclosure} planSections={planSections} onReset={resetAll}
      detailMode="advanced"
      templateDesignType={designInfo.designType}
      templateThemeColor={designInfo.themeColor as any}
      templatePointLayout={designInfo.pointLayout}
      sizeChartData={sizeChartData || undefined}
    />
  );

  // ── STEP 1: 디자인 시스템 선택 ──
  if (currentStep === 'DESIGN') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-4">
            <StarIcon className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-600">PREMIUM DESIGN</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">프리미엄 디자인 시스템</h2>
          <p className="text-gray-500 text-sm">디자이너가 설계한 프리미엄 레이아웃을 선택하세요</p>
          <p className="text-gray-400 text-xs mt-1">AI 기획안 + AI 연출 이미지 3장 + 프리미엄 디자인 적용</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {DESIGN_SYSTEMS.map(system => (
            <DesignSystemCard key={system.id} system={system}
              isSelected={selectedDesign === system.id}
              onClick={() => setSelectedDesign(system.id)} />
          ))}
        </div>

        {/* 선택된 디자인 요약 */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className={`bg-gradient-to-r ${designInfo.preview.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1">SELECTED</p>
                <h3 className="text-xl font-black">{designInfo.name}</h3>
                <p className="text-white/70 text-sm mt-1">{designInfo.description}</p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-white/40 shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={() => setCurrentStep('INPUT')}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-200 flex items-center gap-3 transition-all hover:scale-[1.02]">
            <PaintBrushIcon className="w-6 h-6" />
            「{designInfo.name}」으로 시작
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2: 상품 정보 입력 ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 선택된 디자인 표시 */}
      <div className="mb-6">
        <button onClick={() => setCurrentStep('DESIGN')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors mb-4">
          <ChevronDownIcon className="w-4 h-4 rotate-90" /> 디자인 다시 선택
        </button>
        <div className={`bg-gradient-to-r ${designInfo.preview.gradient} rounded-2xl p-4 text-white flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <PaintBrushIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black">{designInfo.name}</span>
              <span className="text-xs text-white/50 uppercase tracking-wider">{designInfo.subtitle}</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {designInfo.features.map(f => (
                <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-white/15 text-white/80">{f}</span>
              ))}
            </div>
          </div>
          <CheckCircleIcon className="w-6 h-6 text-white/50 shrink-0" />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">상품 정보 입력</h2>
        <p className="text-gray-500 text-sm">AI가 기획안을 먼저 작성하고, 검토 후 프리미엄 상세페이지를 생성합니다</p>
      </div>

      <form onSubmit={handleGeneratePlan} className="space-y-5">
        {/* 카테고리 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">카테고리 *</label>
          <div className="grid grid-cols-4 gap-3">
            {(['FASHION','LIVING','KITCHEN','FOOD'] as ProductCategory[]).map(cat=>(
              <button key={cat} type="button" onClick={()=>setProductData(p=>({...p,category:cat}))}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${productData.category===cat?'border-purple-600 bg-purple-50 text-purple-700':'border-gray-200 hover:border-purple-300 text-gray-500'}`}>
                {cat==='FASHION'&&<ShoppingBagIcon className="w-6 h-6 mb-1"/>}
                {cat==='LIVING'&&<HomeIcon className="w-6 h-6 mb-1"/>}
                {cat==='KITCHEN'&&<FireIcon className="w-6 h-6 mb-1"/>}
                {cat==='FOOD'&&<CakeIcon className="w-6 h-6 mb-1"/>}
                <span className="text-xs font-bold">{cat==='FASHION'?'의류/패션':cat==='LIVING'?'리빙/홈':cat==='KITCHEN'?'주방/유아':'식품/건강'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 상품명 / 특징 / 벤치마킹 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">상품명 *</label>
            <input name="productName" required value={productData.productName} onChange={hi}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
              placeholder="예: 마켓피아 니트 리본 포인트 긴팔 티셔츠" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">주요 특징 (선택)</label>
            <textarea name="features" rows={3} value={productData.features} onChange={hi}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none"
              placeholder="예: 100% 면, 오버핏, 4가지 컬러" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">벤치마킹 URL (선택)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input name="benchmarkUrl" type="url" value={productData.benchmarkUrl||''} onChange={hi}
                className="w-full pl-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                placeholder="https://www.coupang.com/..." />
            </div>
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">이미지 업로드</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer relative h-36 transition-all ${isDraggingMain?'border-purple-500 bg-purple-50':'border-gray-200 hover:bg-gray-50'}`}
              onDragEnter={e=>de(e,'MAIN')} onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDragLeave={e=>dl(e,'MAIN')} onDrop={e=>dd(e,'MAIN')}>
              <input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0])setProductData(p=>({...p,mainImage:e.target.files![0]}))}} className="absolute inset-0 opacity-0 cursor-pointer" />
              {productData.mainImage?(<div className="pointer-events-none flex flex-col items-center"><img src={URL.createObjectURL(productData.mainImage)} alt="" className="h-20 object-contain mb-1"/><p className="text-xs text-green-600 font-bold truncate max-w-full px-2">{productData.mainImage.name}</p></div>):(<div className="pointer-events-none flex flex-col items-center"><PhotoIcon className="h-8 w-8 mb-2 text-gray-300"/><span className="text-sm font-medium text-gray-500">대표 이미지</span></div>)}
            </div>
            <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer relative h-36 transition-all ${isDraggingDetail?'border-purple-500 bg-purple-50':'border-gray-200 hover:bg-gray-50'}`}
              onDragEnter={e=>de(e,'DETAIL')} onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDragLeave={e=>dl(e,'DETAIL')} onDrop={e=>dd(e,'DETAIL')}>
              <input type="file" accept="image/*" multiple onChange={e=>{if(e.target.files)setProductData(p=>({...p,detailImages:[...p.detailImages,...Array.from(e.target.files!)]}))}} className="absolute inset-0 opacity-0 cursor-pointer" />
              {productData.detailImages.length>0?(<div className="pointer-events-none flex flex-col items-center"><span className="text-3xl font-black text-purple-600">{productData.detailImages.length}</span><span className="text-sm text-gray-500 mt-1">장 선택됨</span></div>):(<div className="pointer-events-none flex flex-col items-center"><ArrowUpTrayIcon className="h-8 w-8 mb-2 text-gray-300"/><span className="text-sm font-medium text-gray-500">상세 이미지</span></div>)}
            </div>
          </div>
          <div className={`border-2 border-dashed rounded-xl p-3 flex items-center justify-center cursor-pointer relative h-14 transition-all ${isDraggingOption?'border-purple-500 bg-purple-50':'border-gray-200 hover:bg-gray-50'}`}
            onDragEnter={e=>de(e,'OPTION')} onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDragLeave={e=>dl(e,'OPTION')} onDrop={e=>dd(e,'OPTION')}>
            <input type="file" accept="image/*" multiple onChange={e=>{if(e.target.files)setProductData(p=>({...p,optionImages:[...p.optionImages,...Array.from(e.target.files!)]}))}} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="pointer-events-none flex items-center gap-2 text-gray-400">
              <SwatchIcon className="w-5 h-5"/>
              {productData.optionImages.length>0?<span className="font-bold text-purple-600 text-sm">{productData.optionImages.length}개 옵션 선택됨</span>:<span className="text-sm font-medium">옵션 이미지 (색상/종류)</span>}
            </div>
          </div>
        </div>

        {/* 사이즈표 (FASHION) */}
        {productData.category === 'FASHION' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <TableCellsIcon className="w-5 h-5 text-purple-500"/>
              <label className="text-sm font-bold text-gray-700">중국 사이즈표 자동 번역</label>
              <span className="text-xs text-gray-400">(선택)</span>
            </div>
            <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 mb-3">
              📏 중국어 사이즈표 이미지를 업로드하면 AI가 한국어로 번역합니다
            </p>
            <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer relative transition-all border-gray-200 hover:border-purple-400">
              <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleSizeChartUpload(e.target.files[0]); }} className="absolute inset-0 opacity-0 cursor-pointer" />
              {isTranslatingSizeChart ? (
                <div className="flex flex-col items-center py-2">
                  <ArrowPathIcon className="w-8 h-8 text-purple-500 animate-spin mb-2"/>
                  <span className="text-sm font-bold text-purple-600">AI 번역 중...</span>
                </div>
              ) : sizeChartImage ? (
                <div className="flex items-center gap-4 w-full">
                  <img src={URL.createObjectURL(sizeChartImage)} alt="" className="h-24 object-contain rounded-lg border"/>
                  <div>
                    <p className="text-sm font-bold text-green-600">번역 완료</p>
                    {sizeChartData && <p className="text-xs text-gray-500">{sizeChartData.length}행 x {sizeChartData[0]?.length || 0}열</p>}
                    <button type="button" onClick={e => { e.stopPropagation(); setSizeChartImage(null); setSizeChartData(null); }}
                      className="mt-1 text-xs text-red-500 font-bold">삭제</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <TableCellsIcon className="w-8 h-8 text-gray-300 mb-1"/>
                  <span className="text-sm font-medium text-gray-500">사이즈표 이미지 업로드</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 상품정보고시 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button type="button" onClick={()=>setShowInfo(!showInfo)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-5 h-5 text-gray-400"/>
              <span className="text-sm font-bold text-gray-700">상품 정보고시</span>
              <span className="text-xs text-gray-400">(선택)</span>
            </div>
            {showInfo?<ChevronUpIcon className="w-4 h-4 text-gray-400"/>:<ChevronDownIcon className="w-4 h-4 text-gray-400"/>}
          </button>
          {showInfo&&(
            <div className="px-5 pb-5 border-t border-gray-50 space-y-3">
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 flex-1">💡 한번 입력 후 저장하면 다음 상품에도 자동 적용됩니다</p>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button type="button" onClick={saveInfoDisclosure} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">💾 저장</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{name:'manufacturer',label:'제조자/수입자',ph:'(주)폰이지'},{name:'origin',label:'원산지',ph:'Made in China'},{name:'customerService',label:'고객센터',ph:'0507-1311-1108'}].map(f=>(
                  <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                  <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                ))}
              </div>
              {productData.category==='FASHION'&&(
                <div className="grid grid-cols-2 gap-3">
                  {[{name:'material',label:'소재',ph:'폴리에스터 95%'},{name:'size',label:'사이즈',ph:'S/M/L/XL'},{name:'color',label:'색상',ph:'화이트, 블랙'},{name:'wash',label:'세탁방법',ph:'울코스 세탁'}].map(f=>(
                    <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                    <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                  ))}
                </div>
              )}
              {productData.category==='FOOD'&&(
                <div className="grid grid-cols-2 gap-3">
                  {[{name:'ingredients',label:'원재료명',ph:'밀가루, 설탕'},{name:'capacity',label:'용량/중량',ph:'200g'},{name:'expiry',label:'유통기한',ph:'제조일로부터 1년'},{name:'storage',label:'보관방법',ph:'냉장보관'},{name:'haccp',label:'인증여부',ph:'HACCP 인증'}].map(f=>(
                    <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                    <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                  ))}
                </div>
              )}
              {(productData.category==='LIVING'||productData.category==='KITCHEN')&&(
                <div className="grid grid-cols-2 gap-3">
                  {[{name:'material',label:'소재/재질',ph:'ABS 플라스틱'},{name:'certifications',label:'인증/허가',ph:'KC 인증'},{name:'warranty',label:'품질보증',ph:'구매일로부터 1년'},{name:'caution',label:'주의사항',ph:'직사광선 피해 보관'}].map(f=>(
                    <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                    <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"/></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 생성 버튼 */}
        <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-200 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]">
          <SparklesIcon className="w-6 h-6"/> AI 기획안 생성 시작
        </button>
        <p className="text-center text-xs text-gray-400">
          기획안 검토 → AI 연출샷 3장 → 「{designInfo.name}」 디자인 적용
        </p>
      </form>
    </div>
  );
};
