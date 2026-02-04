import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * 브레드크럼 네비게이션 컴포넌트
 * @param {Object} props
 * @param {string|Array} props.items - 브레드크럼 항목들
 *   - 문자열: "대시보드 > 케어 대상자 관리" 형식
 *   - 배열: ["케어 대상자 관리", "상세 정보"] 형식
 * @param {boolean} props.showHome - 홈 아이콘 표시 여부 (기본값: true)
 */
function Breadcrumb({ items = [], showHome = true }) {
  // items가 문자열이면 배열로 변환
  const breadcrumbArray = typeof items === 'string' 
    ? items.split(' > ').filter(item => item.trim())
    : Array.isArray(items) 
    ? items.filter(item => item && item.trim())
    : [];

  // 빈 배열이면 렌더링하지 않음
  if (breadcrumbArray.length === 0) {
    return null;
  }

  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-slate-400" aria-label="Breadcrumb">
      {/* 홈 아이콘 */}
      {showHome && (
        <>
          <Link 
            to="/" 
            className="flex items-center gap-1 hover:text-teal-400 transition-colors"
            title="대시보드로 이동"
          >
            <Home size={14} />
            <span>대시보드</span>
          </Link>
          {breadcrumbArray.length > 0 && (
            <ChevronRight size={14} className="text-slate-600" />
          )}
        </>
      )}

      {/* 브레드크럼 항목들 */}
      {breadcrumbArray.map((item, index) => {
        const isLast = index === breadcrumbArray.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast ? (
              <span className="text-slate-300 font-semibold" aria-current="page">
                {item}
              </span>
            ) : (
              <span className="text-slate-400 hover:text-teal-400 transition-colors cursor-default">
                {item}
              </span>
            )}
            {!isLast && (
              <ChevronRight size={14} className="text-slate-600" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;