import SignupForm from '../../components/auth/SignupForm';

function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">회원가입</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            CarePilot 계정을 만드세요
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  );
}

export default SignupPage;

