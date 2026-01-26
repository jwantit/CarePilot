import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import { isAccessTokenValid, getUserFromToken, getRefreshToken } from '../utils/authTokenUtils';
import { restoreAuth } from '../store/slices/authSlice';
import { refreshAccessToken } from '../utils/tokenRefreshUtils';

/**
 * 로그인이 필요한 라우트 보호 컴포넌트
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 */
function RequireLoginRoute() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const hasTriedRefresh = useRef(false);
  
  // 초기 상태 확인
  const tokenValid = isAccessTokenValid();
  const refreshToken = getRefreshToken();
  
  // Access Token이 없지만 Refresh Token이 있으면 갱신 시도
  useEffect(() => {
    const tryRefresh = async () => {
      // useEffect 내부에서 매번 최신 값 읽기
      const currentTokenValid = isAccessTokenValid();
      const currentUser = getUserFromToken();
      const currentRefreshToken = getRefreshToken();
      
      // 이미 시도했거나 갱신 중이면 스킵
      if (hasTriedRefresh.current || isRefreshing) {
        return;
      }
      
      // Access Token이 없지만 Refresh Token이 있으면 갱신 시도
      if (!currentTokenValid && currentRefreshToken) {
        hasTriedRefresh.current = true;
        setIsRefreshing(true);
        setRefreshAttempted(false);
        try {
          console.log('Access Token이 없지만 Refresh Token이 있음. 토큰 갱신 시도...');
          await refreshAccessToken();
          dispatch(restoreAuth());
          setRefreshAttempted(true); // 시도 완료 플래그 설정 → 리렌더링 트리거
          console.log('토큰 갱신 및 인증 상태 복원 완료');
        } catch (error) {
          console.error('토큰 갱신 실패:', error);
          setRefreshAttempted(true); // 실패해도 시도 완료로 표시
        } finally {
          setIsRefreshing(false);
        }
      } else if (currentTokenValid && currentUser && !isAuthenticated) {
        dispatch(restoreAuth());
      }
    };
    
    tryRefresh();
  }, [dispatch]);
  
  // 갱신 중이면 대기
  if (isRefreshing) {
    return <div>로딩 중...</div>;
  }
  
  // Refresh Token이 있는데 아직 갱신을 시도하지 않았으면 대기
  // (초기 렌더링 시 useEffect가 실행되기 전에 리다이렉트되는 것을 방지)
  if (!tokenValid && refreshToken && !refreshAttempted) {
    return <div>로딩 중...</div>;
  }
  
  // 토큰이 유효하면 일단 통과 (리렌더링 후 최신 값으로 체크)
  const currentTokenValid = isAccessTokenValid();
  const currentUser = getUserFromToken();
  
  // 토큰이 유효하지 않으면 로그인 페이지로
  if (!currentTokenValid || !currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

export default RequireLoginRoute;

