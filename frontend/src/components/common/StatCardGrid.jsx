import React from 'react';
import StatCard from './StatCard';

/**
 * 통계 카드 그리드 컴포넌트
 * @param {Object} props
 * @param {Array} props.cards - 카드 데이터 배열
 *   - value: number|string - 표시할 값
 *   - label: string - 레이블
 *   - icon: React.ComponentType - 아이콘 컴포넌트
 *   - iconColor: string - 아이콘 색상 클래스 (선택)
 *   - valueColor: string - 숫자 색상 클래스 (선택)
 *   - hoverBorderColor: string - 호버 테두리 색상 클래스 (선택)
 * @param {number} props.columns - 그리드 컬럼 수 (선택, 기본값: cards.length, 최대 5)
 * @param {string} props.className - 추가 클래스명 (선택)
 */
function StatCardGrid({ cards = [], columns, className = "" }) {
  // columns가 지정되지 않으면 카드 개수에 따라 자동 설정 (최대 5)
  const gridCols = columns || Math.min(cards.length, 5);
  
  // Tailwind grid 클래스 매핑
  const gridClassMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
  };

  const gridClass = gridClassMap[gridCols] || gridClassMap[5];

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className={`grid ${gridClass} gap-4 mb-8${className ? ` ${className}` : ''}`}>
      {cards.map((card, index) => (
        <StatCard
          key={index}
          value={card.value}
          label={card.label}
          icon={card.icon}
          iconColor={card.iconColor}
          valueColor={card.valueColor}
          hoverBorderColor={card.hoverBorderColor}
        />
      ))}
    </div>
  );
}

export default StatCardGrid;
