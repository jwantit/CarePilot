import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { isAccessTokenValid, getUserFromToken } from '../utils/authTokenUtils';
import { restoreAuth } from '../store/slices/authSlice';

/**
 * 로그인이 필요한 라우트 보호 컴포넌트
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 */
function RequireLoginRoute() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // 토큰 유효성 확인
  const tokenValid = isAccessTokenValid();
  const user = getUserFromToken();
  
  // 토큰이 유효한데 Redux 상태가 복원되지 않았으면 복원
  useEffect(() => {
    if (tokenValid && user && !isAuthenticated) {
      dispatch(restoreAuth());
    }
  }, [tokenValid, user, isAuthenticated, dispatch]);
  
  // 토큰이 유효하면 일단 통과 (Redux 상태는 useEffect에서 복원)
  // 토큰이 없거나 유효하지 않으면 로그인 페이지로 리다이렉트
  if (!tokenValid || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // 토큰이 유효한 경우 Outlet 렌더링 (Redux 상태는 복원 중이거나 이미 복원됨)
  return <Outlet />;
}

export default RequireLoginRoute;

