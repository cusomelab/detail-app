import React from 'react';

interface ProcessingStepProps {
  logs: string[];
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({ logs }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto border border-gray-100">
      <div className="w-16 h-16 mb-6 relative">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 에이전트 작업 중...</h2>
      <p className="text-gray-500 mb-8 text-center">
        Nano Banana 3 (Gemini Pro)가 쿠팡 판매 전략에 맞춰 콘텐츠를 현지화하고 있습니다.
      </p>

      <div className="w-full bg-gray-50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm border border-gray-200">
        {logs.map((log, index) => (
          <div key={index} className="mb-2 last:mb-0 animate-pulse">
            <span className="text-indigo-500 mr-2">➜</span>
            <span className="text-gray-700">{log}</span>
          </div>
        ))}
        {logs.length === 0 && <span className="text-gray-400">초기화 중...</span>}
      </div>
    </div>
  );
};