import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle2 } from 'lucide-react';
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

  const inputClass = "block w-full px-4 py-3 bg-cp-input text-cp-text placeholder:text-cp-muted border border-cp-border rounded-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-inner text-base";
  const labelClass = "block text-[13px] font-black text-cp-muted uppercase tracking-widest mb-2 ml-1";

  // 카카오 정보가 없으면 로그인 페이지로 리다이렉트
  if (!email || !name) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400 mb-4 font-bold text-lg">카카오 로그인 정보가 없습니다.</p>
        <button
          onClick={() => navigate('/login')}
          className="text-teal-400 hover:text-teal-300 font-black text-base underline underline-offset-4 decoration-2 decoration-teal-500/30 transition-colors"
        >
          로그인 페이지로 이동
        </button>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-5">
        {/* 카카오에서 가져온 정보 표시 (읽기 전용) */}
        <div className="bg-cp-bg/50 p-5 rounded-sm border border-cp-border shadow-inner">
          <p className="text-[11px] font-black text-cp-muted uppercase tracking-widest mb-4">Kakao Account Info</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-cp-muted">이메일</span>
              <span className="text-base font-medium text-cp-text">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-cp-muted">이름</span>
              <span className="text-base font-medium text-cp-text">{name}</span>
            </div>
          </div>
        </div>

        {/* 비밀번호 설정 */}
        <div>
          <label htmlFor="password" class={labelClass}>
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className={inputClass}
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="passwordConfirm" class={labelClass}>
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
            value={formData.passwordConfirm}
            onChange={handleChange}
            className={inputClass}
            placeholder="비밀번호를 다시 입력하세요"
          />
        </div>

        {/* 업체 번호 입력 */}
        <div>
          <label htmlFor="organizationNumber" class={labelClass}>
            업체 번호 <span className="text-red-500">*</span>
          </label>
          <input
            id="organizationNumber"
            name="organizationNumber"
            type="text"
            required
            value={formData.organizationNumber}
            onChange={handleChange}
            className={inputClass}
            placeholder="ABC-12345"
          />
          <p className="mt-2 ml-1 text-[10px] text-cp-muted font-bold">
            * 관리자 승인 후 서비스 이용이 가능합니다
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-black text-xl hover:from-teal-500 hover:to-teal-600 transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            '처리 중...'
          ) : (
            <>
              <CheckCircle2 size={24} />
              회원가입 완료
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-base text-cp-muted font-medium">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-teal-400 hover:text-teal-300 font-black underline underline-offset-4 decoration-2 decoration-teal-500/30 transition-colors"
            >
              로그인으로 돌아가기
            </button>
          </p>
        </div>
      </div>
    </form>
  );
}

export default OAuth2CompleteForm;
