import React from 'react';
import { Users } from 'lucide-react';

const GroupRow = ({ data }) => {
  const isActive = data.groupStatus === 'ACTIVE' || data.groupStatus === '활성';
  
  const careList = data.careList || [];
  const displayPatients = careList.slice(0, 3);
  const remainingCount = careList.length - 3;

  // 메인 틸 컬러 변수
  const tealColor = '#008080';
  const lightTealBg = '#f0f9f9';

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden">
      {/* 배경 장식 원 - 틸 톤으로 변경 */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-colors duration-500 opacity-20 group-hover:opacity-40" 
        style={{ backgroundColor: tealColor }}
      />

      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex flex-col gap-2">
          {/* 그룹 타입 배지 */}
          <span 
            className="inline-flex w-fit px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-lg border transition-colors"
            style={{ 
              backgroundColor: lightTealBg, 
              color: tealColor, 
              borderColor: '#cceded' 
            }}
          >
            {data.scenarioName || '시나리오 없음'}
          </span>
          <h3 className="text-xl font-bold text-slate-800 group-hover:text-teal-700 transition-colors leading-tight"
              style={{ '--hover-color': tealColor }}>
            {data.groupName}
          </h3>
        </div>
        <button 
          className="text-xs font-bold text-slate-400 hover:bg-white px-4 py-2 rounded-xl border border-slate-50 transition-all shadow-sm hover:shadow"
          style={{ '--hover-text': tealColor }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = tealColor;
            e.currentTarget.style.borderColor = '#cceded';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '';
            e.currentTarget.style.borderColor = '';
          }}
        >
          상세보기
        </button>
      </div>

      <p className="text-sm text-slate-500 mb-8 line-clamp-2 leading-relaxed min-h-[2.5rem]">
        {data.groupDescription || '그룹에 대한 상세 설명이 등록되지 않았습니다.'}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-slate-50/80 p-4 rounded-2xl flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users size={14} style={{ color: tealColor }} />
            <span className="text-[11px] font-bold uppercase tracking-tighter">환자 수</span>
          </div>
          <span className="text-lg font-black text-slate-700">{data.careTargetCount}명</span>
        </div>
        <div className="bg-slate-50/80 p-4 rounded-2xl flex flex-col gap-1 text-right">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-tighter">스케줄 상태</span>
          <span className={`text-lg font-black ${isActive ? 'text-teal-600' : 'text-slate-300'}`}
                style={{ color: isActive ? tealColor : '' }}>
            {isActive ? '활성' : '비활성'}
          </span>
        </div>
      </div>

      <div className="mt-auto relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Target Members</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {careList.length > 0 ? (
            <>
              {displayPatients.map((target, idx) => (
                <span key={idx} 
                      className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 shadow-sm transition-colors"
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#cceded'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = ''}>
                  {target.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="px-2.5 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-black border border-slate-200 shadow-sm">
                  +{remainingCount}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-300 italic font-medium px-1">등록된 환자가 없습니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupRow;