import OAuth2CompleteForm from '../../components/auth/OAuth2CompleteForm';
import ThemeToggle from '../../components/common/ThemeToggle';

function OAuth2CompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cp-bg py-12 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle className="bg-cp-card border border-cp-border shadow-md" />
      </div>
      <div className="max-w-md w-full bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 mb-2">
              <img src="/logo.png" alt="CarePilot" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-3xl font-black text-cp-text tracking-tight uppercase">
              Care<span className="text-teal-400">Pilot</span>
            </h2>
            <p className="text-cp-muted text-sm font-medium">
              추가 정보를 입력하여 회원가입을 완료하세요
            </p>
          </div>

          <OAuth2CompleteForm />
        </div>
      </div>
    </div>
  );
}

export default OAuth2CompletePage;
