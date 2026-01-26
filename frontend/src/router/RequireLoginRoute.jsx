import { Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { initializeAuthAsync } from "../store/slices/authSlice";
import Loading from "../components/common/Loading";

/**
 * 로그인이 필요한 라우트 보호 컴포넌트
 * 쿠키 기반 인증: /auth/me API 호출로 사용자 정보 조회
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 */
function RequireLoginRoute() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isInitialized, loading } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    // 앱이 초기화되지 않았고, 로딩 중이 아닐 때만 확인
    if (!isInitialized && !loading) {
      dispatch(initializeAuthAsync());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // dispatch는 안정적이므로 의존성에서 제외

  // 초기화 중이면 대기
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않았으면 로그인 페이지로
  if (!isAuthenticated || !user) {
    console.log('[RequireLoginRoute] 인증 실패 - 로그인 페이지로 리다이렉트');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default RequireLoginRoute;
