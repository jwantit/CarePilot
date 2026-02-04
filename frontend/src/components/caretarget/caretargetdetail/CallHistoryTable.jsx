import React from 'react';
import { Clock } from 'lucide-react';

const CallHistoryTable = ({ history }) => {
  const typeMap = {
    'REGULAR_MONITORING': { text: '정기 모니터링', color: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/50' },
    'EMERGENCY': { text: '긴급 통화', color: 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50' },
    'MEDICATION_CHECK': { text: '약물 확인', color: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50' },
    'SYMPTOM_CHECK': { text: '증상 체크', color: 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/50' },
    'FOLLOW_UP': { text: '후속 조치', color: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400 border border-purple-500/50' },
    'OTHER': { text: '기타 상담', color: 'bg-gradient-to-br from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/50' }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-lg hover:shadow-xl transition-shadow overflow-hidden mb-12">
      <div className="px-10 py-7 border-b border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-900">
        <h3 className="font-black text-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-950 rounded-sm flex items-center justify-center shadow-md border border-slate-700">
            <Clock size={20} className="text-teal-400"/>
          </div>
          통화 이력
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto modal-scrollbar">
        <table className="w-full text-left table-fixed border-separate border-spacing-0">
          <thead className="bg-gradient-to-r from-slate-900 to-slate-950 sticky top-0 z-10 border-b border-slate-700">
            <tr>
              <th className="px-10 py-4 w-[20%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">상담 일시</th>
              <th className="px-6 py-4 w-[15%] text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">유형</th>
              <th className="px-6 py-4 w-[50%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">상담 요약</th>
              <th className="px-10 py-4 w-[15%] text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">진행 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {history.map((log, idx) => {
              const typeInfo = typeMap[log.callType] || typeMap['OTHER'];
              return (
                <tr key={idx} className="hover:bg-slate-700/50 transition-all group bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                  <td className="px-10 py-5 text-xs font-bold text-slate-300 tabular-nums">{log.startTime || "-"}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-sm border ${typeInfo.color} shadow-md`}>{typeInfo.text}</span>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-400 truncate group-hover:text-slate-200">{log.summary || "내역 없음"}</td>
                  <td className="px-10 py-5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-sm text-[10px] font-black border shadow-md ${log.status === 'SUCCESS' ? 'bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border-teal-500/50' : 'bg-gradient-to-br from-slate-500/20 to-slate-600/20 text-slate-400 border-slate-500/50'}`}>
                      {log.status === 'SUCCESS' ? '완료' : '실패'}
                    </span>
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

export default CallHistoryTable;