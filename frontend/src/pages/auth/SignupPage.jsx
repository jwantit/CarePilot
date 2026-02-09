import SignupForm from '../../components/auth/SignupForm';
import ThemeToggle from '../../components/common/ThemeToggle';

function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cp-bg py-16 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle className="bg-cp-card border border-cp-border shadow-md" />
      </div>
      <div className="max-w-lg w-full bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20 mb-2">
              <img src="/logo.png" alt="CarePilot" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-black text-cp-text tracking-tight uppercase">
              Join <span className="text-teal-400">CarePilot</span>
            </h2>
            <p className="text-cp-muted text-sm font-medium">
              더 효율적인 케어 관리를 위해 계정을 만드세요
            </p>
          </div>

          <SignupForm />
        </div>
      </div>
    </div>
  );
}

export default SignupPage;

