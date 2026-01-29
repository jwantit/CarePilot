import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginAsync,
  logoutAsync,
  signupOrganizationAsync,
  signupUserAsync,
  signupUserOAuth2Async,
  approveUserAsync,
  clearError,
} from '../store/slices/authSlice';
import toast from 'react-hot-toast';

/**
 * 인증 관련 커스텀 훅
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error, isInitialized } = useSelector(
    (state) => state.auth
  );

  /**
   * 로그인
   */
  const login = async (credentials) => {
    if (!credentials.email || !credentials.password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return { success: false };
    }

    try {
      const result = await dispatch(loginAsync(credentials)).unwrap();
      
      if (result.user) {
        toast.success('로그인 성공');
        navigate('/');
        return { success: true, user: result.user };
      }
      
      return { success: false };
    } catch (err) {
      // authSlice는 { message, code, status } 형태로 반환
      const errorMessage = err?.message || '로그인에 실패했습니다.';
      toast.error(errorMessage);
      return { success: false, error: err };
    }
  };

  /**
   * 로그아웃
   */
  const logout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      toast.success('로그아웃되었습니다.');
      navigate('/login');
    } catch (err) {
      console.error('로그아웃 실패:', err);
      // 실패해도 로그인 페이지로 이동
      navigate('/login');
    }
  };

  /**
   * 업체 회원가입
   */
  const signupOrganization = async (data) => {
    if (!data.organizationName || !data.email || !data.password || !data.name) {
      toast.error('모든 필드를 입력해주세요.');
      return null;
    }

    try {
      const result = await dispatch(signupOrganizationAsync(data)).unwrap();
      toast.success(`회원가입이 완료되었습니다. 업체 번호: ${result.organizationNumber}`);
      navigate('/login');
      return result;
    } catch (err) {
      console.error('업체 회원가입 실패:', err);
      const errorMessage = err?.message || '회원가입에 실패했습니다.';
      toast.error(errorMessage);
      return null;
    }
  };

  /**
   * 직원 회원가입
   */
  const signupUser = async (data) => {
    if (!data.organizationNumber || !data.email || !data.password || !data.name) {
      toast.error('모든 필드를 입력해주세요.');
      return null;
    }

    try {
      const result = await dispatch(signupUserAsync(data)).unwrap();
      toast.success(result.message || '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
      navigate('/login');
      return result;
    } catch (err) {
      console.error('직원 회원가입 실패:', err);
      const errorMessage = err?.message || '회원가입에 실패했습니다.';
      toast.error(errorMessage);
      return null;
    }
  };

  /**
   * USER 소셜 회원가입
   */
  const signupUserOAuth2 = async (data) => {
    if (!data.email || !data.name || !data.organizationNumber) {
      toast.error('모든 필드를 입력해주세요.');
      return null;
    }

    try {
      const result = await dispatch(signupUserOAuth2Async(data)).unwrap();
      
      // 회원가입 성공 (승인 대기 상태)
      if (result.status === 'WAITING' || result.message?.includes('승인')) {
        toast.success('회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
        navigate('/login');
        return result;
      } else if (result.requiresAdditionalInfo) {
        toast.error(result.message || '추가 정보가 필요합니다.');
        return result;
      } else {
        toast.error(result.message || '회원가입에 실패했습니다.');
        return null;
      }
    } catch (err) {
      console.error('USER 소셜 회원가입 실패:', err);
      const errorMessage = err?.message || '회원가입에 실패했습니다.';
      toast.error(errorMessage);
      return null;
    }
  };

  /**
   * 사용자 승인
   */
  const approveUser = async (token) => {
    if (!token) {
      toast.error('승인 토큰이 없습니다.');
      return null;
    }

    try {
      const result = await dispatch(approveUserAsync(token)).unwrap();
      toast.success(result.message || '승인이 완료되었습니다.');
      return result;
    } catch (err) {
      console.error('승인 실패:', err);
      return null;
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    isInitialized,
    login,
    logout,
    signupOrganization,
    signupUser,
    signupUserOAuth2,
    approveUser,
    clearError: () => dispatch(clearError()),
  };
};

