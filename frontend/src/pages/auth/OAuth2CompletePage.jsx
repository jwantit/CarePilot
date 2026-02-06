import OAuth2CompleteForm from '../../components/auth/OAuth2CompleteForm';

function OAuth2CompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cp-bg py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-cp-card border border-cp-border rounded-sm shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-center text-cp-text">회원가입 완료</h2>
          <p className="mt-2 text-center text-sm text-cp-muted">
            추가 정보를 입력해주세요
          </p>
        </div>

        <OAuth2CompleteForm />
      </div>
    </div>
  );
}

export default OAuth2CompletePage;
