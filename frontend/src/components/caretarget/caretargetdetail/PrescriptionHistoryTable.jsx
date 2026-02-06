import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { API_SERVER_HOST } from '../../../api/apiClient';

const PrescriptionHistoryTable = ({ list }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (!list || list.length === 0) {
    return (
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-lg hover:shadow-xl transition-shadow overflow-hidden mb-12">
        <div className="px-10 py-7 border-b border-cp-border flex justify-between items-center bg-cp-bg/30">
          <h3 className="font-black text-cp-text flex items-center gap-3">
            <div className="w-10 h-10 bg-cp-input rounded-sm flex items-center justify-center shadow-md border border-cp-border">
              <FileText size={20} className="text-teal-400" />
            </div>
            처방 이력
          </h3>
        </div>
        <div className="px-10 py-12 text-center text-cp-muted text-sm font-medium">
          등록된 처방 이력이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-lg hover:shadow-xl transition-shadow overflow-hidden mb-12">
      <div className="px-10 py-7 border-b border-cp-border flex justify-between items-center bg-cp-bg/30">
        <h3 className="font-black text-cp-text flex items-center gap-3">
          <div className="w-10 h-10 bg-cp-input rounded-sm flex items-center justify-center shadow-md border border-cp-border">
            <FileText size={20} className="text-teal-400" />
          </div>
          처방 이력
        </h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto modal-scrollbar">
        <table className="w-full text-left table-fixed border-separate border-spacing-0">
          <thead className="bg-cp-header sticky top-0 z-10 border-b border-cp-border">
            <tr>
              <th className="px-10 py-4 w-[12%] text-[11px] font-bold text-cp-muted uppercase tracking-widest">처방일</th>
              <th className="px-6 py-4 w-[12%] text-[11px] font-bold text-cp-muted uppercase tracking-widest">분석 일시</th>
              <th className="px-6 py-4 w-[46%] text-[11px] font-bold text-cp-muted uppercase tracking-widest">요약 및 분석</th>
              <th className="px-10 py-4 w-[15%] text-[11px] font-bold text-cp-muted uppercase tracking-widest text-center">처방전 이미지</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cp-border">
            {list.map((row) => {
              const isExpanded = expandedId === row.prescriptionId;
              return (
                <tr key={row.prescriptionId} className="hover:bg-cp-bg/50 transition-all group bg-cp-card/50">
                  <td className="px-10 py-5 text-xs font-bold text-cp-text tabular-nums align-top">
                    {row.prescribedDate || '-'}
                  </td>
                  <td className="px-6 py-5 text-xs font-medium text-cp-muted tabular-nums align-top">
                    {row.analyzedAt || '-'}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="text-sm text-cp-muted font-medium group-hover:text-cp-text whitespace-pre-wrap">
                      {row.summary ? (
                        <>
                          <span className={isExpanded ? '' : 'line-clamp-2'}>{row.summary}</span>
                          {row.summary.length > 120 && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : row.prescriptionId)}
                              className="ml-1 text-teal-400 text-xs font-bold hover:underline"
                            >
                              {isExpanded ? '접기' : '더보기'}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-cp-muted/50">내역 없음</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-5 text-center align-top">
                    {row.imageFileUrl ? (
                      <a
                        href={`${API_SERVER_HOST}${row.imageFileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cp-link-blue"
                      >
                        이미지 보기
                      </a>
                    ) : (
                      <span className="text-cp-muted text-xs">-</span>
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
