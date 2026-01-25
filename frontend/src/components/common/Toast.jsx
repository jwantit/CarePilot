import { Toaster } from 'react-hot-toast';

function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#333',
          fontFamily: 'Pretendard, sans-serif',
        },
        success: {
          iconTheme: {
            primary: '#14B8A6',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
          },
        },
      }}
    />
  );
}

export default Toast;