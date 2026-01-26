import { useState } from 'react';
import NotificationSetting from '../../components/setting/NotificationSetting';
import RiskSetting from '../../components/setting/RiskSetting';
import AISetting from '../../components/setting/AISetting';
import DoctorManagement from '../../components/setting/DoctorManagement';
import ScenarioSetting from '../../components/setting/ScenarioSetting';

function SettingPage() {
  const [activeMenu, setActiveMenu] = useState('scenario');

  const menuItems = [
    { id: 'scenario', label: '시나리오 설정', component: ScenarioSetting },
    { id: 'doctor', label: '의료진 관리', component: DoctorManagement },
    { id: 'risk', label: '위험 설정', component: RiskSetting },
    { id: 'notification', label: '알림 설정', component: NotificationSetting },
    { id: 'ai', label: 'AI 설정', component: AISetting },
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeMenu)?.component || NotificationSetting;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 왼쪽 사이드바 */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-xl font-semibold mb-4">설정</h2>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeMenu === item.id
                  ? 'bg-teal-50 text-teal-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-8">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default SettingPage;