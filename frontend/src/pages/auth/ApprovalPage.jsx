import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
    <div className="min-h-screen flex items-center justify-center bg-cp-bg">
      <div className="max-w-md w-full space-y-8 p-8 bg-cp-card border border-cp-border rounded-sm shadow-xl text-center">
        {approvalStatus === 'pending' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <h2 className="text-2xl font-bold text-cp-text">승인 처리 중...</h2>
            <p className="text-cp-muted">잠시만 기다려주세요.</p>
          </>
        )}

        {approvalStatus === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-500/10">
              <svg
                className="h-6 w-6 text-teal-400"
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
            <h2 className="text-2xl font-bold text-cp-text">승인 완료</h2>
            <p className="text-cp-muted">승인이 완료되었습니다.</p>
            <p className="text-sm text-cp-muted/60 mt-2">잠시 후 홈페이지로 이동합니다...</p>
          </>
        )}

        {approvalStatus === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10">
              <svg
                className="h-6 w-6 text-red-400"
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
            <h2 className="text-2xl font-bold text-cp-text">승인 실패</h2>
            <p className="text-cp-muted">
              {searchParams.get('error') || '승인 토큰이 유효하지 않거나 만료되었습니다.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full py-3 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              홈페이지로 이동
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ApprovalPage;
