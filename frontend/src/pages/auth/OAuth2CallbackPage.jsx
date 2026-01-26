import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setTokens, getUserFromToken } from '../../utils/authTokenUtils';
import { setCredentials } from '../../store/slices/authSlice';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // 쿼리 파라미터에서 토큰 및 사용자 정보 추출
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const role = searchParams.get('role');
      const status = searchParams.get('status');

      if (!accessToken || !refreshToken) {
        toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
        navigate('/login');
        return;
      }

      try {
        // 토큰 저장
        setTokens(accessToken, refreshToken);

        // 사용자 정보 추출
        const user = getUserFromToken();
        
        if (!user) {
          toast.error('사용자 정보를 가져올 수 없습니다.');
          navigate('/login');
          return;
        }

        // Redux 상태 업데이트
        dispatch(setCredentials({
          user: user,
          isAuthenticated: true,
        }));

        toast.success('로그인 성공');
        navigate('/');
      } catch (error) {
        console.error('OAuth2 콜백 처리 실패:', error);
        toast.error('로그인 처리 중 오류가 발생했습니다.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loading />
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default OAuth2CallbackPage;

