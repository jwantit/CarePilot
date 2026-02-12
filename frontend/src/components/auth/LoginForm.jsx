import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function LoginForm() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
  };

  const inputClass = "block w-full px-4 py-3 bg-cp-input text-cp-text placeholder:text-cp-muted border border-cp-border rounded-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-inner text-base";
  const labelClass = "block text-[13px] font-black text-cp-muted uppercase tracking-widest mb-2 ml-1";

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            이메일 계정
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="example@care.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="h-4 flex items-center justify-center -my-2">
        {error && (
          <p className="text-red-500 text-[13px] font-bold text-center">
            {typeof error === 'string' ? error : error?.message || '로그인 정보를 다시 확인해주세요.'}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3.5 px-4 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-black text-lg hover:from-teal-500 hover:to-teal-600 transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '인증 중...' : '로그인'}
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-cp-border"></div>
          <span className="flex-shrink mx-4 text-cp-muted text-[11px] font-black uppercase tracking-[0.2em]">Social Login</span>
          <div className="flex-grow border-t border-cp-border"></div>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = 'http://localhost:8080/oauth2/authorization/kakao';
          }}
          className="w-full flex justify-center items-center py-3.5 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-black/80 rounded-sm font-black text-base transition-all shadow-md active:scale-[0.98]"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
          </svg>
          카카오로 로그인하기
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-base text-cp-muted font-medium">
          아직 계정이 없으신가요?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-teal-400 hover:text-teal-300 font-black underline underline-offset-4 decoration-2 decoration-teal-500/30 transition-colors"
          >
            회원가입 하기
          </button>
        </p>
      </div>
    </form>
  );
}

export default LoginForm;
