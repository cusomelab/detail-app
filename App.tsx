import React, { useState, useEffect } from 'react';
import { setApiKey } from './services/geminiService';
import { ImageGenTab } from './components/tabs/ImageGenTab';
import { SizeChartTab } from './components/tabs/SizeChartTab';
import { OutfitTab } from './components/tabs/OutfitTab';
import { HangulTab } from './components/tabs/HangulTab';
import { AdvancedDetailTab } from './components/tabs/AdvancedDetailTab';
import { SparklesIcon, KeyIcon } from '@heroicons/react/24/outline';

const TABS = [
  { id: 'basic',     label: '📄 상세페이지' },
  { id: 'imggen',    label: '🖼️ 대표이미지' },
  { id: 'outfit',    label: '👗 의상 체인저' },
  { id: 'sizeChart', label: '📏 사이즈표' },
  { id: 'hangul',    label: '🏷️ 한글표시사항' },
] as const;
type TabId = typeof TABS[number]['id'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) { setApiKey(saved); setHasApiKey(true); }
  }, []);

  const handleApiKeySubmit = () => {
    const key = apiKeyInput.trim();
    if (!key.startsWith('AIza')) { alert('올바른 Gemini API 키를 입력해주세요.'); return; }
    setApiKey(key); localStorage.setItem('gemini_api_key', key); setHasApiKey(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
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
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab===tab.id?'bg-indigo-600 text-white shadow-md':'text-gray-500 hover:bg-gray-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab==='basic' && <AdvancedDetailTab />}
      {activeTab==='imggen' && <ImageGenTab />}
      {activeTab==='outfit' && <OutfitTab />}
      {activeTab==='sizeChart' && <SizeChartTab />}
      {activeTab==='hangul' && <HangulTab />}
    </div>
  );
}
export default App;
