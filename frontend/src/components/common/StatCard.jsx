import React from 'react';

/**
 * 통계 카드 컴포넌트
 * @param {Object} props
 * @param {number|string} props.value - 표시할 숫자 값
 * @param {string} props.label - 카드 레이블
 * @param {React.ComponentType} props.icon - 아이콘 컴포넌트
 * @param {string} props.iconColor - 아이콘 색상 클래스 (기본값: "text-teal-400")
 * @param {string} props.valueColor - 숫자 색상 클래스 (기본값: "text-slate-100")
 * @param {string} props.hoverBorderColor - 호버 시 테두리 색상 클래스 (기본값: "hover:border-teal-500/50")
 */
function StatCard({ 
  value, 
  label, 
  icon: Icon, 
  iconColor = "text-teal-400",
  valueColor = "text-slate-100",
  hoverBorderColor = "hover:border-teal-500/50"
}) {
  if (!Icon) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-5 ${hoverBorderColor} transition-all group shadow-lg hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 shadow-md group-hover:shadow-lg transition-shadow">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className={`text-2xl font-bold ${valueColor} drop-shadow-sm`}>{value}</span>
      </div>
      <p className="text-xs text-slate-200 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default StatCard;
