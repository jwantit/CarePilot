import { useState, useEffect } from "react";
import {
  getNotificationConfig,
  updateNotificationConfig,
} from "../../api/notificationConfigApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Bell, ShieldAlert, MessageSquare, Mail, Save, AlertTriangle, PhoneCall } from 'lucide-react';

function NotificationSetting() {
  const auth = useSelector((state) => state.auth);
  const userId = auth.user?.userId;
  const [loading, setLoading] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState({
    smsEnabled: true,
    emailEnabled: true,
    riskDetectionEnabled: true,
    callFailureEnabled: true,
    emergencyEventEnabled: true,
  });

  useEffect(() => {
    if (!userId) return;
    loadNotificationConfig();
  }, [userId]);

  const loadNotificationConfig = async () => {
    try {
      setLoading(true);
      const config = await getNotificationConfig(userId);
      setNotificationConfig(config);
    } catch (error) {
      console.error("알림 설정 조회 실패:", error);
      toast.error("설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setNotificationConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateNotificationConfig(userId, notificationConfig);
      // 설정 저장 후 이벤트 발송 (WebSocketContext에서 구독)
      window.dispatchEvent(new CustomEvent("notification-config-updated"));
      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      console.error("설정 저장 실패:", error);
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, label, icon: Icon, description }) => (
    <div className="flex items-center justify-between p-4 bg-cp-bg/30 border border-cp-border/50 rounded-sm hover:border-teal-500/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-cp-bg rounded-sm border border-cp-border/50">
          <Icon size={20} className="text-teal-400" />
        </div>
        <div>
          <label className="text-sm font-black text-cp-text block">{label}</label>
          <p className="text-[11px] text-cp-muted mt-0.5">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-cp-bg border border-cp-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cp-muted after:border-cp-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-checked:after:bg-white"></div>
      </label>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-cp-border flex items-center gap-3 bg-cp-bg/20">
          <div className="p-2 bg-teal-500/10 rounded-sm">
            <Bell className="text-teal-400" size={24} />
          </div>
          <h1 className="text-xl font-black text-cp-text tracking-tight uppercase">알림 설정</h1>
        </div>

        <div className="p-8 space-y-10">
          {/* 알림 수신 방식 섹션 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-cp-border/50">
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              <h2 className="text-sm font-black text-cp-text uppercase tracking-widest">
                알림 수신 방식
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleSwitch
                checked={notificationConfig.smsEnabled}
                onChange={(e) => handleConfigChange("smsEnabled", e.target.checked)}
                label="SMS 알림"
                icon={MessageSquare}
                description="긴급 상황 시 SMS로 알림을 받습니다."
              />

              <ToggleSwitch
                checked={notificationConfig.emailEnabled}
                onChange={(e) =>
                  handleConfigChange("emailEnabled", e.target.checked)
                }
                label="이메일 알림"
                icon={Mail}
                description="중요 보고서 및 통계를 이메일로 받습니다."
              />
            </div>
          </div>

          {/* 알림 유형 섹션 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-cp-border/50">
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              <h2 className="text-sm font-black text-cp-text uppercase tracking-widest">
                알림 유형
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToggleSwitch
                checked={notificationConfig.riskDetectionEnabled}
                onChange={(e) =>
                  handleConfigChange("riskDetectionEnabled", e.target.checked)
                }
                label="위험 감지"
                icon={ShieldAlert}
                description="케어 대상자 위험 시 알림"
              />

              <ToggleSwitch
                checked={notificationConfig.callFailureEnabled}
                onChange={(e) =>
                  handleConfigChange("callFailureEnabled", e.target.checked)
                }
                label="통화 실패"
                icon={PhoneCall}
                description="정기 통화 실패 시 알림"
              />

              <ToggleSwitch
                checked={notificationConfig.emergencyEventEnabled}
                onChange={(e) =>
                  handleConfigChange("emergencyEventEnabled", e.target.checked)
                }
                label="긴급 상황"
                icon={AlertTriangle}
                description="즉시 조치 필요 시 알림"
              />
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="pt-8 border-t border-cp-border flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-10 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-black text-base hover:from-teal-500 hover:to-teal-600 transition-all shadow-lg shadow-teal-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {loading ? "저장 중..." : "설정 저장하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationSetting;
