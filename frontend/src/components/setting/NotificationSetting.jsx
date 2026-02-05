import { useState, useEffect } from "react";
import {
  getNotificationConfig,
  updateNotificationConfig,
} from "../../api/notificationConfigApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

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

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between">
      <label className="text-base font-semibold text-slate-300">{label}</label>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-200 after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
      </label>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-100">알림 설정</h1>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6 space-y-8">
        {/* 알림 수신 방식 섹션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            알림 수신 방식
          </h2>
          <ToggleSwitch
            checked={notificationConfig.smsEnabled}
            onChange={(e) => handleConfigChange("smsEnabled", e.target.checked)}
            label="SMS 알림"
          />

          <ToggleSwitch
            checked={notificationConfig.emailEnabled}
            onChange={(e) =>
              handleConfigChange("emailEnabled", e.target.checked)
            }
            label="이메일 알림"
          />
        </div>

        {/* 구분선 */}
        <div className="border-t border-slate-700"></div>

        {/* 알림 유형 섹션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            알림 유형
          </h2>
          <ToggleSwitch
            checked={notificationConfig.riskDetectionEnabled}
            onChange={(e) =>
              handleConfigChange("riskDetectionEnabled", e.target.checked)
            }
            label="위험 감지 알림"
          />

          <ToggleSwitch
            checked={notificationConfig.callFailureEnabled}
            onChange={(e) =>
              handleConfigChange("callFailureEnabled", e.target.checked)
            }
            label="통화 실패 알림"
          />

          <ToggleSwitch
            checked={notificationConfig.emergencyEventEnabled}
            onChange={(e) =>
              handleConfigChange("emergencyEventEnabled", e.target.checked)
            }
            label="긴급 상황 알림"
          />
        </div>

        <div className="pt-4 border-t border-slate-700">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/50 text-teal-400 rounded-sm hover:from-slate-800 hover:to-slate-900 hover:border-teal-500 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSetting;
