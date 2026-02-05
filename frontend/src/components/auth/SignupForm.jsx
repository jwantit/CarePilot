import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Building, Hash, Mail, Lock, User, Phone, CheckCircle2, UserPlus, ArrowLeft } from 'lucide-react';

function SignupForm() {
  const navigate = useNavigate();
  const { signupOrganization, signupUser, loading, error } = useAuth();

  const [signupType, setSignupType] = useState('organization'); // 'organization' or 'user'
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationNumber: '',
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  /** 전화번호를 010-XXXX-XXXX 형식으로 포맷 (숫자만 허용, 최대 11자리) */
  const formatPhoneDisplay = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData({ ...formData, [name]: formatPhoneDisplay(value) });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (signupType === 'organization') {
      await signupOrganization({
        organizationName: formData.organizationName,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
      });
    } else {
      await signupUser({
        organizationNumber: formData.organizationNumber,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
      });
    }
  };

  const inputClass = "block w-full px-4 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 placeholder:text-slate-600 border border-slate-600 rounded-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-inner text-sm";
  const labelClass = "flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      {/* 회원가입 타입 선택 */}
      <div className="flex p-1 bg-slate-950/50 border border-slate-700 rounded-sm">
        <button
          type="button"
          onClick={() => setSignupType('organization')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-bold transition-all ${
            signupType === 'organization'
              ? 'bg-slate-800 text-teal-400 shadow-md border border-slate-600'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Building size={16} />
          업체 등록
        </button>
        <button
          type="button"
          onClick={() => setSignupType('user')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-bold transition-all ${
            signupType === 'user'
              ? 'bg-slate-800 text-teal-400 shadow-md border border-slate-600'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <UserPlus size={16} />
          직원 가입
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          {signupType === 'organization' ? (
            <div>
              <label htmlFor="organizationName" className={labelClass}>
                <Building size={14} className="text-teal-500/70" />
                업체 이름
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                value={formData.organizationName}
                onChange={handleChange}
                className={inputClass}
                placeholder="정확한 업체명을 입력하세요"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="organizationNumber" className={labelClass}>
                <Hash size={14} className="text-teal-500/70" />
                업체 식별 번호
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
              <p className="mt-1.5 text-[10px] text-slate-500 font-medium ml-1">
                관리자로부터 전달받은 식별 코드를 입력하세요
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="email" className={labelClass}>
                <Mail size={14} className="text-teal-500/70" />
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
                <Lock size={14} className="text-teal-500/70" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className={labelClass}>
                <User size={14} className="text-teal-500/70" />
                성함
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="본명을 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                <Phone size={14} className="text-teal-500/70" />
                전화번호
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                maxLength={13}
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="010-0000-0000"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-sm text-xs font-bold text-center">
            {typeof error === 'string' ? error : error?.message || '입력 정보를 다시 확인해주세요.'}
          </div>
        )}

        <div className="pt-2">
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
                회원가입 완료하기
              </>
            )}
          </button>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="group inline-flex items-center gap-2 text-sm text-slate-500 font-medium hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            이미 계정이 있으신가요? <span className="text-teal-400 font-black underline underline-offset-4 decoration-2 decoration-teal-500/30">로그인하기</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SignupForm;

