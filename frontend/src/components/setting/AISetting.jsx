import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getAIConfig, updateAIConfig } from "../../api/aiConfigApi";
import toast from "react-hot-toast";
import { Bot, PhoneCall, MessageSquare } from "lucide-react";

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

  const ToggleSwitch = ({ checked, onChange, label, icon: Icon, disabled }) => (
    <div className="flex items-center justify-between p-4 bg-cp-bg/30 border border-cp-border/50 rounded-sm hover:border-teal-500/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-cp-bg rounded-sm border border-cp-border/50">
          <Icon size={20} className="text-teal-400" />
        </div>
        <div>
          <label className="text-sm font-black text-cp-text block">{label}</label>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-cp-bg border border-cp-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cp-muted after:border-cp-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-checked:after:bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
      </label>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-cp-border flex items-center gap-3 bg-cp-bg/20">
            <div className="p-2 bg-teal-500/10 rounded-sm">
              <Bot className="text-teal-400" size={24} />
            </div>
            <h1 className="text-xl font-black text-cp-text tracking-tight uppercase">AI 설정</h1>
          </div>
          <div className="p-8">
            <div className="text-center py-8 text-cp-muted">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-cp-border flex items-center gap-3 bg-cp-bg/20">
          <div className="p-2 bg-teal-500/10 rounded-sm">
            <Bot className="text-teal-400" size={24} />
          </div>
          <h1 className="text-xl font-black text-cp-text tracking-tight uppercase">AI 설정</h1>
        </div>

        <div className="p-8 space-y-10">
          {/* AI 자동화 섹션 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-cp-border/50">
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              <h2 className="text-sm font-black text-cp-text uppercase tracking-widest">
                AI 자동화
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToggleSwitch
                checked={configs.call}
                onChange={(e) => handleToggle("call", e.target.checked)}
                label="전화 자동화"
                icon={PhoneCall}
                disabled={saving.call}
              />
              <ToggleSwitch
                checked={configs.sms}
                onChange={(e) => handleToggle("sms", e.target.checked)}
                label="문자 자동화"
                icon={MessageSquare}
                disabled={saving.sms}
              />
              <ToggleSwitch
                checked={configs.chatbot}
                onChange={(e) => handleToggle("chatbot", e.target.checked)}
                label="챗봇 자동화"
                icon={Bot}
                disabled={saving.chatbot}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AISetting;
