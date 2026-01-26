import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function ApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { approveUser, error } = useAuth();

  const [approvalStatus, setApprovalStatus] = useState('pending'); // 'pending', 'success', 'error'

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setApprovalStatus('error');
      return;
    }

    const handleApproval = async () => {
      const result = await approveUser(token);
      
      if (result) {
        setApprovalStatus('success');
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setApprovalStatus('error');
      }
    };

    handleApproval();
  }, [searchParams, approveUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        {approvalStatus === 'pending' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900">승인 처리 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </>
        )}

        {approvalStatus === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
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
            <h2 className="text-2xl font-bold text-gray-900">승인 완료</h2>
            <p className="text-gray-600">승인이 완료되었습니다. 이제 로그인할 수 있습니다.</p>
            <p className="text-sm text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
          </>
        )}

        {approvalStatus === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
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
            <h2 className="text-2xl font-bold text-gray-900">승인 실패</h2>
            <p className="text-gray-600">
              {error || '승인 토큰이 유효하지 않거나 만료되었습니다.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              로그인 페이지로 이동
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ApprovalPage;

