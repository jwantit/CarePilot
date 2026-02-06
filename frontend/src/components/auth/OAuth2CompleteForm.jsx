import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

function OAuth2CompleteForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signupUserOAuth2, loading } = useAuth();

  // URL 파라미터에서 카카오 인증 후 받은 이메일/이름 가져오기
  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
    organizationNumber: '',
  });

  // 승인 대기 중인 경우
  useEffect(() => {
    if (status === 'WAITING' && message) {
      toast.success(message);
    }
  }, [status, message]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !name) {
      toast.error('카카오 로그인 정보가 없습니다. 다시 시도해주세요.');
      return;
    }

    // 비밀번호 필수 검증
    if (!formData.password || !formData.password.trim()) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!formData.organizationNumber.trim()) {
      toast.error('업체 번호를 입력해주세요.');
      return;
    }

    await signupUserOAuth2({
      email: email,
      name: name,
      password: formData.password,
      organizationNumber: formData.organizationNumber,
    });
    // useAuth의 signupUserOAuth2에서 navigate('/login') 처리
  };

  // 카카오 정보가 없으면 로그인 페이지로 리다이렉트
  if (!email || !name) {
    return (
      <div className="text-center">
        <p className="text-red-400 mb-4">카카오 로그인 정보가 없습니다.</p>
        <button
          onClick={() => navigate('/login')}
          className="text-teal-400 hover:text-teal-300 font-medium"
        >
          로그인 페이지로 이동
        </button>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* 카카오에서 가져온 정보 표시 (읽기 전용) */}
        <div className="bg-cp-input p-4 rounded-sm border border-cp-border">
          <p className="text-sm text-cp-muted mb-2">카카오 계정 정보</p>
          <div className="space-y-1">
            <p className="text-sm text-cp-text">
              <span className="font-medium text-cp-muted">이메일:</span> {email}
            </p>
            <p className="text-sm text-cp-text">
              <span className="font-medium text-cp-muted">이름:</span> {name}
            </p>
          </div>
        </div>

        {/* 비밀번호 설정 */}
        <div>
          <label htmlFor="password" title="비밀번호" className="block text-sm font-medium text-cp-text">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-cp-input border border-cp-border text-cp-text rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 placeholder:text-cp-muted"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="passwordConfirm" title="비밀번호 확인" className="block text-sm font-medium text-cp-text">
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
            value={formData.passwordConfirm}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-cp-input border border-cp-border text-cp-text rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 placeholder:text-cp-muted"
            placeholder="비밀번호를 다시 입력하세요"
          />
        </div>

        {/* 업체 번호 입력 */}
        <div>
          <label htmlFor="organizationNumber" title="업체 번호" className="block text-sm font-medium text-cp-text">
            업체 번호 <span className="text-red-500">*</span>
          </label>
          <input
            id="organizationNumber"
            name="organizationNumber"
            type="text"
            required
            value={formData.organizationNumber}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-cp-input border border-cp-border text-cp-text rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 placeholder:text-cp-muted"
            placeholder="업체 번호를 입력하세요 (예: ABC-12345)"
          />
          <p className="mt-1 text-xs text-cp-muted">
            관리자 승인 후 로그인할 수 있습니다
          </p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || !formData.password.trim() || !formData.passwordConfirm.trim() || !formData.organizationNumber.trim()}
          className="w-full flex justify-center py-3 px-4 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:bg-cp-bg/50 disabled:border-cp-border disabled:text-cp-muted disabled:hover:translate-y-0"
        >
          {loading ? '가입 중...' : '회원가입 완료'}
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-cp-muted">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-teal-400 hover:text-teal-300 font-medium"
          >
            로그인으로 돌아가기
          </button>
        </p>
      </div>
    </form>
  );
}

export default OAuth2CompleteForm;
