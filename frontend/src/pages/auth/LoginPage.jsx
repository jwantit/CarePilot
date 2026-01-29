import LoginForm from '../../components/auth/LoginForm';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">로그인</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            CarePilot에 오신 것을 환영합니다
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;

