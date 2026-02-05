import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getAIConfig, updateAIConfig } from "../../api/aiConfigApi";
import toast from "react-hot-toast";

function AISetting() {
  const auth = useSelector((state) => state.auth);
  const organizationId = auth?.user?.organizationId;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [configs, setConfigs] = useState({
    call: false,
    sms: false,
    chatbot: false,
  });

  const featureNames = {
    call: "CALL_AUTOMATION",
    sms: "SMS_AUTOMATION",
    chatbot: "CHATBOT_AUTOMATION",
  };

  useEffect(() => {
    if (!organizationId) return;
    loadAllConfigs();
  }, [organizationId]);

  const loadAllConfigs = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const [callConfig, smsConfig, chatbotConfig] = await Promise.all([
        getAIConfig(organizationId, featureNames.call),
        getAIConfig(organizationId, featureNames.sms),
        getAIConfig(organizationId, featureNames.chatbot),
      ]);

      setConfigs({
        call: callConfig.isEnabled || false,
        sms: smsConfig.isEnabled || false,
        chatbot: chatbotConfig.isEnabled || false,
      });
    } catch (error) {
      console.error("AI 설정 조회 실패:", error);
      toast.error("설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (feature, enabled) => {
    if (!organizationId) return;

    const featureName = featureNames[feature];
    setSaving((prev) => ({ ...prev, [feature]: true }));

    try {
      await updateAIConfig(organizationId, featureName, enabled);
      setConfigs((prev) => ({ ...prev, [feature]: enabled }));
      toast.success(`${getFeatureLabel(feature)} 자동화가 ${enabled ? "활성화" : "비활성화"}되었습니다.`);
    } catch (error) {
      console.error(`${feature} 설정 저장 실패:`, error);
      toast.error("설정 저장에 실패했습니다.");
      // 실패 시 이전 상태로 복구
      setConfigs((prev) => ({ ...prev, [feature]: !enabled }));
    } finally {
      setSaving((prev) => ({ ...prev, [feature]: false }));
    }
  };

  const getFeatureLabel = (feature) => {
    const labels = {
      call: "전화",
      sms: "문자",
      chatbot: "챗봇",
    };
    return labels[feature] || feature;
  };

  const ToggleSwitch = ({ checked, onChange, label, disabled }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <label className="text-base font-semibold text-slate-300">{label}</label>
        <p className="text-sm text-slate-500 mt-1">
          {checked ? "자동화가 활성화되어 있습니다." : "자동화가 비활성화되어 있습니다."}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-200 after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
      </label>
    </div>
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-slate-100">AI 설정</h1>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
          <div className="text-center py-8 text-slate-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-100">AI 설정</h1>
      <p className="text-slate-400 mb-6">
        각 기능별 AI 자동화를 활성화하거나 비활성화할 수 있습니다.
      </p>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6 space-y-6">
        {/* 전화 자동화 섹션 */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            전화 자동화
          </h2>
          <ToggleSwitch
            checked={configs.call}
            onChange={(e) => handleToggle("call", e.target.checked)}
            label="전화 자동화"
            disabled={saving.call}
          />
        </div>

        {/* 구분선 */}
        <div className="border-t border-slate-700"></div>

        {/* 문자 자동화 섹션 */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            문자 자동화
          </h2>
          <ToggleSwitch
            checked={configs.sms}
            onChange={(e) => handleToggle("sms", e.target.checked)}
            label="문자 자동화"
            disabled={saving.sms}
          />
        </div>

        {/* 구분선 */}
        <div className="border-t border-slate-700"></div>

        {/* 챗봇 자동화 섹션 */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            챗봇 자동화
          </h2>
          <ToggleSwitch
            checked={configs.chatbot}
            onChange={(e) => handleToggle("chatbot", e.target.checked)}
            label="챗봇 자동화"
            disabled={saving.chatbot}
          />
        </div>
      </div>
    </div>
  );
}

export default AISetting;


