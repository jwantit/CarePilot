import { useNavigate } from 'react-router-dom';

/**
 * 네비게이션 관련 커스텀 훅
 * 페이지 이동 로직을 중앙에서 관리하고 재사용 가능하게 만듭니다.
 * 
 * @returns {Object} 네비게이션 함수들
 */
export const useNavigation = () => {
  const navigate = useNavigate();

  return {
    // 통화 관련
    navigateToCall: (dateFilter) => {
      if (dateFilter) {
        navigate(`/call?dateFrom=${dateFilter}&dateTo=${dateFilter}`);
      } else {
        navigate('/call');
      }
    },
    navigateToCallSchedule: () => navigate('/call?tab=schedule'),

    // 케어 대상자 관련
    navigateToCareTarget: () => navigate('/care-target'),
    navigateToCareTargetDetail: (targetId) => navigate(`/care-target/detail/${targetId}`),
    
    // 작업 관련
    navigateToTask: (statusFilter) => {
      if (statusFilter) {
        navigate(`/task?filterStatus=${statusFilter}`);
      } else {
        navigate('/task');
      }
    },  // 작업 필터 로직
    
    // 알림 관련
    navigateToNotification: () => navigate('/notification'),
    
    // 공지사항 관련
    navigateToNotice: () => navigate('/notice'),
    navigateToNoticeDetail: (noticeId) => navigate(`/notice/${noticeId}`),
    
    // 케어 그룹 관련
    navigateToCareTargetGroup: () => navigate('/care-target-group'),
  };
};