import React, { useState, useEffect, useRef } from 'react';
import { ProductData, GeneratedCopy, ProcessedImage, AppStep, ProductCategory, PlanSection, ProductInfoDisclosure } from './types';
import { generateProductCopy, setApiKey } from './services/geminiService';
import { ProcessingStep } from './components/ProcessingStep';
import { ResultPreview } from './components/ResultPreview';
import { ImageGenTab } from './components/tabs/ImageGenTab';
import { SizeChartTab } from './components/tabs/SizeChartTab';
import { OutfitTab } from './components/tabs/OutfitTab';
import { HangulTab } from './components/tabs/HangulTab';
import { AdvancedDetailTab } from './components/tabs/AdvancedDetailTab';
import {
  ArrowUpTrayIcon, PhotoIcon, SparklesIcon, KeyIcon,
  ShoppingBagIcon, HomeIcon, FireIcon, CakeIcon, SwatchIcon
} from '@heroicons/react/24/outline';

const TABS = [
  { id: 'basic',     label: '📄 기본형' },
  { id: 'advanced',  label: '✨ 고급형' },
  { id: 'imggen',    label: '🖼️ 대표이미지' },
  { id: 'outfit',    label: '👗 의상 체인저' },
  { id: 'sizeChart', label: '📏 사이즈표' },
  { id: 'hangul',    label: '🏷️ 한글표시사항' },
] as const;
type TabId = typeof TABS[number]['id'];
type DetailMode = 'basic' | 'advanced';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [detailMode, setDetailMode] = useState<DetailMode>('basic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [logs, setLogs] = useState<string[]>([]);
  const [planSections] = useState<PlanSection[]>([]);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingDetail, setIsDraggingDetail] = useState(false);
  const [isDraggingOption, setIsDraggingOption] = useState(false);
  const dcMain = useRef(0); const dcDetail = useRef(0); const dcOption = useRef(0);

  const [productData, setProductData] = useState<ProductData>({
    productName:'', category:'FASHION', features:'', mainImage:null, detailImages:[], optionImages:[], benchmarkUrl:''
  });
  const [infoDisclosure] = useState<ProductInfoDisclosure>({
    manufacturer:'', origin:'Made in China', customerService:'', material:'', size:'', color:'', wash:'',
    ingredients:'', capacity:'', expiry:'', storage:'', haccp:'', certifications:'', warranty:'', caution:''
  });
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) { setApiKey(saved); setHasApiKey(true); }
  }, []);

  const handleApiKeySubmit = () => {
    const key = apiKeyInput.trim();
    if (!key.startsWith('AIza')) { alert('올바른 Gemini API 키를 입력해주세요.'); return; }
    setApiKey(key); localStorage.setItem('gemini_api_key', key); setHasApiKey(true);
  };

  const hi = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProductData(prev => ({ ...prev, [e.target.name]: e.target.value }));

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

  // 기본형: 기획안 단계 없이 바로 상세페이지 생성
  const handleBasicGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.productName) { alert('상품명을 입력해주세요'); return; }
    setStep(AppStep.PROCESSING); setLogs([]); setProcessedImages([]);
    try {
      addLog('🤖 AI 카피라이터 호출 중...'); addLog('✍️ 카피 작성 중...');
      const copy = await generateProductCopy(productData.productName, productData.features, productData.category, productData.benchmarkUrl, productData.mainImage);
      setGeneratedCopy(copy); addLog('✅ 카피 완성!');
      if (productData.mainImage) setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(productData.mainImage!),processedUrl:URL.createObjectURL(productData.mainImage!),type:'main',status:'done'}]);
      productData.detailImages.forEach(f=>setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(f),processedUrl:URL.createObjectURL(f),type:'detail',status:'done'}]));
      productData.optionImages.forEach(f=>setProcessedImages(p=>[...p,{originalUrl:URL.createObjectURL(f),processedUrl:URL.createObjectURL(f),type:'option',status:'done',fileName:f.name}]));
      addLog('🚀 상세페이지 생성 완료!');
      setTimeout(()=>setStep(AppStep.RESULT),800);
    } catch(err:any) {
      if(err.message?.includes('401')){setHasApiKey(false);localStorage.removeItem('gemini_api_key');}
      alert('오류 발생. 다시 시도해주세요.'); setStep(AppStep.INPUT);
    }
  };

  const resetDetail = () => {
    setStep(AppStep.INPUT);
    setProductData({productName:'',category:'FASHION',features:'',mainImage:null,detailImages:[],optionImages:[],benchmarkUrl:''});
    setGeneratedCopy(null); setProcessedImages([]);
  };

  if (!hasApiKey) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <SparklesIcon className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">쿠썸 AI 올인원 툴</h1>
        <p className="text-xs text-gray-400 mb-6">상세페이지 · 대표이미지 · 의상체인저 · 사이즈표</p>
        <input type="password" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleApiKeySubmit()} placeholder="Gemini API 키 (AIza...)"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <button onClick={handleApiKeySubmit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
          <KeyIcon className="w-5 h-5" /> 시작하기
        </button>
        <p className="mt-4 text-xs text-gray-400">
          API 키 발급: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">aistudio.google.com/apikey</a>
        </p>
      </div>
    </div>
  );

  const isBasicTab = activeTab==='basic';
  if (isBasicTab) {
    if (step===AppStep.PROCESSING) return <ProcessingStep logs={logs} />;
    if (step===AppStep.RESULT&&generatedCopy) return <ResultPreview copy={generatedCopy} images={processedImages} productName={productData.productName} category={productData.category} infoDisclosure={infoDisclosure} planSections={planSections} onReset={resetDetail} detailMode="basic" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 + 탭 */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-black text-gray-900">쿠썸 AI 올인원 툴</span>
          </div>
          <button onClick={()=>{setHasApiKey(false);localStorage.removeItem('gemini_api_key');}} className="text-xs text-gray-400 hover:text-gray-600 underline">API 키 변경</button>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-1">
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>{setActiveTab(tab.id);if(tab.id==='basic'){setDetailMode('basic');resetDetail();}}}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab===tab.id?'bg-indigo-600 text-white shadow-md':'text-gray-500 hover:bg-gray-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab==='advanced' && <AdvancedDetailTab />}
      {activeTab==='imggen' && <ImageGenTab />}
      {activeTab==='outfit' && <OutfitTab />}
      {activeTab==='sizeChart' && <SizeChartTab />}
      {activeTab==='hangul' && <HangulTab />}

      {isBasicTab && step===AppStep.INPUT && (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">빠른 상세페이지 만들기</h2>
            <p className="text-gray-500 text-sm">상품 정보만 입력하면 AI가 바로 상세페이지를 만들어드려요</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border" style={{borderColor:'#10b981', color:'#10b981', backgroundColor:'#ecfdf5'}}>
              ⚡ 기본형 · 빠르고 간편하게
            </div>
          </div>
          <form onSubmit={handleBasicGenerate} className="space-y-5">
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
            </div>
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
            <button type="submit" className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01]">
              <SparklesIcon className="w-6 h-6"/> ⚡ 바로 상세페이지 생성
            </button>
            <p className="text-center text-xs text-gray-400">
              상품 정보를 바탕으로 바로 상세페이지를 생성합니다
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
export default App;
