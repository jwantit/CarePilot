import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { API_SERVER_HOST } from '../../../api/apiClient';

const PrescriptionHistoryTable = ({ list }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (!list || list.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
              <FileText size={20} className="text-[#008080]" />
            </div>
            처방 이력
          </h3>
        </div>
        <div className="px-10 py-12 text-center text-slate-400 text-sm">
          등록된 처방 이력이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
      <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <h3 className="font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <FileText size={20} className="text-[#008080]" />
          </div>
          처방 이력
        </h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-left table-fixed border-separate border-spacing-0">
          <thead className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
            <tr>
              <th className="px-10 py-4 w-[12%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">처방일</th>
              <th className="px-6 py-4 w-[12%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">분석 일시</th>
              <th className="px-6 py-4 w-[46%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">요약 및 분석</th>
              <th className="px-10 py-4 w-[15%] text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">처방전 이미지</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((row) => {
              const isExpanded = expandedId === row.prescriptionId;
              return (
                <tr key={row.prescriptionId} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-5 text-xs font-bold text-slate-600 tabular-nums align-top">
                    {row.prescribedDate || '-'}
                  </td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500 tabular-nums align-top">
                    {row.analyzedAt || '-'}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="text-sm text-slate-600 whitespace-pre-wrap">
                      {row.summary ? (
                        <>
                          <span className={isExpanded ? '' : 'line-clamp-2'}>{row.summary}</span>
                          {row.summary.length > 120 && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : row.prescriptionId)}
                              className="ml-1 text-[#008080] text-xs font-bold hover:underline"
                            >
                              {isExpanded ? '접기' : '더보기'}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">내역 없음</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-5 text-center align-top">
                    {row.imageFileUrl ? (
                      <a
                        href={`${API_SERVER_HOST}${row.imageFileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#008080] bg-[#008080]/10 border border-[#008080]/20 hover:bg-[#008080]/20 transition-colors"
                      >
                        이미지 보기
                      </a>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrescriptionHistoryTable;
