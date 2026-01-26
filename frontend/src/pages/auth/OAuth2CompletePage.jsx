import OAuth2CompleteForm from '../../components/auth/OAuth2CompleteForm';

function OAuth2CompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">회원가입 완료</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            추가 정보를 입력해주세요
          </p>
        </div>

        <OAuth2CompleteForm />
      </div>
    </div>
  );
}

export default OAuth2CompletePage;

