import React, { useState, useEffect, useRef } from 'react';
import { ProductData, GeneratedCopy, ProcessedImage, AppStep, ProductCategory, PlanSection, ProductInfoDisclosure } from './types';
import { generateProductCopy, generatePlan, setApiKey } from './services/geminiService';
import { ProcessingStep } from './components/ProcessingStep';
import { PlanStep } from './components/PlanStep';
import { ResultPreview } from './components/ResultPreview';
import {
  ArrowUpTrayIcon, PhotoIcon, SparklesIcon, KeyIcon, LinkIcon,
  ShoppingBagIcon, HomeIcon, FireIcon, CakeIcon, SwatchIcon,
  ChevronDownIcon, ChevronUpIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';

function App() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [logs, setLogs] = useState<string[]>([]);
  const [planSections, setPlanSections] = useState<PlanSection[]>([]);
  const [showInfoDisclosure, setShowInfoDisclosure] = useState(false);

  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingDetail, setIsDraggingDetail] = useState(false);
  const [isDraggingOption, setIsDraggingOption] = useState(false);
  const dragCounterMain = useRef(0);
  const dragCounterDetail = useRef(0);
  const dragCounterOption = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productData, setProductData] = useState<ProductData>({
    productName: '', category: 'FASHION', features: '',
    mainImage: null, detailImages: [], optionImages: [], benchmarkUrl: ''
  });

  // 정보고시
  const [infoDisclosure, setInfoDisclosure] = useState<ProductInfoDisclosure>({
    manufacturer: '', origin: 'Made in China', customerService: '',
    material: '', size: '', color: '', wash: '',
    ingredients: '', capacity: '', expiry: '', storage: '', haccp: '',
    certifications: '', warranty: '', caution: ''
  });

  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  // API 키 복원
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) { setApiKey(saved); setHasApiKey(true); }
  }, []);

  const handleApiKeySubmit = () => {
    const key = apiKeyInput.trim();
    if (!key.startsWith('AIza')) { alert('올바른 Gemini API 키를 입력해주세요. (AIza로 시작)'); return; }
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setHasApiKey(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInfoDisclosure(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category: ProductCategory) => {
    setProductData(prev => ({ ...prev, category }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setProductData(prev => ({ ...prev, mainImage: e.target.files![0] }));
  };
  const handleDetailImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setProductData(prev => ({ ...prev, detailImages: [...prev.detailImages, ...Array.from(e.target.files!)] }));
  };
  const handleOptionImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setProductData(prev => ({ ...prev, optionImages: [...prev.optionImages, ...Array.from(e.target.files!)] }));
  };

  const handleDragEnter = (e: React.DragEvent, type: 'MAIN'|'DETAIL'|'OPTION') => {
    e.preventDefault(); e.stopPropagation();
    if (type==='MAIN') { dragCounterMain.current++; if (e.dataTransfer.items.length > 0) setIsDraggingMain(true); }
    else if (type==='DETAIL') { dragCounterDetail.current++; if (e.dataTransfer.items.length > 0) setIsDraggingDetail(true); }
    else { dragCounterOption.current++; if (e.dataTransfer.items.length > 0) setIsDraggingOption(true); }
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e: React.DragEvent, type: 'MAIN'|'DETAIL'|'OPTION') => {
    e.preventDefault(); e.stopPropagation();
    if (type==='MAIN') { dragCounterMain.current--; if (dragCounterMain.current===0) setIsDraggingMain(false); }
    else if (type==='DETAIL') { dragCounterDetail.current--; if (dragCounterDetail.current===0) setIsDraggingDetail(false); }
    else { dragCounterOption.current--; if (dragCounterOption.current===0) setIsDraggingOption(false); }
  };
  const handleDrop = (e: React.DragEvent, type: 'MAIN'|'DETAIL'|'OPTION') => {
    e.preventDefault(); e.stopPropagation();
    if (type==='MAIN') { setIsDraggingMain(false); dragCounterMain.current=0; if (e.dataTransfer.files[0]) setProductData(prev=>({...prev,mainImage:e.dataTransfer.files[0]})); }
    else if (type==='DETAIL') { setIsDraggingDetail(false); dragCounterDetail.current=0; if (e.dataTransfer.files.length>0) setProductData(prev=>({...prev,detailImages:[...prev.detailImages,...Array.from(e.dataTransfer.files)]})); }
    else { setIsDraggingOption(false); dragCounterOption.current=0; if (e.dataTransfer.files.length>0) setProductData(prev=>({...prev,optionImages:[...prev.optionImages,...Array.from(e.dataTransfer.files)]})); }
  };

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  // ── STEP 1: 기획안 생성 ─────────────────────────────
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.productName) { alert('상품명을 입력해주세요'); return; }
    setStep(AppStep.PROCESSING);
    setLogs(['🎯 상품 정보 분석 중...', '📝 13개 섹션 기획안 작성 중...']);
    try {
      const sections = await generatePlan(
        productData.productName, productData.category,
        productData.features, productData.mainImage
      );
      setPlanSections(sections);
      setStep(AppStep.PLAN);
    } catch (err: any) {
      addLog(`❌ 오류: ${err.message}`);
      alert('기획안 생성 실패. 다시 시도해주세요.');
      setStep(AppStep.INPUT);
    }
  };

  // ── STEP 2: 상세페이지 생성 ─────────────────────────
  const handleGenerateDetail = async (confirmedSections: PlanSection[]) => {
    setStep(AppStep.PROCESSING);
    setLogs([]);
    setProcessedImages([]);
    try {
      addLog('🤖 AI 카피라이터 호출 중...');
      addLog('✍️ 기획안 기반으로 카피 작성 중...');

      const copy = await generateProductCopy(
        productData.productName, productData.features, productData.category,
        productData.benchmarkUrl, productData.mainImage, confirmedSections
      );
      setGeneratedCopy(copy);
      addLog('✅ 카피 완성');

      if (productData.mainImage) {
        addLog('📸 대표 이미지 로드 중...');
        setProcessedImages(prev => [...prev, {
          originalUrl: URL.createObjectURL(productData.mainImage!),
          processedUrl: URL.createObjectURL(productData.mainImage!),
          type: 'main', status: 'done'
        }]);
      }
      productData.detailImages.forEach(f => {
        setProcessedImages(prev => [...prev, { originalUrl: URL.createObjectURL(f), processedUrl: URL.createObjectURL(f), type: 'detail', status: 'done' }]);
      });
      productData.optionImages.forEach(f => {
        setProcessedImages(prev => [...prev, { originalUrl: URL.createObjectURL(f), processedUrl: URL.createObjectURL(f), type: 'option', status: 'done' }]);
      });

      addLog('✨ 에디터로 이동 중...');
      setTimeout(() => setStep(AppStep.RESULT), 800);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('API')) {
        alert('API 키가 유효하지 않습니다.');
        setHasApiKey(false);
        localStorage.removeItem('gemini_api_key');
      }
      addLog(`❌ 오류: ${err.message}`);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
      setStep(AppStep.PLAN);
    }
  };

  // ── API 키 화면 ─────────────────────────────────────
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <KeyIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gemini API 키 입력</h1>
          <p className="text-gray-500 mb-6 text-sm">Google AI Studio에서 발급받은 API 키를 입력하세요.<br/><span className="text-xs text-gray-400">입력한 키는 브라우저에만 저장됩니다.</span></p>
          <input type="password" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleApiKeySubmit()} placeholder="AIza..." className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          <button onClick={handleApiKeySubmit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
            <KeyIcon className="w-5 h-5" /> 연결하기
          </button>
          <p className="mt-4 text-xs text-gray-400">API 키 발급: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">aistudio.google.com/apikey</a></p>
        </div>
      </div>
    );
  }

  if (step === AppStep.PROCESSING) return <ProcessingStep logs={logs} />;

  if (step === AppStep.PLAN) return (
    <PlanStep
      sections={planSections}
      productName={productData.productName}
      category={productData.category}
      onConfirm={handleGenerateDetail}
      onBack={() => setStep(AppStep.INPUT)}
    />
  );

  if (step === AppStep.RESULT && generatedCopy) {
    return (
      <ResultPreview
        copy={generatedCopy}
        images={processedImages}
        productName={productData.productName}
        category={productData.category}
        infoDisclosure={infoDisclosure}
        onReset={() => {
          setStep(AppStep.INPUT);
          setProductData({ productName:'', category:'FASHION', features:'', mainImage:null, detailImages:[], optionImages:[], benchmarkUrl:'' });
          setGeneratedCopy(null); setProcessedImages([]); setPlanSections([]);
        }}
      />
    );
  }

  // ── 입력 화면 ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wider">
            <SparklesIcon className="w-4 h-4" /> AI 상세페이지 제작기
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">어떤 상세페이지를 만들까요?</h1>
          <p className="mt-3 text-gray-500">상품 정보를 입력하면 AI가 기획안부터 완성 상세페이지까지 자동으로 만들어드려요</p>
          <button onClick={() => { setHasApiKey(false); localStorage.removeItem('gemini_api_key'); }} className="mt-2 text-xs text-gray-300 hover:text-gray-500 underline">API 키 변경</button>
        </div>

        <form onSubmit={handleGeneratePlan} className="space-y-6">
          {/* 카테고리 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">카테고리 *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['FASHION','LIVING','KITCHEN','FOOD'] as ProductCategory[]).map(cat => (
                <button key={cat} type="button" onClick={() => handleCategoryChange(cat)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${productData.category===cat ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-500'}`}>
                  {cat==='FASHION' && <ShoppingBagIcon className="w-6 h-6 mb-1.5" />}
                  {cat==='LIVING' && <HomeIcon className="w-6 h-6 mb-1.5" />}
                  {cat==='KITCHEN' && <FireIcon className="w-6 h-6 mb-1.5" />}
                  {cat==='FOOD' && <CakeIcon className="w-6 h-6 mb-1.5" />}
                  <span className="text-sm font-bold">{cat==='FASHION'?'의류/패션':cat==='LIVING'?'리빙/홈':cat==='KITCHEN'?'주방/유아':'식품/건강'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <label className="block text-sm font-bold text-gray-700">상품명 *</label>
            <input name="productName" type="text" required value={productData.productName} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              placeholder="예: 마켓피아 니트 리본 포인트 긴팔 티셔츠" />

            <label className="block text-sm font-bold text-gray-700">주요 특징 (선택)</label>
            <textarea name="features" rows={3} value={productData.features} onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
              placeholder="예: 100% 면, 오버핏, 4가지 컬러, 봄가을용" />

            <label className="block text-sm font-bold text-gray-700">벤치마킹 URL (선택)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input name="benchmarkUrl" type="url" value={productData.benchmarkUrl||''} onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                placeholder="https://www.coupang.com/..." />
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-bold text-gray-700 mb-4">이미지 업로드</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative h-40 transition-all ${isDraggingMain?'border-indigo-500 bg-indigo-50':'border-gray-200 hover:bg-gray-50'}`}
                onDragEnter={e=>handleDragEnter(e,'MAIN')} onDragOver={handleDragOver} onDragLeave={e=>handleDragLeave(e,'MAIN')} onDrop={e=>handleDrop(e,'MAIN')}>
                <input type="file" accept="image/*" onChange={handleMainImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {productData.mainImage ? (
                  <div className="flex flex-col items-center pointer-events-none">
                    <img src={URL.createObjectURL(productData.mainImage)} alt="" className="h-20 object-contain mb-1" />
                    <p className="text-xs text-green-600 font-bold truncate max-w-full px-2">{productData.mainImage.name}</p>
                  </div>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center">
                    <PhotoIcon className={`h-10 w-10 mb-2 ${isDraggingMain?'text-indigo-500':'text-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-500">대표 이미지</span>
                    <span className="text-xs text-gray-400 mt-1">드래그 & 드롭</span>
                  </div>
                )}
              </div>
              <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative h-40 transition-all ${isDraggingDetail?'border-indigo-500 bg-indigo-50':'border-gray-200 hover:bg-gray-50'}`}
                onDragEnter={e=>handleDragEnter(e,'DETAIL')} onDragOver={handleDragOver} onDragLeave={e=>handleDragLeave(e,'DETAIL')} onDrop={e=>handleDrop(e,'DETAIL')}>
                <input type="file" accept="image/*" multiple onChange={handleDetailImagesChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {productData.detailImages.length>0 ? (
                  <div className="flex flex-col items-center pointer-events-none">
                    <span className="text-3xl font-black text-indigo-600">{productData.detailImages.length}</span>
                    <span className="text-sm text-gray-500 mt-1">장 선택됨</span>
                  </div>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center">
                    <ArrowUpTrayIcon className={`h-10 w-10 mb-2 ${isDraggingDetail?'text-indigo-500':'text-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-500">상세 이미지</span>
                    <span className="text-xs text-gray-400 mt-1">여러 장 가능</span>
                  </div>
                )}
              </div>
            </div>
            <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer relative h-24 transition-all ${isDraggingOption?'border-indigo-500 bg-indigo-50':'border-gray-200 hover:bg-gray-50'}`}
              onDragEnter={e=>handleDragEnter(e,'OPTION')} onDragOver={handleDragOver} onDragLeave={e=>handleDragLeave(e,'OPTION')} onDrop={e=>handleDrop(e,'OPTION')}>
              <input type="file" accept="image/*" multiple onChange={handleOptionImagesChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              {productData.optionImages.length>0 ? (
                <div className="pointer-events-none flex items-center gap-2">
                  <SwatchIcon className="w-5 h-5 text-indigo-500" />
                  <span className="font-bold text-indigo-600">{productData.optionImages.length}개</span>
                  <span className="text-sm text-gray-500">옵션 이미지 선택됨</span>
                </div>
              ) : (
                <div className="pointer-events-none flex items-center gap-2 text-gray-400">
                  <SwatchIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">옵션 이미지 (색상/종류)</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 정보고시 ─────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button type="button" onClick={() => setShowInfoDisclosure(!showInfoDisclosure)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                <div className="text-left">
                  <span className="text-sm font-bold text-gray-700">상품 정보고시</span>
                  <span className="ml-2 text-xs text-gray-400">(선택) - 입력 시 하단 정보고시 정확하게 생성</span>
                </div>
              </div>
              {showInfoDisclosure
                ? <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                : <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              }
            </button>

            {showInfoDisclosure && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 mt-4">
                  💡 여기에 입력한 정보가 상세페이지 하단 정보고시 섹션에 정확하게 표시됩니다
                </p>

                {/* 공통 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name:'manufacturer', label:'제조자/수입자', placeholder:'(주)폰이지' },
                    { name:'origin', label:'원산지', placeholder:'Made in China' },
                    { name:'customerService', label:'고객센터', placeholder:'0507-1311-1108' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                      <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={handleInfoChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>

                {/* 카테고리별 필드 */}
                {productData.category === 'FASHION' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name:'material', label:'소재', placeholder:'폴리에스터 95%, 스판덱스 5%' },
                      { name:'size', label:'사이즈', placeholder:'S/M/L/XL (상세 사이즈표 참조)' },
                      { name:'color', label:'색상', placeholder:'화이트, 블랙, 베이지' },
                      { name:'wash', label:'세탁방법', placeholder:'울코스 세탁, 드라이크리닝 권장' },
                    ].map(f => (
                      <div key={f.name}>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                        <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={handleInfoChange}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                          placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>
                )}

                {productData.category === 'FOOD' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name:'ingredients', label:'원재료명', placeholder:'밀가루, 설탕, 버터...' },
                      { name:'capacity', label:'용량/중량', placeholder:'200g' },
                      { name:'expiry', label:'유통기한', placeholder:'제조일로부터 1년' },
                      { name:'storage', label:'보관방법', placeholder:'냉장보관(0~10℃)' },
                      { name:'haccp', label:'인증여부', placeholder:'HACCP 인증 제품' },
                    ].map(f => (
                      <div key={f.name}>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                        <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={handleInfoChange}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                          placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>
                )}

                {(productData.category === 'LIVING' || productData.category === 'KITCHEN') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name:'material', label:'소재/재질', placeholder:'ABS 플라스틱, 스테인리스' },
                      { name:'certifications', label:'인증/허가', placeholder:'KC 인증' },
                      { name:'warranty', label:'품질보증', placeholder:'구매일로부터 1년' },
                      { name:'caution', label:'주의사항', placeholder:'직사광선 피해 보관' },
                    ].map(f => (
                      <div key={f.name}>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                        <input name={f.name} value={(infoDisclosure as any)[f.name]} onChange={handleInfoChange}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                          placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 생성 버튼 */}
          <button type="submit"
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]">
            <SparklesIcon className="w-6 h-6" /> AI 기획안 생성 시작
          </button>
          <p className="text-center text-xs text-gray-400">기획안 확인 후 최종 상세페이지를 생성합니다</p>
        </form>
      </div>
    </div>
  );
}

export default App;
