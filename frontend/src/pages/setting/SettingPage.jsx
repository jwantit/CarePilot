import { useState } from 'react';
import NotificationSetting from '../../components/setting/NotificationSetting';
import RiskSetting from '../../components/setting/RiskSetting';
import AISetting from '../../components/setting/AISetting';
import DoctorManagement from '../../components/setting/DoctorManagement';
import ScenarioSetting from '../../components/setting/ScenarioSetting';
import Breadcrumb from '../../components/common/Breadcrumb';

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
    <div className="space-y-6">
      <Breadcrumb items={["설정"]} />
      <div className="flex min-h-[500px]">
      {/* 왼쪽 사이드바 */}
      <div className="w-64 flex-shrink-0 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-sm p-4 mr-4">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">설정</h2>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full text-left px-4 py-2 rounded-sm transition-colors ${
                activeMenu === item.id
                  ? "bg-teal-500/20 text-teal-400 font-semibold border border-teal-500/50"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-8 overflow-auto bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm">
        <ActiveComponent />
      </div>
      </div>
    </div>
  );
}

export default SettingPage;