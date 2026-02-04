import React from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GroupRow = ({ data }) => {
  const navigate = useNavigate();
  const isActive = data.groupStatus === 'ACTIVE' || data.groupStatus === '활성';
  
  const careList = data.careList || [];
  const displayPatients = careList.slice(0, 3);
  const remainingCount = careList.length - 3;

  const tealColor = '#008080';
  const lightTealBg = '#f0f9f9';

  return (
    <div className="bg-slate-800 border border-slate-700 shadow-sm p-4 hover:shadow-md transition-all flex flex-col rounded-sm">
      <div className="flex justify-between items-start mb-2">
        <span 
          className="inline-flex w-fit px-2 py-0.5 text-xs font-semibold border text-left"
          style={{ 
            backgroundColor: 'rgba(0, 128, 128, 0.1)', 
            color: '#14b8a6', 
            borderColor: 'rgba(0, 128, 128, 0.3)' 
          }}
        >
          {data.scenarioName || '시나리오 없음'}
        </span>
        <button 
          onClick={() => navigate(`/care-target-group/detail/${data.groupId}`)}
          className="px-3 py-1 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 text-xs font-semibold transition-all border border-teal-500/50 hover:border-teal-500 flex items-center gap-1 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
        >
          <span className="font-mono text-teal-400">&gt;</span>
          <span>상세보기</span>
        </button>
      </div>

      <h3 className="text-base font-bold text-slate-200 leading-tight mb-1 text-left">
        {data.groupName}
      </h3>
      <p className="text-sm text-slate-400 mb-3 leading-relaxed text-left">
        {data.groupDescription || '그룹에 대한 상세 설명이 등록되지 않았습니다.'}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-700/50 p-3 flex flex-col gap-1 text-left">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users size={14} style={{ color: '#14b8a6' }} />
            <span className="text-xs font-semibold">환자 수</span>
          </div>
          <span className="text-base font-bold text-slate-200">{data.careTargetCount}명</span>
        </div>
        <div className="bg-slate-700/50 p-3 flex flex-col gap-1 text-left">
          <span className="text-xs font-semibold text-slate-400">스케줄 상태</span>
          <span className={`text-base font-bold ${isActive ? 'text-[#008080]' : 'text-slate-500'}`}>
            {isActive ? '활성' : '비활성'}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-slate-500">그룹 멤버</p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {careList.length > 0 ? (
            <>
              {displayPatients.map((target, idx) => (
                <span key={idx} 
                      className="px-2 py-0.5 bg-slate-900 border border-slate-600 text-xs font-semibold text-slate-300">
                  {target.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs font-semibold border border-slate-600">
                  +{remainingCount}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-500 italic">등록된 환자가 없습니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupRow;