import React, { useState, useRef, useCallback } from 'react';
import { analyzeSizeChart } from '../../services/sizeChartService';
import { SizeChartData, AppState } from '../../types/sizeChart';

// ── 편집 가능한 테이블 ─────────────────────────────────
const EditableTable: React.FC<{
  data: SizeChartData;
  onChange: (data: SizeChartData) => void;
}> = ({ data, onChange }) => {
  const updateCell = (row: number, col: number, val: string) => {
    const newRows = data.rows.map((r, ri) => ri === row ? r.map((c, ci) => ci === col ? val : c) : r);
    onChange({ ...data, rows: newRows });
  };
  const updateHeader = (col: number, val: string) => {
    const headers = data.headers.map((h, i) => i === col ? val : h);
    onChange({ ...data, headers });
  };
  const addRow = () => onChange({ ...data, rows: [...data.rows, Array(data.headers.length).fill('')] });
  const removeRow = (i: number) => onChange({ ...data, rows: data.rows.filter((_, ri) => ri !== i) });
  const addCol = () => onChange({ ...data, headers: [...data.headers, ''], rows: data.rows.map(r => [...r, '']) });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-800 text-white">
            {data.headers.map((h, i) => (
              <th key={i} className="p-2 border border-gray-600">
                <input value={h} onChange={e => updateHeader(i, e.target.value)}
                  className="bg-transparent text-white font-bold text-center w-full outline-none" />
              </th>
            ))}
            <th className="p-2 border border-gray-600">
              <button onClick={addCol} className="text-xs text-gray-300 hover:text-white">+ 열</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="p-2 border border-gray-200">
                  <input value={cell} onChange={e => updateCell(ri, ci, e.target.value)}
                    className="w-full text-center outline-none bg-transparent" />
                </td>
              ))}
              <td className="p-2 border border-gray-200 text-center">
                <button onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className="mt-2 text-xs text-indigo-600 hover:underline">+ 행 추가</button>
    </div>
  );
};

export const SizeChartTab: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<SizeChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 업로드 가능합니다'); setState(AppState.ERROR); return; }
    setState(AppState.UPLOADING); setError(null);
    const reader = new FileReader();
    reader.onload = async e => {
      const b64 = e.target?.result as string;
      setPreviewUrl(b64);
      try {
        setState(AppState.ANALYZING);
        const analyzed = await analyzeSizeChart(b64);
        setData(analyzed);
        setState(AppState.EDITING);
      } catch (err: any) {
        setError(err.message || '분석 중 오류 발생');
        setState(AppState.ERROR);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDownload = async () => {
    if (!exportRef.current) return;
    const canvas = await (window as any).html2canvas(exportRef.current, { scale: 2, backgroundColor: '#fff' });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = `사이즈표_${Date.now()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const reset = () => { setState(AppState.IDLE); setData(null); setError(null); setPreviewUrl(null); };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">📏 사이즈표 다운로드</h2>
        <p className="text-gray-500 text-sm">중국어 사이즈표 이미지를 업로드하면 한국어로 번역 후 편집/다운로드할 수 있어요</p>
      </div>

      {state === AppState.IDLE || state === AppState.ERROR ? (
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
            className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-indigo-200'}`}
          >
            <div className="text-4xl">📊</div>
            <div className="text-center">
              <p className="font-bold text-gray-700">사이즈표 이미지를 드래그하거나 클릭</p>
              <p className="text-sm text-gray-400 mt-1">중국어 사이즈표를 자동으로 한국어로 번역합니다</p>
            </div>
            <label className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-indigo-700">
              파일 선택
              <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>
      ) : state === AppState.UPLOADING || state === AppState.ANALYZING ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-gray-700">{state === AppState.UPLOADING ? '업로드 중...' : 'AI가 번역 중...'}</p>
          {previewUrl && <img src={previewUrl} alt="" className="mt-4 max-h-48 rounded-xl shadow-lg" />}
        </div>
      ) : state === AppState.EDITING && data ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900">{data.title}</h3>
              {(data.productCode || data.weight) && (
                <p className="text-sm text-gray-500">
                  {data.productCode && `품번: ${data.productCode}`}
                  {data.productCode && data.weight && ' · '}
                  {data.weight && `중량: ${data.weight}`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownload}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center gap-2">
                ⬇️ 이미지 다운로드
              </button>
              <button onClick={reset}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200">
                🔄 새로 시작
              </button>
            </div>
          </div>

          {/* 편집 가능한 테이블 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <EditableTable data={data} onChange={setData} />
          </div>

          {data.notes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <p className="text-xs font-bold text-yellow-700 mb-2">📌 참고사항</p>
              {data.notes.map((note, i) => <p key={i} className="text-xs text-yellow-700">{note}</p>)}
            </div>
          )}

          {/* 내보낼 영역 (숨김) */}
          <div ref={exportRef} className="fixed -left-[9999px] bg-white p-8" style={{ width: '800px' }}>
            <h2 className="text-2xl font-black text-center mb-4 text-gray-900">{data.title}</h2>
            {(data.productCode || data.weight) && (
              <p className="text-center text-sm text-gray-500 mb-4">
                {data.productCode && `품번: ${data.productCode}`} {data.weight && `중량: ${data.weight}`}
              </p>
            )}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  {data.headers.map((h, i) => <th key={i} className="p-3 border border-gray-600 font-bold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, ci) => <td key={ci} className="p-3 border border-gray-200 text-center">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.notes.length > 0 && (
              <div className="mt-4 border-t pt-4">
                {data.notes.map((note, i) => <p key={i} className="text-xs text-gray-500">{note}</p>)}
              </div>
            )}
            <p className="text-center text-xs text-gray-300 mt-6 uppercase tracking-widest">MARKETPIA</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
