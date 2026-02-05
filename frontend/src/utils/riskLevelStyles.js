// 위험도 라벨 및 스타일 공통 유틸리티

// 위험도 레벨 한글 라벨 매핑
const RISK_LEVEL_LABEL = {
  CRITICAL: "긴급",
  URGENT: "긴급",    // 우선순위에서 사용되는 URGENT도 긴급으로 처리
  HIGH: "위험",
  MEDIUM: "보통",
  NORMAL: "보통",    // 일부 컴포넌트에서 NORMAL 사용
  LOW: "낮음",
};

// 위험도 레벨별 그라데이션 스타일 (다크 테마)
const RISK_LEVEL_STYLE = {
  CRITICAL: "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50 shadow-md",
  URGENT: "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50 shadow-md",
  HIGH: "bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 border border-orange-500/50 shadow-md",
  MEDIUM: "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50 shadow-md",
  NORMAL: "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50 shadow-md",
  LOW: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50 shadow-md",
};

// 알림 심각도별 스타일 (NotificationTable, NotificationPage용)
const SEVERITY_STYLE = {
  CRITICAL: { label: "긴급", color: "bg-red-500/20 text-red-400 border-red-500/50" },
  HIGH: { label: "위험", color: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
  MEDIUM: { label: "보통", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  LOW: { label: "낮음", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" },
};

/**
 * 위험도 레벨을 한글 라벨로 변환
 * @param {string} level - 위험도 레벨 (CRITICAL, HIGH, MEDIUM, LOW, NORMAL, URGENT)
 * @returns {string} 한글 라벨 (긴급, 위험, 보통, 낮음)
 */
export const getRiskLevelLabel = (level) => {
  return RISK_LEVEL_LABEL[level] ?? level;
};

/**
 * 위험도 레벨에 따른 그라데이션 스타일 클래스 반환
 * @param {string} level - 위험도 레벨
 * @returns {string} Tailwind CSS 클래스 문자열
 */
export const getRiskLevelStyle = (level) => {
  return RISK_LEVEL_STYLE[level] ?? RISK_LEVEL_STYLE.LOW;
};

/**
 * 알림 심각도 배지 정보 반환 (NotificationTable, NotificationPage용)
 * @param {string} severity - 심각도 레벨
 * @returns {object} { label: string, color: string }
 */
export const getSeverityBadge = (severity) => {
  return SEVERITY_STYLE[severity] ?? { label: severity || "-", color: "bg-slate-600/50 text-slate-300 border-slate-500" };
};

/**
 * 위험도 레벨 키 목록을 한글 라벨 배열로 변환 (차트용)
 * @param {string[]} keys - 위험도 레벨 키 배열
 * @returns {string[]} 한글 라벨 배열
 */
export const mapRiskLevelKeysToLabels = (keys) => {
  return keys.map(key => getRiskLevelLabel(key));
};

// 상수 export (필요한 경우 직접 사용)
export { RISK_LEVEL_LABEL, RISK_LEVEL_STYLE, SEVERITY_STYLE };