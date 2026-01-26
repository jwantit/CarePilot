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
    smsEnabled: false,
    kakaoEnabled: false,
    emailEnabled: false,
    riskDetectionEnabled: true,
    callFailureEnabled: true,
    emergencyEventEnabled: true,
    nightRestrictionStart: null,
    nightRestrictionEnd: null,
  });

  useEffect(() => {
    if (!userId) return;
    loadNotificationConfig();
  }, [userId]);

  const loadNotificationConfig = async () => {
    try {
      setLoading(true);
      const config = await getNotificationConfig(userId);
      // LocalTime을 HH:mm 형식으로 변환
      const formattedConfig = {
        ...config,
        nightRestrictionStart: config.nightRestrictionStart
          ? config.nightRestrictionStart.substring(0, 5)
          : null,
        nightRestrictionEnd: config.nightRestrictionEnd
          ? config.nightRestrictionEnd.substring(0, 5)
          : null,
      };
      setNotificationConfig(formattedConfig);
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
      // 시간 형식을 LocalTime 형식으로 변환 (HH:mm -> HH:mm:ss)
      const configToSave = {
        ...notificationConfig,
        nightRestrictionStart: notificationConfig.nightRestrictionStart
          ? `${notificationConfig.nightRestrictionStart}:00`
          : null,
        nightRestrictionEnd: notificationConfig.nightRestrictionEnd
          ? `${notificationConfig.nightRestrictionEnd}:00`
          : null,
      };
      await updateNotificationConfig(userId, configToSave);
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
      <label className="text-base font-medium text-gray-700">{label}</label>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
      </label>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">알림 설정</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-8">
        {/* 알림 수신 방식 섹션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            알림 수신 방식
          </h2>
          <ToggleSwitch
            checked={notificationConfig.smsEnabled}
            onChange={(e) => handleConfigChange("smsEnabled", e.target.checked)}
            label="SMS 알림"
          />

          <ToggleSwitch
            checked={notificationConfig.kakaoEnabled}
            onChange={(e) =>
              handleConfigChange("kakaoEnabled", e.target.checked)
            }
            label="카카오톡 알림"
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
        <div className="border-t border-gray-200"></div>

        {/* 알림 유형 섹션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
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

        {/* 구분선 */}
        <div className="border-t border-gray-200"></div>

        {/* 알림 제한 시간 섹션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            알림 제한 시간
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 시간
              </label>
              <input
                type="time"
                value={notificationConfig.nightRestrictionStart || ""}
                onChange={(e) =>
                  handleConfigChange("nightRestrictionStart", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 시간
              </label>
              <input
                type="time"
                value={notificationConfig.nightRestrictionEnd || ""}
                onChange={(e) =>
                  handleConfigChange("nightRestrictionEnd", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            설정한 시간 동안 알림이 제한됩니다.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSetting;
