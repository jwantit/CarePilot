import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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

  return (
    <>
      {/* 회원가입 타입 선택 */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setSignupType('organization')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            signupType === 'organization'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          업체 회원가입
        </button>
        <button
          type="button"
          onClick={() => setSignupType('user')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            signupType === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          직원 회원가입
        </button>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {signupType === 'organization' ? (
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                업체명
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                value={formData.organizationName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="업체명을 입력하세요"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="organizationNumber" className="block text-sm font-medium text-gray-700">
                업체 번호
              </label>
              <input
                id="organizationNumber"
                name="organizationNumber"
                type="text"
                required
                value={formData.organizationNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="업체 번호를 입력하세요 (예: ABC-12345)"
              />
              <p className="mt-1 text-xs text-gray-500">
                관리자에게 받은 업체 번호를 입력하세요
              </p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="이름을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="010-1234-5678"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">
            {typeof error === 'string' ? error : error?.message || '회원가입에 실패했습니다.'}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              로그인
            </button>
          </p>
        </div>
      </form>
    </>
  );
}

export default SignupForm;

