import React, { useState, useEffect, useRef } from 'react';
import { ProductData, GeneratedCopy, ProcessedImage, AppStep, ProductCategory } from './types';
import { generateProductCopy, setApiKey } from './services/geminiService';
import { ProcessingStep } from './components/ProcessingStep';
import { ResultPreview } from './components/ResultPreview';
import { ArrowUpTrayIcon, PhotoIcon, SparklesIcon, KeyIcon, LinkIcon, ShoppingBagIcon, HomeIcon, FireIcon, CakeIcon, SwatchIcon } from '@heroicons/react/24/outline';

function App() {
  const [apiKey, setApiKeyState] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Drag State
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingDetail, setIsDraggingDetail] = useState(false);
  const [isDraggingOption, setIsDraggingOption] = useState(false);
  
  const dragCounterMain = useRef(0);
  const dragCounterDetail = useRef(0);
  const dragCounterOption = useRef(0);
  
  // Data State
  const [productData, setProductData] = useState<ProductData>({
    productName: '',
    category: 'FASHION',
    features: '',
    mainImage: null,
    detailImages: [],
    optionImages: [],
    benchmarkUrl: ''
  });

  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  // localStorage에서 API 키 복원
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) {
      setApiKeyState(saved);
      setApiKey(saved);
      setHasApiKey(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (generatedCopy) {
            e.preventDefault();
            e.returnValue = '';
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [generatedCopy]);

  const handleApiKeySubmit = () => {
    const key = apiKeyInput.trim();
    if (!key.startsWith('AIza')) {
      alert('올바른 Gemini API 키를 입력해주세요. (AIza로 시작)');
      return;
    }
    setApiKeyState(key);
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setHasApiKey(true);
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
      addLog(`🤖 [${productData.category}] 카테고리 전문 AI 에이전트 호출 중...`);
      addLog("📦 상품 기본 정보를 분석하고 있습니다...");
      if (productData.benchmarkUrl) addLog("🔎 벤치마킹 링크를 분석하여 소구점을 추출하고 있습니다...");
      if (productData.mainImage) addLog("📸 대표 이미지를 시각적으로 분석하고 있습니다...");
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

      if (productData.mainImage) {
          addLog("📂 대표 이미지를 에디터로 불러오는 중...");
          setProcessedImages(prev => [...prev, { originalUrl: URL.createObjectURL(productData.mainImage!), processedUrl: URL.createObjectURL(productData.mainImage!), type: 'main', status: 'done' }]);
      }
      if (productData.detailImages.length > 0) {
        addLog(`📂 상세 이미지 ${productData.detailImages.length}장을 에디터로 불러오는 중...`);
        productData.detailImages.forEach((file) => {
            setProcessedImages(prev => [...prev, { originalUrl: URL.createObjectURL(file), processedUrl: URL.createObjectURL(file), type: 'detail', status: 'done' }]);
        });
      }
      if (productData.optionImages.length > 0) {
        addLog(`📂 옵션 이미지 ${productData.optionImages.length}장을 에디터로 불러오는 중...`);
        productData.optionImages.forEach((file) => {
            setProcessedImages(prev => [...prev, { originalUrl: URL.createObjectURL(file), processedUrl: URL.createObjectURL(file), type: 'option', status: 'done' }]);
        });
      }

      addLog("✨ 준비 완료! 에디터 화면으로 이동합니다...");
      setTimeout(() => setStep(AppStep.RESULT), 800);

    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('401') || error.message?.includes('API')) {
        alert('API 키가 유효하지 않습니다. 다시 확인해주세요.');
        setHasApiKey(false);
        localStorage.removeItem('gemini_api_key');
      }
      addLog(`❌ 오류 발생: ${error instanceof Error ? error.message : "Unknown"}`);
      alert("처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setStep(AppStep.INPUT);
    }
  };

  // ── API 키 입력 화면 ──────────────────────────────────
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
           <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <KeyIcon className="w-8 h-8 text-indigo-600" />
           </div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">Gemini API 키 입력</h1>
           <p className="text-gray-500 mb-6">
             Google AI Studio에서 발급받은 API 키를 입력하세요.<br/>
             <span className="text-xs text-gray-400">입력한 키는 브라우저에만 저장됩니다.</span>
           </p>
           <input
             type="password"
             value={apiKeyInput}
             onChange={(e) => setApiKeyInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
             placeholder="AIza..."
             className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
           />
           <button 
             onClick={handleApiKeySubmit}
             className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
           >
             <KeyIcon className="w-5 h-5" /> 연결하기
           </button>
           <p className="mt-4 text-xs text-gray-400">
             API 키 발급: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">aistudio.google.com/apikey</a>
           </p>
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
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <SparklesIcon className="w-10 h-10 text-indigo-600" /> CoupangGen AI
          </h1>
          <p className="mt-4 text-lg text-gray-500">Powered by <span className="font-semibold text-indigo-600">Gemini</span></p>
          <p className="mt-2 text-sm text-gray-400">상품명만 입력하면 3초 만에 상세페이지 초안을 생성합니다.</p>
          <button 
            onClick={() => { setHasApiKey(false); localStorage.removeItem('gemini_api_key'); }}
            className="mt-2 text-xs text-gray-300 hover:text-gray-500 underline"
          >
            API 키 변경
          </button>
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
              <textarea id="features" name="features" rows={3} className="appearance-none rounded-lg block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="예: 울 함유, 오버핏, 봄가을용" value={productData.features} onChange={handleInputChange} />
            </div>

            <div>
              <label htmlFor="benchmarkUrl" className="block text-sm font-medium text-gray-700 mb-1">벤치마킹 링크 (선택사항)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="h-5 w-5 text-gray-400" /></div>
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

          <div>
            <button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all transform hover:scale-[1.01]">
              <SparklesIcon className="h-5 w-5 mr-2" /> 상세페이지 기획 생성 (즉시 시작)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
