import { useWebSocket } from '../../hooks/useWebSocket';
import toast from 'react-hot-toast';

function NotificationPage() {
  const handleMessage = (message) => {
    toast.success(message.text || '알림이 도착했습니다!');
  };

  const { sendMessage } = useWebSocket(handleMessage);

  const handleSendNotification = () => {
    sendMessage({
      text: '테스트 알림입니다!',
      type: 'info',
    });
    toast.success('알림이 전송되었습니다!');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">알림</h1>
      <button
        onClick={handleSendNotification}
        className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
      >
        알림 전송
      </button>
    </div>
  );
}

export default NotificationPage;