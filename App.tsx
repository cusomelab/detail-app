import React, { useState, useEffect, useRef } from 'react';
import { ProductData, GeneratedCopy, ProcessedImage, AppStep, ProductCategory, ProductInfoDisclosure } from './types';
import { generateProductCopy } from './services/geminiService';
import { ProcessingStep } from './components/ProcessingStep';
import { ResultPreview } from './components/ResultPreview';
import { ArrowUpTrayIcon, PhotoIcon, SparklesIcon, KeyIcon, LinkIcon, ShoppingBagIcon, HomeIcon, FireIcon, CakeIcon, SwatchIcon } from '@heroicons/react/24/outline';

function App() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Drag State
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingDetail, setIsDraggingDetail] = useState(false);
  const [isDraggingOption, setIsDraggingOption] = useState(false);
  
  // Drag Counters to prevent flickering on child elements
  const dragCounterMain = useRef(0);
  const dragCounterDetail = useRef(0);
  const dragCounterOption = useRef(0);
  
  // Data State
  const [productData, setProductData] = useState<ProductData>({
    productName: '',
    category: 'FASHION', // Default
    features: '',
    mainImage: null,
    detailImages: [],
    optionImages: [],
    benchmarkUrl: ''
  });

  // Result State
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  
  // ★ 상품 정보고시
  const [infoDisclosure, setInfoDisclosure] = useState<ProductInfoDisclosure>({
    manufacturer: '',
    origin: '',
    material: '',
    customerService: '',
  });

  // Check for API Key on mount
  useEffect(() => {
    const win = window as any;
    // 1) AI Studio 환경
    if (win.aistudio) {
      win.aistudio.hasSelectedApiKey().then((hasKey: boolean) => setHasApiKey(hasKey));
      return;
    }
    // 2) sessionStorage에서 복원 (이전에 입력한 키)
    try {
      const saved = sessionStorage.getItem('GEMINI_API_KEY');
      if (saved && saved.length > 10) {
        win.__GEMINI_API_KEY__ = saved;
        setHasApiKey(true);
        return;
      }
    } catch {}
    // 3) window에 직접 설정된 키
    if (win.__GEMINI_API_KEY__ && win.__GEMINI_API_KEY__.length > 10) {
      setHasApiKey(true);
      return;
    }
    setHasApiKey(false);
  }, []);

  // Prevent accidental refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (generatedCopy) {
            e.preventDefault();
            e.returnValue = ''; // Chrome requires returnValue to be set
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [generatedCopy]);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
    } else {
      // Vercel 환경 — 수동 입력
      const key = prompt('Gemini API Key를 입력하세요:');
      if (key && key.trim()) {
        // 런타임에 process.env.API_KEY를 덮어씌움 (Vite define은 빌드 시점이므로 런타임 변수로 세팅)
        (window as any).__GEMINI_API_KEY__ = key.trim();
        setHasApiKey(true);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category: ProductCategory) => {
    setProductData(prev => ({ ...prev, category }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductData(prev => ({ ...prev, mainImage: e.target.files![0] }));
    }
  };

  const handleDetailImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductData(prev => ({ 
        ...prev, 
        detailImages: [...prev.detailImages, ...Array.from(e.target.files!)]
      }));
    }
  };

  const handleOptionImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductData(prev => ({ 
        ...prev, 
        optionImages: [...prev.optionImages, ...Array.from(e.target.files!)]
      }));
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = (e: React.DragEvent, type: 'MAIN' | 'DETAIL' | 'OPTION') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'MAIN') {
        dragCounterMain.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDraggingMain(true);
    } else if (type === 'DETAIL') {
        dragCounterDetail.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDraggingDetail(true);
    } else {
        dragCounterOption.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDraggingOption(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent, type: 'MAIN' | 'DETAIL' | 'OPTION') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'MAIN') {
        dragCounterMain.current -= 1;
        if (dragCounterMain.current === 0) setIsDraggingMain(false);
    } else if (type === 'DETAIL') {
        dragCounterDetail.current -= 1;
        if (dragCounterDetail.current === 0) setIsDraggingDetail(false);
    } else {
        dragCounterOption.current -= 1;
        if (dragCounterOption.current === 0) setIsDraggingOption(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'MAIN' | 'DETAIL' | 'OPTION') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'MAIN') {
      setIsDraggingMain(false);
      dragCounterMain.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setProductData(prev => ({ ...prev, mainImage: e.dataTransfer.files[0] }));
      }
    } else if (type === 'DETAIL') {
      setIsDraggingDetail(false);
      dragCounterDetail.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setProductData(prev => ({ ...prev, detailImages: [...prev.detailImages, ...Array.from(e.dataTransfer.files)] }));
      }
    } else {
      setIsDraggingOption(false);
      dragCounterOption.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setProductData(prev => ({ ...prev, optionImages: [...prev.optionImages, ...Array.from(e.dataTransfer.files)] }));
      }
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setStep(AppStep.PROCESSING);
    setLogs([]);
    setProcessedImages([]);

    try {
      // 1. Generate Copy
      addLog(`🤖 [${productData.category}] 카테고리 전문 AI 에이전트 호출 중...`);
      addLog("📦 상품 기본 정보를 분석하고 있습니다...");
      
      if (productData.benchmarkUrl) addLog("🔎 벤치마킹 링크를 분석하여 소구점을 추출하고 있습니다...");
      if (productData.mainImage) addLog("📸 대표 이미지를 시각적으로 분석하여 특징을 추출하고 있습니다...");

      addLog("✍️ 구매 전환율을 높이는 모바일 최적화 카피 생성 중...");
      
      const copy = await generateProductCopy(
          productData.productName, 
          productData.features, 
          productData.category,
          productData.benchmarkUrl,
          productData.mainImage
      );
      setGeneratedCopy(copy);
      addLog("✅ 카피라이팅 생성 완료.");

      // 2. Load Images — ★ 한 번에 배열로 세팅 (React batching 문제 방지)
      const allImages: ProcessedImage[] = [];
      
      if (productData.mainImage) {
          addLog("📂 대표 이미지를 에디터로 불러오는 중...");
          allImages.push({ 
              originalUrl: URL.createObjectURL(productData.mainImage), 
              processedUrl: URL.createObjectURL(productData.mainImage), 
              type: 'main', status: 'done', 
              fileName: productData.mainImage.name 
          });
      }

      if (productData.detailImages.length > 0) {
        addLog(`📂 상세 이미지 ${productData.detailImages.length}장을 에디터로 불러오는 중...`);
        productData.detailImages.forEach((file) => {
            allImages.push({ 
                originalUrl: URL.createObjectURL(file), 
                processedUrl: URL.createObjectURL(file), 
                type: 'detail', status: 'done', 
                fileName: file.name 
            });
        });
      }

      if (productData.optionImages.length > 0) {
        addLog(`📂 옵션 이미지 ${productData.optionImages.length}장을 에디터로 불러오는 중...`);
        productData.optionImages.forEach((file) => {
            allImages.push({ 
                originalUrl: URL.createObjectURL(file), 
                processedUrl: URL.createObjectURL(file), 
                type: 'option', status: 'done', 
                fileName: file.name 
            });
        });
      }

      // ★ 한 번에 세팅 — ResultPreview useEffect가 최종 상태로 1회만 실행
      setProcessedImages(allImages);

      addLog("✨ 준비 완료! 에디터 화면으로 이동합니다...");
      setTimeout(() => setStep(AppStep.RESULT), 800);

    } catch (error: any) {
      console.error('Full error:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      const errDetail = error?.response?.data?.error?.message || error?.statusText || '';
      const fullMsg = errDetail ? `${errMsg}\n\n상세: ${errDetail}` : errMsg;
      
      if (errMsg.includes("Requested entity was not found") || errMsg.includes("API key") || errMsg.includes("API Key") || errMsg.includes("PERMISSION_DENIED") || errMsg.includes("API_KEY_INVALID") || errMsg.includes("403")) {
        alert(`API Key 오류: ${fullMsg}\n\n키를 다시 입력해주세요.`);
        (window as any).__GEMINI_API_KEY__ = null;
        try { sessionStorage.removeItem('GEMINI_API_KEY'); } catch {}
        setHasApiKey(false);
        setStep(AppStep.INPUT);
        return;
      }
      addLog(`❌ 오류 발생: ${errMsg}`);
      // ★ 실제 에러 메시지를 사용자에게 표시 (디버깅용)
      alert(`오류 발생:\n${fullMsg}`);
      setStep(AppStep.INPUT);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
           <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><KeyIcon className="w-8 h-8 text-indigo-600" /></div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">API 키 연결 필요</h1>
           <p className="text-gray-500 mb-6">Gemini API 키를 입력하면 바로 시작할 수 있습니다.</p>
           {/* ★ 수동 API Key 입력 */}
           <div className="mb-4">
               <input 
                   type="password" 
                   id="apiKeyInput"
                   placeholder="Gemini API Key를 붙여넣으세요" 
                   className="w-full py-3 px-4 border border-gray-300 rounded-xl text-center text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
               />
           </div>
           <button onClick={() => {
               const input = document.getElementById('apiKeyInput') as HTMLInputElement;
               const key = input?.value?.trim();
               if (!key) {
                   alert('API Key를 입력해주세요.');
                   return;
               }
               // ★ 이중 저장: window + sessionStorage
               (window as any).__GEMINI_API_KEY__ = key;
               try { sessionStorage.setItem('GEMINI_API_KEY', key); } catch {}
               setHasApiKey(true);
           }} id="apiStartBtn" className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"><KeyIcon className="w-5 h-5" /> 시작하기</button>
           <p className="mt-6 text-xs text-gray-400"><a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">Google AI Studio에서 API Key 발급받기 →</a></p>
        </div>
      </div>
    );
  }

  if (step === AppStep.PROCESSING) return <ProcessingStep logs={logs} />;

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
            setProductData({ productName: '', category: 'FASHION', features: '', mainImage: null, detailImages: [], optionImages: [], benchmarkUrl: '' });
            setGeneratedCopy(null);
            setProcessedImages([]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3"><SparklesIcon className="w-10 h-10 text-indigo-600" /> CoupangGen AI</h1>
          <p className="mt-4 text-lg text-gray-500">Powered by <span className="font-semibold text-indigo-600">Gemini 3 Pro</span></p>
          <p className="mt-2 text-sm text-gray-400">상품명만 입력하면 3초 만에 상세페이지 초안을 생성합니다.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 선택</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['FASHION', 'LIVING', 'KITCHEN', 'FOOD'].map(cat => (
                    <button key={cat} type="button" onClick={() => handleCategoryChange(cat as ProductCategory)} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${productData.category === cat ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-500'}`}>
                      {cat === 'FASHION' && <ShoppingBagIcon className="w-6 h-6 mb-1" />}
                      {cat === 'LIVING' && <HomeIcon className="w-6 h-6 mb-1" />}
                      {cat === 'KITCHEN' && <FireIcon className="w-6 h-6 mb-1" />}
                      {cat === 'FOOD' && <CakeIcon className="w-6 h-6 mb-1" />}
                      <span className="text-sm font-bold">{cat === 'FASHION' ? '패션/잡화' : cat === 'LIVING' ? '생활/홈' : cat === 'KITCHEN' ? '주방/유아' : '식품/간식'}</span>
                    </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
              <input id="productName" name="productName" type="text" required className="appearance-none rounded-lg block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="예: 데일리 루즈핏 브이넥 니트 가디건" value={productData.productName} onChange={handleInputChange} />
            </div>
            
            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-1">주요 특징 (선택사항)</label>
              <textarea id="features" name="features" rows={3} className="appearance-none rounded-lg block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="예: 울 함유, 오버핏, 봄가을용 (AI가 카피라이팅에 참고합니다)" value={productData.features} onChange={handleInputChange} />
            </div>

            <div>
              <label htmlFor="benchmarkUrl" className="block text-sm font-medium text-gray-700 mb-1">벤치마킹 링크 (선택사항)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>
                <input type="url" name="benchmarkUrl" id="benchmarkUrl" className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="예: https://www.coupang.com/vp/products/..." value={productData.benchmarkUrl || ''} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group h-40 ${isDraggingMain ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  onDragEnter={(e) => handleDragEnter(e, 'MAIN')} onDragOver={handleDragOver} onDragLeave={(e) => handleDragLeave(e, 'MAIN')} onDrop={(e) => handleDrop(e, 'MAIN')}
                >
                   <input type="file" accept="image/*" onChange={handleMainImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   {productData.mainImage ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none">
                           <img src={URL.createObjectURL(productData.mainImage)} alt="Preview" className="h-24 object-contain mb-2" />
                           <p className="text-xs text-green-600 font-bold truncate max-w-full px-2">{productData.mainImage.name}</p>
                        </div>
                   ) : (
                       <div className="pointer-events-none flex flex-col items-center">
                        <PhotoIcon className={`h-10 w-10 transition-colors mb-2 ${isDraggingMain ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                        <span className={`block text-sm font-medium ${isDraggingMain ? 'text-indigo-700' : 'text-gray-600'}`}>대표 이미지 (드래그 & 드롭)</span>
                       </div>
                   )}
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group h-40 ${isDraggingDetail ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  onDragEnter={(e) => handleDragEnter(e, 'DETAIL')} onDragOver={handleDragOver} onDragLeave={(e) => handleDragLeave(e, 'DETAIL')} onDrop={(e) => handleDrop(e, 'DETAIL')}
                >
                   <input type="file" accept="image/*" multiple onChange={handleDetailImagesChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    {productData.detailImages.length > 0 ? (
                        <div className="flex flex-col items-center justify-center h-full pointer-events-none"><span className="text-3xl font-bold text-indigo-600 mb-1">{productData.detailImages.length}</span><span className="text-sm text-gray-600">장 선택됨</span></div>
                    ) : (
                        <div className="pointer-events-none flex flex-col items-center">
                            <ArrowUpTrayIcon className={`h-10 w-10 transition-colors mb-2 ${isDraggingDetail ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                            <span className={`block text-sm font-medium ${isDraggingDetail ? 'text-indigo-700' : 'text-gray-600'}`}>상세 이미지 (드래그 & 드롭)</span>
                        </div>
                    )}
                </div>
            </div>

            <div 
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group h-32 ${isDraggingOption ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                onDragEnter={(e) => handleDragEnter(e, 'OPTION')} onDragOver={handleDragOver} onDragLeave={(e) => handleDragLeave(e, 'OPTION')} onDrop={(e) => handleDrop(e, 'OPTION')}
            >
                <input type="file" accept="image/*" multiple onChange={handleOptionImagesChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {productData.optionImages.length > 0 ? (
                    <div className="flex flex-col items-center justify-center h-full pointer-events-none"><span className="text-3xl font-bold text-indigo-600 mb-1">{productData.optionImages.length}</span><span className="text-sm text-gray-600">개 옵션 선택됨</span></div>
                ) : (
                    <div className="pointer-events-none flex flex-col items-center">
                        <SwatchIcon className={`h-8 w-8 transition-colors mb-2 ${isDraggingOption ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                        <span className={`block text-sm font-medium ${isDraggingOption ? 'text-indigo-700' : 'text-gray-600'}`}>옵션 이미지 (색상/종류) 추가</span>
                    </div>
                )}
            </div>

          </div>
          
          {/* ★ 상품 정보고시 입력란 */}
          <div className="border border-gray-200 rounded-xl p-6 space-y-4 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">📋 상품 정보고시 (선택)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">제조자/수입자</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: (주)폰이지" value={infoDisclosure.manufacturer || ''} onChange={(e) => setInfoDisclosure(prev => ({...prev, manufacturer: e.target.value}))} />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">원산지</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: 중국" value={infoDisclosure.origin || ''} onChange={(e) => setInfoDisclosure(prev => ({...prev, origin: e.target.value}))} />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">소재/재질</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: 폴리에스테르 95%, 스판 5%" value={infoDisclosure.material || ''} onChange={(e) => setInfoDisclosure(prev => ({...prev, material: e.target.value}))} />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">고객센터</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: 02-1234-5678" value={infoDisclosure.customerService || ''} onChange={(e) => setInfoDisclosure(prev => ({...prev, customerService: e.target.value}))} />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">색상</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: 블랙, 화이트, 그레이" value={infoDisclosure.color || ''} onChange={(e) => setInfoDisclosure(prev => ({...prev, color: e.target.value}))} />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">사이즈</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: FREE (44~66)" value={infoDisclosure.size || ''} onChange={(e) => setInfoDisclosure(prev => ({...prev, size: e.target.value}))} />
                  </div>
              </div>
          </div>

          <div><button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all transform hover:scale-[1.01]"><SparklesIcon className="h-5 w-5 mr-2" /> 상세페이지 기획 생성 (즉시 시작)</button></div>
        </form>
      </div>
    </div>
  );
}

export default App;
