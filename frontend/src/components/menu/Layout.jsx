import { Outlet } from 'react-router-dom';
import Menu from './Menu';
import ThemeToggle from '../common/ThemeToggle';
import AiChatBot from '../aiChat/AiChatBot';
import SmsChatWidget from '../sms/SmsChatWidget';
import '../../App.css'; 

function Layout() {
  return (
     <div className="min-h-screen bg-transparent relative"> 
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle className="bg-cp-card border border-cp-border shadow-md" />
      </div>
      <Menu />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
      <SmsChatWidget />
      <AiChatBot />
    </div>
  );
}

export default Layout;