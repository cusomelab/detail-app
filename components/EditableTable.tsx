
import React from 'react';
import { SizeChartData } from '../types';

interface EditableTableProps {
  data: SizeChartData;
  setData: (data: SizeChartData) => void;
  exportRef: React.RefObject<HTMLDivElement>;
}

const EditableTable: React.FC<EditableTableProps> = ({ data, setData, exportRef }) => {
  const handleTitleChange = (val: string) => setData({ ...data, title: val });
  
  const handleHeaderChange = (index: number, val: string) => {
    const newHeaders = [...data.headers];
    newHeaders[index] = val;
    setData({ ...data, headers: newHeaders });
  };

  const handleRowChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = [...data.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = val;
    setData({ ...data, rows: newRows });
  };

  const handleNoteChange = (index: number, val: string) => {
    const newNotes = [...data.notes];
    newNotes[index] = val;
    setData({ ...data, notes: newNotes });
  };

  // 행 추가
  const addRow = () => {
    const newRow = new Array(data.headers.length).fill('');
    setData({ ...data, rows: [...data.rows, newRow] });
  };

  // 행 삭제
  const deleteRow = (index: number) => {
    if (data.rows.length <= 1) return; // 최소 한 행은 유지
    const newRows = data.rows.filter((_, i) => i !== index);
    setData({ ...data, rows: newRows });
  };

  // 열 추가
  const addColumn = () => {
    const newHeaders = [...data.headers, '항목'];
    const newRows = data.rows.map(row => [...row, '']);
    setData({ ...data, headers: newHeaders, rows: newRows });
  };

  // 열 삭제
  const deleteColumn = (index: number) => {
    if (data.headers.length <= 1) return; // 최소 한 열은 유지
    const newHeaders = data.headers.filter((_, i) => i !== index);
    const newRows = data.rows.map(row => row.filter((_, i) => i !== index));
    setData({ ...data, headers: newHeaders, rows: newRows });
  };

  return (
    <div className="flex flex-col items-center w-full py-8">
      <div 
        ref={exportRef}
        className="bg-white p-10 shadow-sm border border-gray-100 flex flex-col items-center relative"
        style={{ width: '860px', minHeight: '400px' }}
      >
        {/* Title Section */}
        <div className="w-full text-center mb-10">
          <h1 
            contentEditable 
            suppressContentEditableWarning
            onBlur={(e) => handleTitleChange(e.currentTarget.textContent || '')}
            className="text-4xl font-bold text-gray-800 tracking-wider outline-none border-b-2 border-transparent hover:border-blue-200 px-4 inline-block"
          >
            {data.title}
          </h1>
        </div>

        {/* Table Body */}
        <div className="w-full mb-6 relative group/table">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {data.headers.map((header, idx) => (
                  <th 
                    key={`header-${idx}`}
                    className="relative border border-gray-300 p-3 text-sm font-semibold text-gray-700 bg-gray-100 group/header"
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleHeaderChange(idx, e.currentTarget.textContent || '')}
                      className="outline-none focus:bg-white px-1"
                    >
                      {header}
                    </div>
                    {/* 열 삭제 버튼 */}
                    <button
                      data-html2canvas-ignore
                      onClick={() => deleteColumn(idx)}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/header:opacity-100 hover:bg-red-600 transition-opacity z-10 shadow-sm"
                      title="열 삭제"
                    >
                      ✕
                    </button>
                  </th>
                ))}
                {/* 열 추가 버튼 */}
                <th data-html2canvas-ignore className="border-none bg-transparent p-0 w-8 align-middle">
                  <button 
                    onClick={addColumn}
                    className="ml-2 bg-gray-200 text-gray-600 rounded-lg w-8 h-10 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    title="열 추가"
                  >
                    +
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rIdx) => (
                <tr key={`row-${rIdx}`} className="group/row hover:bg-gray-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td 
                      key={`cell-${rIdx}-${cIdx}`}
                      className="border border-gray-300 p-3 text-center text-gray-600 relative"
                    >
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleRowChange(rIdx, cIdx, e.currentTarget.textContent || '')}
                        className="outline-none focus:bg-blue-50 focus:text-blue-700 font-medium px-1"
                      >
                        {cell}
                      </div>
                      
                      {/* 행 삭제 버튼 (첫 번째 셀에만 표시) */}
                      {cIdx === 0 && (
                        <button
                          data-html2canvas-ignore
                          onClick={() => deleteRow(rIdx)}
                          className="absolute -left-7 top-1/2 -translate-y-1/2 bg-red-100 text-red-500 rounded-md w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover/row:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="행 삭제"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  ))}
                  {/* 행 끝 빈 공간 정렬용 */}
                  <td data-html2canvas-ignore className="border-none bg-transparent"></td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* 행 추가 버튼 */}
          <div data-html2canvas-ignore className="mt-4 flex justify-center">
            <button 
              onClick={addRow}
              className="px-8 py-2 bg-gray-100 text-gray-500 rounded-xl border border-dashed border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2 font-medium"
            >
              <span>+ 새로운 행 추가</span>
            </button>
          </div>
        </div>

        {/* Footer / Notes Section */}
        <div className="w-full text-left text-xs text-gray-400 space-y-1 mt-auto border-t pt-4">
          {data.notes.map((note, nIdx) => (
            <div 
              key={`note-${nIdx}`}
              className="flex items-start gap-1 group/note"
            >
              <span className="shrink-0">•</span>
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleNoteChange(nIdx, e.currentTarget.textContent || '')}
                className="outline-none flex-1 hover:text-gray-600 px-1"
              >
                {note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditableTable;
