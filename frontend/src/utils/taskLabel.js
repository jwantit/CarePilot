// Task (할 일 목록) / AITask (AI 처리 내역) 전용 라벨·색상 매핑

// ----- Task (통합: USER + AI) -----
const TASK_STATUS_LABEL = {
  WAITING: '대기',
  PROGRESS: '진행중',
  DONE: '완료',
  SUCCESS: '성공',
  FAILED: '실패',
};

const TASK_STATUS_COLOR = {
  WAITING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  PROGRESS: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
  DONE: 'bg-cp-bg/50 text-cp-muted border border-cp-border/50',
  SUCCESS: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
  FAILED: 'bg-red-500/20 text-red-400 border border-red-500/50',
};

const PRIORITY_LABEL = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

const PRIORITY_COLOR = {
  LOW: 'bg-cp-bg/50 text-cp-muted border border-cp-border/50',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/50',
  URGENT: 'bg-red-500/20 text-red-400 border border-red-500/50',
};

const TASK_TYPE_LABEL = {
  RISK_FOLLOWUP: '위험 후속조치',
  CARE: '케어 관리',
  NORMAL: '일반 업무',
  OTHER: '기타',
  CALL_INIT: '전화 발신',
  SCHEDULE_CHANGE: '스케줄 변경',
  RISK_ALERT: '위험 알림 생성',
  AUTOMATION: '자동화 업무',
};

const TASK_SOURCE_TYPE_LABEL = {
  AI: 'AI',
  USER: '사용자',
};

export const getTaskStatusLabel = (status) => TASK_STATUS_LABEL[status] ?? status;
export const getTaskStatusColor = (status) => TASK_STATUS_COLOR[status] ?? 'bg-cp-bg/50 text-cp-muted border border-cp-border/50';
export const getPriorityLabel = (priority) => PRIORITY_LABEL[priority] ?? priority;
export const getPriorityColor = (priority) => PRIORITY_COLOR[priority] ?? 'bg-cp-bg/50 text-cp-muted border border-cp-border/50';
export const getTaskTypeLabel = (type) => TASK_TYPE_LABEL[type] ?? type;
export const getTaskSourceTypeLabel = (sourceType) => TASK_SOURCE_TYPE_LABEL[sourceType] ?? sourceType;

// AI 작업용 별칭 (통합 TaskType/Status 사용)
export const getAITaskStatusLabel = (status) => TASK_STATUS_LABEL[status] ?? status;
export const getAITaskStatusColor = (status) => TASK_STATUS_COLOR[status] ?? 'bg-cp-bg/50 text-cp-muted border border-cp-border/50';
export const getAITaskTypeLabel = (type) => TASK_TYPE_LABEL[type] ?? type;

// 필터 드롭다운용 옵션 (전체 + 각 enum 값)
export const TASK_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  ...Object.entries(TASK_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];
export const PRIORITY_OPTIONS = [
  { value: '', label: '전체' },
  ...Object.entries(PRIORITY_LABEL).map(([value, label]) => ({ value, label })),
];
export const TASK_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  ...Object.entries(TASK_TYPE_LABEL).map(([value, label]) => ({ value, label })),
];
export const AI_TASK_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'WAITING', label: '대기' },
  { value: 'SUCCESS', label: '성공' },
  { value: 'FAILED', label: '실패' },
];
export const AI_TASK_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'CALL_INIT', label: '전화 발신' },
  { value: 'SCHEDULE_CHANGE', label: '스케줄 변경' },
  { value: 'RISK_ALERT', label: '위험 알림 생성' },
  { value: 'AUTOMATION', label: '자동화 업무' },
  { value: 'OTHER', label: '기타' },
];
