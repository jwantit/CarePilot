import React from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GroupRow = ({ data }) => {
  const navigate = useNavigate();
  const isActive = data.groupStatus === 'ACTIVE' || data.groupStatus === '활성';
  
  const careList = data.careList || [];
  const displayPatients = careList.slice(0, 3);
  const remainingCount = careList.length - 3;

  return (
    <div 
      className="bg-cp-card border border-cp-border shadow-sm p-4 hover:shadow-md transition-all flex flex-col rounded-sm cursor-pointer"
      onClick={() => navigate(`/care-target-group/detail/${data.groupId}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <span 
          className="inline-flex w-fit px-2 py-0.5 text-xs font-semibold border text-left bg-teal-500/10 text-teal-400 border-teal-500/30"
        >
          {data.scenarioName || '시나리오 없음'}
        </span>
        <button 
          onClick={() => navigate(`/care-target-group/detail/${data.groupId}`)}
          className="px-3 py-1 bg-cp-input hover:bg-cp-bg text-teal-400 text-xs font-semibold transition-all border border-teal-500/50 hover:border-teal-500 flex items-center gap-1 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
        >
          <span className="font-mono text-teal-400">&gt;</span>
          <span>상세보기</span>
        </button>
      </div>

      <h3 className="text-base font-bold text-cp-text leading-tight mb-1 text-left">
        {data.groupName}
      </h3>
      <p className="text-sm text-cp-muted mb-3 leading-relaxed text-left">
        {data.groupDescription || '그룹에 대한 상세 설명이 등록되지 않았습니다.'}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-cp-input/50 p-3 flex flex-col gap-1 text-left">
          <div className="flex items-center gap-1.5 text-cp-muted">
            <Users size={14} className="text-teal-400" />
            <span className="text-xs font-semibold">환자 수</span>
          </div>
          <span className="text-base font-bold text-cp-text">{data.careTargetCount}명</span>
        </div>
        <div className="bg-cp-input/50 p-3 flex flex-col gap-1 text-left">
          <span className="text-xs font-semibold text-cp-muted">스케줄 상태</span>
          <span className={`text-base font-bold ${isActive ? 'text-teal-500' : 'text-cp-muted'}`}>
            {isActive ? '활성' : '비활성'}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-cp-border">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-cp-muted">그룹 멤버</p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {careList.length > 0 ? (
            <>
              {displayPatients.map((target, idx) => (
                <span key={idx} 
                      className="px-2 py-0.5 bg-cp-input border border-cp-border text-xs font-semibold text-cp-text">
                  {target.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="px-2 py-0.5 bg-cp-bg text-cp-muted text-xs font-semibold border border-cp-border">
                  +{remainingCount}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-cp-muted italic">등록된 환자가 없습니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupRow;
