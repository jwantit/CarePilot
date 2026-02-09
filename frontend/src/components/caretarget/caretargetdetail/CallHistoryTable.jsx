import React from 'react';
import { Clock } from 'lucide-react';

const CallHistoryTable = ({ history }) => {
  const typeMap = {
    'REGULAR_MONITORING': { text: '정기 모니터링', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50' },
    'EMERGENCY': { text: '긴급 통화', color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50' },
    'MEDICATION_CHECK': { text: '약물 확인', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' },
    'SYMPTOM_CHECK': { text: '증상 체크', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50' },
    'FOLLOW_UP': { text: '후속 조치', color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50' },
    'OTHER': { text: '기타 상담', color: 'bg-cp-bg text-cp-text border border-cp-border dark:bg-cp-bg/50 dark:text-cp-muted dark:border-cp-border' }
  };

  return (
    <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-lg hover:shadow-xl transition-shadow overflow-hidden mb-12">
      <div className="px-10 py-7 border-b border-cp-border flex justify-between items-center bg-gradient-to-r from-cp-card to-cp-bg">
        <h3 className="font-black text-cp-text flex items-center gap-3">
          <div className="w-10 h-10 bg-cp-bg rounded-sm flex items-center justify-center shadow-md border border-cp-border">
            <Clock size={20} className="text-teal-400"/>
          </div>
          통화 이력
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto modal-scrollbar text-left">
        <table className="w-full text-center table-fixed border-separate border-spacing-0">
          <thead className="bg-cp-header sticky top-0 z-10 border-b-2 border-teal-500/30">
            <tr>
              <th className="px-10 py-4 w-[20%] text-sm font-semibold text-white dark:text-teal-400 uppercase tracking-widest">상담 일시</th>
              <th className="px-6 py-4 w-[15%] text-sm font-semibold text-white dark:text-teal-400 uppercase tracking-widest">유형</th>
              <th className="px-6 py-4 w-[50%] text-sm font-semibold text-white dark:text-teal-400 uppercase tracking-widest">상담 요약</th>
              <th className="px-10 py-4 w-[15%] text-sm font-semibold text-white dark:text-teal-400 uppercase tracking-widest">진행 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cp-border">
            {history && history.length > 0 ? (
              history.map((log, idx) => {
                const typeInfo = typeMap[log.callType] || typeMap['OTHER'];
                return (
                  <tr key={idx} className="hover:bg-cp-bg/50 transition-all group bg-cp-card/30 cursor-pointer">
                    <td className="px-10 py-5 text-base text-cp-text tabular-nums">{log.startTime || "-"}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-block text-sm font-bold px-4 py-1.5 rounded-sm border ${typeInfo.color} shadow-sm`}>{typeInfo.text}</span>
                    </td>
                    <td className="px-6 py-5 text-base font-normal text-cp-muted truncate group-hover:text-cp-text text-left">{log.summary || "내역 없음"}</td>
                    <td className="px-10 py-5">
                      <span className={`inline-block px-4 py-1.5 rounded-sm text-sm font-bold border shadow-sm ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-cp-bg text-cp-text border border-cp-border dark:bg-cp-bg/50 dark:text-cp-muted dark:border-cp-border'}`}>
                        {log.status === 'SUCCESS' ? '완료' : '실패'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-10 py-12 text-center text-cp-muted text-base font-normal bg-cp-card/30">
                  등록된 통화 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallHistoryTable;
