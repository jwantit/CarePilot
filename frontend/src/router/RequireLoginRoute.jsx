import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAccessTokenValid, getUserFromToken } from '../utils/authTokenUtils';

/**
 * 로그인이 필요한 라우트 보호 컴포넌트
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 */
function RequireLoginRoute() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Redux 상태와 토큰 유효성 모두 확인
  const tokenValid = isAccessTokenValid();
  const user = getUserFromToken();
  
  // 인증되지 않았거나 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !tokenValid || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // 인증된 경우 Outlet 렌더링 (Layout은 children에서 처리)
  return <Outlet />;
}

export default RequireLoginRoute;

