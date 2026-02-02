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
  WAITING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  PROGRESS: 'bg-blue-100 text-blue-700 border-blue-300',
  DONE: 'bg-gray-100 text-gray-700 border-gray-300',
  SUCCESS: 'bg-green-100 text-green-700 border-green-300',
  FAILED: 'bg-red-100 text-red-700 border-red-300',
};

const PRIORITY_LABEL = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

const PRIORITY_COLOR = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  URGENT: 'bg-red-100 text-red-700 border-red-300',
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
export const getTaskStatusColor = (status) => TASK_STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-700 border-gray-300';
export const getPriorityLabel = (priority) => PRIORITY_LABEL[priority] ?? priority;
export const getPriorityColor = (priority) => PRIORITY_COLOR[priority] ?? 'bg-gray-100 text-gray-700 border-gray-300';
export const getTaskTypeLabel = (type) => TASK_TYPE_LABEL[type] ?? type;
export const getTaskSourceTypeLabel = (sourceType) => TASK_SOURCE_TYPE_LABEL[sourceType] ?? sourceType;

// AI 작업용 별칭 (통합 TaskType/Status 사용)
export const getAITaskStatusLabel = (status) => TASK_STATUS_LABEL[status] ?? status;
export const getAITaskStatusColor = (status) => TASK_STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-700 border-gray-300';
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
