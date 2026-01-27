import React from 'react';
import { Clock } from 'lucide-react';

const CallHistoryTable = ({ history }) => {
  const typeMap = {
    'REGULAR_MONITORING': { text: '정기 모니터링', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    'EMERGENCY': { text: '긴급 통화', color: 'bg-red-50 text-red-600 border-red-100' },
    'MEDICATION_CHECK': { text: '약물 확인', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    'SYMPTOM_CHECK': { text: '증상 체크', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    'FOLLOW_UP': { text: '후속 조치', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    'OTHER': { text: '기타 상담', color: 'bg-slate-50 text-slate-500 border-slate-100' }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
      <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <h3 className="font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
            <Clock size={20} className="text-[#008080]"/>
          </div>
          통화 이력
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full text-left table-fixed border-separate border-spacing-0">
          <thead className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
            <tr>
              <th className="px-10 py-4 w-[20%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">상담 일시</th>
              <th className="px-6 py-4 w-[15%] text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">유형</th>
              <th className="px-6 py-4 w-[50%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">상담 요약</th>
              <th className="px-10 py-4 w-[15%] text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">진행 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {history.map((log, idx) => {
              const typeInfo = typeMap[log.callType] || typeMap['OTHER'];
              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-5 text-xs font-bold text-slate-600 tabular-nums">{log.startTime || "-"}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border ${typeInfo.color}`}>{typeInfo.text}</span>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-500 truncate group-hover:text-slate-900">{log.summary || "내역 없음"}</td>
                  <td className="px-10 py-5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${log.status === 'SUCCESS' ? 'bg-[#008080]/10 text-[#008080] border border-[#008080]/20' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
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