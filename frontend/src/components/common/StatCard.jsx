import React from 'react';

/**
 * 통계 카드 컴포넌트
 * @param {Object} props
 * @param {number|string} props.value - 표시할 숫자 값
 * @param {string} props.label - 카드 레이블
 * @param {React.ComponentType} props.icon - 아이콘 컴포넌트
 * @param {string} props.iconColor - 아이콘 색상 클래스 (기본값: "text-teal-400")
 * @param {string} props.valueColor - 숫자 색상 클래스 (기본값: "text-cp-text")
 * @param {string} props.hoverBorderColor - 호버 시 테두리 색상 클래스 (기본값: "hover:border-teal-500/50")
 */
function StatCard({ 
  value, 
  label, 
  icon: Icon, 
  iconColor = "text-teal-400",
  valueColor = "text-cp-text",
  hoverBorderColor = "hover:border-teal-500/50",
  className = ""
}) {
  if (!Icon) {
    return null;
  }

  // 기본 다크 스타일 또는 커스텀 클래스 사용
  const baseStyles = className || "bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border shadow-lg hover:shadow-black/20";

  return (
    <div className={`${baseStyles} rounded-xl p-4 ${hoverBorderColor} transition-all group hover:shadow-xl hover:-translate-y-0.5`}>
      <div className="flex items-center gap-4">
        {/* 아이콘 영역 */}
        <div className={`p-3 rounded-2xl transition-shadow ${className ? 'bg-cp-bg/50 border border-cp-border/50' : 'bg-cp-bg/50 border border-cp-border/50 shadow-md group-hover:shadow-lg'}`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
        
        {/* 텍스트 영역 (라벨 + 숫자) - 한 라인 배치 */}
        <div className="flex flex-1 items-center justify-between">
          <p className={`text-lg font-bold tracking-tight ${className ? 'text-cp-muted' : 'text-cp-text'}`}>
            {label}
          </p>
          <span className={`text-4xl font-black ${valueColor} drop-shadow-sm`}>
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
