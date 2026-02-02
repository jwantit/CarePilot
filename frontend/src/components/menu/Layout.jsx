import { Outlet } from 'react-router-dom';
import Menu from './Menu';
import AiChatBot from '../aiChat/AiChatBot';
import SmsChatWidget from '../sms/SmsChatWidget';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Menu />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      {/* 챗봇 아이콘 위에 문자 위젯 배치 (동일 패턴) */}
      <SmsChatWidget />
      <AiChatBot />
    </div>
  );
}

export default Layout;


