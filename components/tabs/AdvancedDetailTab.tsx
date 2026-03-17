import React, { useState, useRef } from 'react';
import { ProductData, GeneratedCopy, ProcessedImage, AppStep, ProductCategory, PlanSection, ProductInfoDisclosure } from '../../types';
import { generateProductCopy, generatePlan, generateStyledShots, setApiKey } from '../../services/geminiService';
import { ProcessingStep } from '../ProcessingStep';
import { PlanStep } from '../PlanStep';
import { ResultPreview } from '../ResultPreview';
import {
  ArrowUpTrayIcon, PhotoIcon, SparklesIcon, LinkIcon,
  ShoppingBagIcon, HomeIcon, FireIcon, CakeIcon, SwatchIcon,
  ChevronDownIcon, ChevronUpIcon, DocumentTextIcon, ArrowLeftIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

// ── 템플릿 정의 ──
type TemplateId = 'MODERN_MINIMAL' | 'EMOTIONAL_STORY' | 'IMPACT_BOLD' | 'LUXURY_PREMIUM' | 'FRESH_NATURAL';

interface TemplateInfo {
  id: TemplateId;
  name: string;
  subtitle: string;
  description: string;
  designType: 'MODERN' | 'EMOTIONAL' | 'IMPACT';
  themeColor: string;
  tags: string[];
  preview: {
    bg: string;
    accent: string;
    textColor: string;
    fontStyle: string;
    heroStyle: string;
    pointStyle: string;
  };
}

const TEMPLATES: TemplateInfo[] = [
  {
    id: 'MODERN_MINIMAL',
    name: '모던 미니멀',
    subtitle: 'Clean & Modern',
    description: '깔끔한 화이트 기반에 정갈한 레이아웃. 신뢰감 있는 브랜드 느낌',
    designType: 'MODERN',
    themeColor: 'INDIGO',
    tags: ['깔끔한', '신뢰감', '브랜드'],
    preview: {
      bg: 'bg-white',
      accent: 'bg-indigo-600',
      textColor: 'text-gray-900',
      fontStyle: 'font-sans',
      heroStyle: 'border-b-2 border-gray-100',
      pointStyle: 'ZIGZAG',
    }
  },
  {
    id: 'EMOTIONAL_STORY',
    name: '감성 스토리텔링',
    subtitle: 'Warm & Emotional',
    description: '따뜻한 톤에 감성적인 스토리. 고객 감정에 호소하는 서정적 디자인',
    designType: 'EMOTIONAL',
    themeColor: 'PINK',
    tags: ['감성적', '따뜻한', '스토리'],
    preview: {
      bg: 'bg-[#fdfbf7]',
      accent: 'bg-pink-500',
      textColor: 'text-gray-800',
      fontStyle: 'font-serif',
      heroStyle: 'border-b border-[#e0dcd0]',
      pointStyle: 'SIMPLE',
    }
  },
  {
    id: 'IMPACT_BOLD',
    name: '임팩트 세일',
    subtitle: 'Bold & Impactful',
    description: '강렬한 블랙 배경에 대담한 타이포. 구매 전환율을 극대화하는 디자인',
    designType: 'IMPACT',
    themeColor: 'BLACK',
    tags: ['강렬한', '대담한', '세일'],
    preview: {
      bg: 'bg-gray-900',
      accent: 'bg-red-600',
      textColor: 'text-white',
      fontStyle: 'font-sans',
      heroStyle: 'border-b-2 border-red-600',
      pointStyle: 'CARDS',
    }
  },
  {
    id: 'LUXURY_PREMIUM',
    name: '프리미엄 럭셔리',
    subtitle: 'Luxury & Premium',
    description: '다크 기반에 골드 포인트. 고급스러운 브랜드 이미지를 전달',
    designType: 'IMPACT',
    themeColor: 'ORANGE',
    tags: ['고급스러운', '럭셔리', '프리미엄'],
    preview: {
      bg: 'bg-[#1a1a1a]',
      accent: 'bg-amber-500',
      textColor: 'text-amber-50',
      fontStyle: 'font-serif',
      heroStyle: 'border-b border-amber-500/30',
      pointStyle: 'SIMPLE',
    }
  },
  {
    id: 'FRESH_NATURAL',
    name: '프레시 내추럴',
    subtitle: 'Fresh & Natural',
    description: '밝고 싱그러운 그린 톤. 자연스럽고 건강한 이미지를 강조',
    designType: 'MODERN',
    themeColor: 'GREEN',
    tags: ['자연스러운', '싱그러운', '건강한'],
    preview: {
      bg: 'bg-emerald-50/30',
      accent: 'bg-emerald-600',
      textColor: 'text-emerald-900',
      fontStyle: 'font-sans',
      heroStyle: 'border-b border-emerald-100',
      pointStyle: 'ZIGZAG',
    }
  },
];

// ── 템플릿 미리보기 카드 ──
const TemplatePreviewCard: React.FC<{
  template: TemplateInfo;
  isSelected: boolean;
  onClick: () => void;
}> = ({ template, isSelected, onClick }) => {
  const { preview } = template;
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSelected ? 'border-indigo-600 shadow-xl shadow-indigo-100 ring-2 ring-indigo-600/20' : 'border-gray-200 hover:border-indigo-300'
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircleIcon className="w-5 h-5 text-white" />
        </div>
      )}
      {/* 미니 프리뷰 */}
      <div className={`${preview.bg} p-4 h-52 flex flex-col`}>
        {/* 미니 히어로 */}
        <div className={`${preview.heroStyle} pb-3 mb-3`}>
          <div className={`${preview.accent} w-14 h-1.5 rounded-full mb-2`}></div>
          <div className={`h-3 w-3/4 rounded ${preview.bg === 'bg-white' || preview.bg === 'bg-emerald-50/30' ? 'bg-gray-800' : 'bg-white/80'} mb-1.5`}></div>
          <div className={`h-2 w-1/2 rounded ${preview.bg === 'bg-white' || preview.bg === 'bg-emerald-50/30' ? 'bg-gray-400' : 'bg-white/40'}`}></div>
        </div>
        {/* 미니 이미지 영역 */}
        <div className={`flex-1 rounded-lg ${preview.bg === 'bg-white' || preview.bg === 'bg-emerald-50/30' ? 'bg-gray-100' : 'bg-white/10'} mb-3 flex items-center justify-center`}>
          <PhotoIcon className={`w-8 h-8 ${preview.bg === 'bg-white' || preview.bg === 'bg-emerald-50/30' ? 'text-gray-300' : 'text-white/30'}`} />
        </div>
        {/* 미니 포인트 */}
        <div className="flex gap-2">
          {[1,2,3].map(i => (
            <div key={i} className={`flex-1 rounded-lg p-1.5 ${preview.bg === 'bg-white' || preview.bg === 'bg-emerald-50/30' ? 'bg-gray-50 border border-gray-100' : 'bg-white/5 border border-white/10'}`}>
              <div className={`${preview.accent} w-4 h-4 rounded-full mb-1 mx-auto opacity-80`}></div>
              <div className={`h-1 rounded ${preview.bg === 'bg-white' || preview.bg === 'bg-emerald-50/30' ? 'bg-gray-300' : 'bg-white/30'} mx-auto w-2/3`}></div>
            </div>
          ))}
        </div>
      </div>
      {/* 설명 */}
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-black text-gray-900 text-sm">{template.name}</h3>
          <span className="text-[10px] text-gray-400 tracking-wider uppercase">{template.subtitle}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{template.description}</p>
        <div className="flex gap-1.5">
          {template.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

// ── 메인 컴포넌트 ──
export const AdvancedDetailTab: React.FC = () => {
  // Steps: TEMPLATE → INPUT → PROCESSING → PLAN → PROCESSING → RESULT
  type AdvancedStep = 'TEMPLATE' | 'INPUT' | 'PROCESSING' | 'PLAN' | 'RESULT';

  const [advStep, setAdvStep] = useState<AdvancedStep>('TEMPLATE');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('MODERN_MINIMAL');
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
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
  const templateInfo = TEMPLATES.find(t => t.id === selectedTemplate)!;

  // 저장된 정보고시 불러오기/저장
  React.useEffect(() => {
    const savedInfo = localStorage.getItem('saved_info_disclosure');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setInfoDisclosure(prev => ({
          ...prev,
          manufacturer: parsed.manufacturer || '',
          origin: parsed.origin || 'Made in China',
          customerService: parsed.customerService || '',
          wash: parsed.wash || '',
          ingredients: parsed.ingredients || '',
          capacity: parsed.capacity || '',
          expiry: parsed.expiry || '',
          storage: parsed.storage || '',
          haccp: parsed.haccp || '',
          certifications: parsed.certifications || '',
          warranty: parsed.warranty || '',
          caution: parsed.caution || '',
        }));
      } catch(e) { /* ignore */ }
    }
  }, []);

  const saveInfoDisclosure = () => {
    localStorage.setItem('saved_info_disclosure', JSON.stringify(infoDisclosure));
    alert('✅ 상품정보고시가 저장되었습니다.');
  };
  const clearSavedInfoDisclosure = () => {
    localStorage.removeItem('saved_info_disclosure');
    alert('저장된 정보고시가 삭제되었습니다.');
  };

  // 기획안 생성
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.productName) { alert('상품명을 입력해주세요'); return; }
    setStep(AppStep.PROCESSING); setAdvStep('PROCESSING'); setLogs(['🎯 상품 정보 분석 중...', '📝 기획안 작성 중...']);
    try {
      const sections = await generatePlan(productData.productName, productData.category, productData.features, productData.mainImage);
      setPlanSections(sections); setStep(AppStep.PLAN); setAdvStep('PLAN');
    } catch { alert('기획안 생성 실패'); setStep(AppStep.INPUT); setAdvStep('INPUT'); }
  };

  // 상세페이지 생성
  const handleGenerateDetail = async (confirmed: PlanSection[]) => {
    setStep(AppStep.PROCESSING); setAdvStep('PROCESSING'); setLogs([]); setProcessedImages([]);
    try {
      addLog('🤖 AI 카피라이터 호출 중...'); addLog('✍️ 카피 작성 중...');
      const copy = await generateProductCopy(productData.productName, productData.features, productData.category, productData.benchmarkUrl, productData.mainImage, confirmed);
      setGeneratedCopy(copy); addLog('✅ 카피 완성!');
      if (productData.mainImage) setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(productData.mainImage!),processedUrl:URL.createObjectURL(productData.mainImage!),type:'main',status:'done'}]);
      productData.detailImages.forEach(f=>setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(f),processedUrl:URL.createObjectURL(f),type:'detail',status:'done'}]));
      productData.optionImages.forEach(f=>setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(f),processedUrl:URL.createObjectURL(f),type:'option',status:'done',fileName:f.name}]));

      // AI 연출 샷
      if (productData.mainImage) {
        addLog('📸 AI 연출 이미지 생성 중... (1/3)');
        try {
          const styledShots = await generateStyledShots(
            productData.mainImage,
            productData.category,
            (idx, total) => {
              setLogs(prev => {
                const newLogs = [...prev];
                const lastIdx = newLogs.length - 1;
                if (lastIdx >= 0 && newLogs[lastIdx].startsWith('📸')) {
                  newLogs[lastIdx] = `📸 AI 연출 이미지 생성 중... (${idx}/${total})`;
                }
                return newLogs;
              });
            }
          );
          styledShots.forEach(shot => {
            setProcessedImages(p => [...p, {
              originalUrl: shot.imageUrl,
              processedUrl: shot.imageUrl,
              type: 'styled',
              status: 'done'
            }]);
          });
          addLog(`✅ 연출 이미지 ${styledShots.length}장 생성 완료!`);
        } catch (err) {
          console.warn('연출 샷 생성 실패:', err);
          addLog('⚠️ 연출 이미지 생성 스킵 (API 제한)');
        }
      }
      setTimeout(() => { setStep(AppStep.RESULT); setAdvStep('RESULT'); }, 800);
    } catch(err: any) {
      alert('오류 발생. 다시 시도해주세요.'); setStep(AppStep.PLAN); setAdvStep('PLAN');
    }
  };

  const resetAll = () => {
    setAdvStep('TEMPLATE');
    setStep(AppStep.INPUT);
    setProductData({productName:'',category:'FASHION',features:'',mainImage:null,detailImages:[],optionImages:[],benchmarkUrl:''});
    setGeneratedCopy(null); setProcessedImages([]); setPlanSections([]);
  };

  // ── Processing 화면 ──
  if (advStep === 'PROCESSING') return <ProcessingStep logs={logs} />;

  // ── Plan 화면 ──
  if (advStep === 'PLAN') return (
    <PlanStep
      sections={planSections}
      productName={productData.productName}
      category={productData.category}
      onConfirm={handleGenerateDetail}
      onBack={() => { setStep(AppStep.INPUT); setAdvStep('INPUT'); }}
    />
  );

  // ── Result 화면 ──
  if (advStep === 'RESULT' && generatedCopy) return (
    <ResultPreview
      copy={generatedCopy}
      images={processedImages}
      productName={productData.productName}
      category={productData.category}
      infoDisclosure={infoDisclosure}
      planSections={planSections}
      onReset={resetAll}
      detailMode="advanced"
    />
  );

  // ── STEP 1: 템플릿 선택 ──
  if (advStep === 'TEMPLATE') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 mb-4">
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-600">PREMIUM</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">디자인 템플릿 선택</h2>
          <p className="text-gray-500 text-sm">상세페이지 분위기를 먼저 선택하세요. AI가 선택한 템플릿에 맞게 최적화합니다</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {TEMPLATES.map(template => (
            <TemplatePreviewCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onClick={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setAdvStep('INPUT')}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-200 flex items-center gap-3 transition-all hover:scale-[1.02]"
          >
            <SparklesIcon className="w-6 h-6" />
            「{templateInfo.name}」 템플릿으로 시작
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2: 상품 정보 입력 ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 선택된 템플릿 표시 */}
      <div className="mb-6">
        <button onClick={() => setAdvStep('TEMPLATE')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4">
          <ArrowLeftIcon className="w-4 h-4" /> 템플릿 다시 선택
        </button>
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className={`w-14 h-14 rounded-xl ${templateInfo.preview.bg} flex items-center justify-center border ${templateInfo.preview.bg.includes('white') || templateInfo.preview.bg.includes('emerald') ? 'border-gray-200' : 'border-transparent'}`}>
            <div className={`w-6 h-1.5 rounded-full ${templateInfo.preview.accent}`}></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-gray-900">{templateInfo.name}</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">{templateInfo.subtitle}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{templateInfo.description}</p>
          </div>
          <CheckCircleIcon className="w-6 h-6 text-indigo-600 ml-auto shrink-0" />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">상품 정보 입력</h2>
        <p className="text-gray-500 text-sm">AI가 기획안을 먼저 작성하고, 검토 후 상세페이지를 생성합니다</p>
      </div>

      <form onSubmit={handleGeneratePlan} className="space-y-5">
        {/* 카테고리 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">카테고리 *</label>
          <div className="grid grid-cols-4 gap-3">
            {(['FASHION','LIVING','KITCHEN','FOOD'] as ProductCategory[]).map(cat=>(
              <button key={cat} type="button" onClick={()=>setProductData(p=>({...p,category:cat}))}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${productData.category===cat?'border-indigo-600 bg-indigo-50 text-indigo-700':'border-gray-200 hover:border-indigo-300 text-gray-500'}`}>
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              placeholder="예: 마켓피아 니트 리본 포인트 긴팔 티셔츠" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">주요 특징 (선택)</label>
            <textarea name="features" rows={3} value={productData.features} onChange={hi}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
              placeholder="예: 100% 면, 오버핏, 4가지 컬러" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">벤치마킹 URL (선택)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input name="benchmarkUrl" type="url" value={productData.benchmarkUrl||''} onChange={hi}
                className="w-full pl-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                placeholder="https://www.coupang.com/..." />
            </div>
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">이미지 업로드</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer relative h-36 transition-all ${isDraggingMain?'border-indigo-500 bg-indigo-50':'border-gray-200 hover:bg-gray-50'}`}
              onDragEnter={e=>de(e,'MAIN')} onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDragLeave={e=>dl(e,'MAIN')} onDrop={e=>dd(e,'MAIN')}>
              <input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0])setProductData(p=>({...p,mainImage:e.target.files![0]}))}} className="absolute inset-0 opacity-0 cursor-pointer" />
              {productData.mainImage?(<div className="pointer-events-none flex flex-col items-center"><img src={URL.createObjectURL(productData.mainImage)} alt="" className="h-20 object-contain mb-1"/><p className="text-xs text-green-600 font-bold truncate max-w-full px-2">{productData.mainImage.name}</p></div>):(<div className="pointer-events-none flex flex-col items-center"><PhotoIcon className="h-8 w-8 mb-2 text-gray-300"/><span className="text-sm font-medium text-gray-500">대표 이미지</span></div>)}
            </div>
            <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer relative h-36 transition-all ${isDraggingDetail?'border-indigo-500 bg-indigo-50':'border-gray-200 hover:bg-gray-50'}`}
              onDragEnter={e=>de(e,'DETAIL')} onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDragLeave={e=>dl(e,'DETAIL')} onDrop={e=>dd(e,'DETAIL')}>
              <input type="file" accept="image/*" multiple onChange={e=>{if(e.target.files)setProductData(p=>({...p,detailImages:[...p.detailImages,...Array.from(e.target.files!)]}))}} className="absolute inset-0 opacity-0 cursor-pointer" />
              {productData.detailImages.length>0?(<div className="pointer-events-none flex flex-col items-center"><span className="text-3xl font-black text-indigo-600">{productData.detailImages.length}</span><span className="text-sm text-gray-500 mt-1">장 선택됨</span></div>):(<div className="pointer-events-none flex flex-col items-center"><ArrowUpTrayIcon className="h-8 w-8 mb-2 text-gray-300"/><span className="text-sm font-medium text-gray-500">상세 이미지</span></div>)}
            </div>
          </div>
          <div className={`border-2 border-dashed rounded-xl p-3 flex items-center justify-center cursor-pointer relative h-14 transition-all ${isDraggingOption?'border-indigo-500 bg-indigo-50':'border-gray-200 hover:bg-gray-50'}`}
            onDragEnter={e=>de(e,'OPTION')} onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDragLeave={e=>dl(e,'OPTION')} onDrop={e=>dd(e,'OPTION')}>
            <input type="file" accept="image/*" multiple onChange={e=>{if(e.target.files)setProductData(p=>({...p,optionImages:[...p.optionImages,...Array.from(e.target.files!)]}))}} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="pointer-events-none flex items-center gap-2 text-gray-400">
              <SwatchIcon className="w-5 h-5"/>
              {productData.optionImages.length>0?<span className="font-bold text-indigo-600 text-sm">{productData.optionImages.length}개 옵션 선택됨</span>:<span className="text-sm font-medium">옵션 이미지 (색상/종류)</span>}
            </div>
          </div>
        </div>

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
                <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 flex-1">💡 한번 입력 후 저장하면 다음 상품에도 고정값이 자동 적용됩니다</p>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button type="button" onClick={saveInfoDisclosure} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">💾 저장</button>
                  {localStorage.getItem('saved_info_disclosure') && (
                    <button type="button" onClick={clearSavedInfoDisclosure} className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-300">초기화</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{name:'manufacturer',label:'제조자/수입자',ph:'(주)폰이지'},{name:'origin',label:'원산지',ph:'Made in China'},{name:'customerService',label:'고객센터',ph:'0507-1311-1108'}].map(f=>(
                  <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                  <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-400 outline-none"/></div>
                ))}
              </div>
              {productData.category==='FASHION'&&(
                <div className="grid grid-cols-2 gap-3">
                  {[{name:'material',label:'소재',ph:'폴리에스터 95%'},{name:'size',label:'사이즈',ph:'S/M/L/XL'},{name:'color',label:'색상',ph:'화이트, 블랙'},{name:'wash',label:'세탁방법',ph:'울코스 세탁'}].map(f=>(
                    <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                    <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-400 outline-none"/></div>
                  ))}
                </div>
              )}
              {productData.category==='FOOD'&&(
                <div className="grid grid-cols-2 gap-3">
                  {[{name:'ingredients',label:'원재료명',ph:'밀가루, 설탕'},{name:'capacity',label:'용량/중량',ph:'200g'},{name:'expiry',label:'유통기한',ph:'제조일로부터 1년'},{name:'storage',label:'보관방법',ph:'냉장보관'},{name:'haccp',label:'인증여부',ph:'HACCP 인증'}].map(f=>(
                    <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                    <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-400 outline-none"/></div>
                  ))}
                </div>
              )}
              {(productData.category==='LIVING'||productData.category==='KITCHEN')&&(
                <div className="grid grid-cols-2 gap-3">
                  {[{name:'material',label:'소재/재질',ph:'ABS 플라스틱'},{name:'certifications',label:'인증/허가',ph:'KC 인증'},{name:'warranty',label:'품질보증',ph:'구매일로부터 1년'},{name:'caution',label:'주의사항',ph:'직사광선 피해 보관'}].map(f=>(
                    <div key={f.name}><label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                    <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={ii} placeholder={f.ph} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-400 outline-none"/></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 생성 버튼 */}
        <button type="submit" className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]">
          <SparklesIcon className="w-6 h-6"/> ✨ AI 기획안 생성 시작
        </button>
        <p className="text-center text-xs text-gray-400">
          기획안 검토 → AI 연출샷 → 「{templateInfo.name}」 템플릿 적용
        </p>
      </form>
    </div>
  );
};
