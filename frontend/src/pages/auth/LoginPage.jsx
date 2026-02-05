import LoginForm from '../../components/auth/LoginForm';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] py-12 px-4">
      <div className="max-w-md w-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 mb-2">
              <img src="/logo.png" alt="CarePilot" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">
              Care<span className="text-teal-400">Pilot</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              통합 케어 관리 시스템에 로그인하세요
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

