import React, { useState } from 'react';
import { PlanSection, ProductCategory } from '../types';
import { regeneratePlanSection } from '../services/geminiService';
import {
  SparklesIcon, PencilSquareIcon, CheckIcon, XMarkIcon,
  ArrowPathIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon, TrashIcon
} from '@heroicons/react/24/outline';

interface PlanStepProps {
  sections: PlanSection[];
  productName: string;
  category: ProductCategory;
  onConfirm: (sections: PlanSection[]) => void;
  onBack: () => void;
}

const SECTION_COLORS: Record<string, string> = {
  HERO:      'bg-indigo-600',
  OVERVIEW:  'bg-slate-600',
  STORY:     'bg-purple-600',
  DETAIL:    'bg-blue-600',
  REVIEW:    'bg-yellow-500',
  POINT:     'bg-emerald-600',
  OPTIONS:   'bg-pink-500',
  RECOMMEND: 'bg-orange-500',
  SIZE:      'bg-cyan-600',
  GUIDE:     'bg-teal-600',
  INFO:      'bg-gray-600',
  CAUTION:   'bg-red-500',
  CUSTOM:    'bg-violet-500',
};

const SECTION_ICONS: Record<string, string> = {
  HERO: '🎯', OVERVIEW: '📋', STORY: '💫', DETAIL: '🔍',
  REVIEW: '⭐', POINT: '✨', OPTIONS: '🎨', RECOMMEND: '👍',
  SIZE: '📏', GUIDE: '📖', INFO: '📌', CAUTION: '⚠️', CUSTOM: '🔧',
};

export const PlanStep: React.FC<PlanStepProps> = ({
  sections: initialSections, productName, category, onConfirm, onBack
}) => {
  const [sections, setSections] = useState<PlanSection[]>(initialSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const enabledCount = sections.filter(s => s.enabled).length;

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const startEdit = (s: PlanSection) => {
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditContent(s.content);
  };

  const saveEdit = () => {
    setSections(prev => prev.map(s => s.id === editingId
      ? { ...s, title: editTitle, content: editContent }
      : s
    ));
    setEditingId(null);
  };

  const handleRegenerate = async (s: PlanSection) => {
    setRegeneratingId(s.id);
    try {
      const updated = await regeneratePlanSection(s, productName, category);
      setSections(prev => prev.map(sec => sec.id === s.id ? updated : sec));
    } catch (e) {
      alert('재생성 실패. 다시 시도해주세요.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newSections = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= newSections.length) return;
    [newSections[idx], newSections[target]] = [newSections[target], newSections[idx]];
    setSections(newSections);
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const addCustomSection = () => {
    const newSection: PlanSection = {
      id: `custom-${Date.now()}`,
      type: 'CUSTOM',
      label: '커스텀',
      title: '새로운 섹션',
      content: '섹션 내용을 입력하세요',
      enabled: true,
    };
    setSections(prev => [...prev, newSection]);
    startEdit(newSection);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">기획안 확인</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="font-bold text-indigo-600">{enabledCount}개</span> 섹션 선택됨
              <span className="mx-2">·</span>
              <span className="text-gray-500">{productName}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            >
              ← 다시 입력
            </button>
            <button
              onClick={() => onConfirm(sections)}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
            >
              <SparklesIcon className="w-4 h-4" />
              상세페이지 생성
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {/* 안내 */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
          <SparklesIcon className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div className="text-sm text-indigo-700">
            <span className="font-bold">AI가 기획안을 작성했어요!</span>
            <span className="text-indigo-500 ml-1">섹션을 켜고 끄거나, 내용을 수정하고 재생성할 수 있어요. 확인 후 생성 버튼을 눌러주세요.</span>
          </div>
        </div>

        {/* 섹션 목록 */}
        {sections.map((s, idx) => (
          <div
            key={s.id}
            className={`bg-white rounded-2xl border transition-all ${
              s.enabled ? 'border-gray-100 shadow-sm' : 'border-gray-100 opacity-50'
            }`}
          >
            {editingId === s.id ? (
              /* 편집 모드 */
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-full ${SECTION_COLORS[s.type] || 'bg-gray-500'}`}>
                    {SECTION_ICONS[s.type]} {s.label}
                  </span>
                </div>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold mb-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="섹션 제목"
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                  placeholder="섹션 내용"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
                  <button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg">
                    <CheckIcon className="w-4 h-4" /> 저장
                  </button>
                </div>
              </div>
            ) : (
              /* 일반 모드 */
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* 순서 이동 */}
                    <div className="flex flex-col gap-0.5 mt-1 shrink-0">
                      <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20">
                        <ChevronUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20">
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 토글 */}
                    <button
                      onClick={() => toggleSection(s.id)}
                      className={`w-5 h-5 rounded border-2 shrink-0 mt-1 flex items-center justify-center transition-all ${
                        s.enabled ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                      }`}
                    >
                      {s.enabled && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full shrink-0 ${SECTION_COLORS[s.type] || 'bg-gray-500'}`}>
                          {SECTION_ICONS[s.type]} {s.label}
                        </span>
                        <span className="text-sm font-bold text-gray-800 truncate">{s.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{s.content}</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRegenerate(s)}
                      disabled={!!regeneratingId}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="AI 재생성"
                    >
                      {regeneratingId === s.id
                        ? <ArrowPathIcon className="w-4 h-4 animate-spin text-indigo-500" />
                        : <SparklesIcon className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="직접 편집"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeSection(s.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="삭제"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 섹션 추가 */}
        <button
          onClick={addCustomSection}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> 섹션 추가
        </button>

        {/* 하단 생성 버튼 */}
        <div className="pt-4 pb-8">
          <button
            onClick={() => onConfirm(sections)}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all"
          >
            <SparklesIcon className="w-6 h-6" />
            {enabledCount}개 섹션으로 상세페이지 생성
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">생성 후에도 에디터에서 자유롭게 수정할 수 있어요</p>
        </div>
      </div>
    </div>
  );
};
