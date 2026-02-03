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
    navigateToCall: () => navigate('/call'),

    // 케어 대상자 관련
    navigateToCareTarget: () => navigate('/care-target'),
    
    // 작업 관련
    navigateToTask: () => navigate('/task'),
    
    // 알림 관련
    navigateToNotification: () => navigate('/notification'),
  };
};