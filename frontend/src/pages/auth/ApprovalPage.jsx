import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../../components/common/ThemeToggle';

function ApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [approvalStatus, setApprovalStatus] = useState('pending'); // 'pending', 'success', 'error'

  useEffect(() => {
    const errorParam = searchParams.get('error');
    
    // URL에 에러 파라미터가 있으면 에러 상태로 설정
    if (errorParam) {
      setApprovalStatus('error');
      return;
    }
    
    // 에러 파라미터가 없으면 토큰이 없거나 이미 처리된 경우
    // (메일 링크는 백엔드에서 승인 처리 후 홈페이지로 리다이렉트됨)
    setApprovalStatus('error');
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cp-bg py-12 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle className="bg-cp-card border border-cp-border shadow-md" />
      </div>
      <div className="max-w-md w-full bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10 space-y-8 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 mb-2">
              <img src="/logo.png" alt="CarePilot" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-3xl font-black text-cp-text tracking-tight uppercase">
              Care<span className="text-teal-400">Pilot</span>
            </h2>
          </div>

          <div className="space-y-6">
            {approvalStatus === 'pending' && (
              <div className="py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-cp-text">승인 처리 중...</h3>
                <p className="text-cp-muted text-sm font-medium mt-2">잠시만 기다려주세요.</p>
              </div>
            )}

            {approvalStatus === 'success' && (
              <div className="py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
                  <svg
                    className="h-8 w-8 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-cp-text">승인 완료</h3>
                <p className="text-cp-muted text-sm font-medium mt-2">사용자 승인이 성공적으로 완료되었습니다.</p>
                <p className="text-xs text-cp-muted/60 mt-4">잠시 후 로그인 페이지로 이동합니다...</p>
              </div>
            )}

            {approvalStatus === 'error' && (
              <div className="py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                  <svg
                    className="h-8 w-8 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-cp-text">승인 실패</h3>
                <p className="text-red-400 text-sm font-medium mt-2">
                  {searchParams.get('error') || '승인 토큰이 유효하지 않거나 만료되었습니다.'}
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-8 w-full flex justify-center py-3.5 px-4 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-black text-lg hover:from-teal-500 hover:to-teal-600 transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98]"
                >
                  로그인 페이지로 이동
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApprovalPage;
