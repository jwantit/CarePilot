import { useState, useEffect } from "react";
import { getRiskConfig, updateRiskConfig } from "../../api/riskConfigApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { ShieldAlert, Save, AlertTriangle, AlertCircle, Activity, ShieldCheck } from "lucide-react";

function RiskSetting() {
  const auth = useSelector((state) => state.auth);
  const organizationId = auth.user?.organizationId;

  const [loading, setLoading] = useState(false);
  const [riskConfig, setRiskConfig] = useState({
    criticalThreshold: 90,
    highThreshold: 70,
    mediumThreshold: 50,
    lowThreshold: 30,
  });

  useEffect(() => {
    loadRiskConfig();
  }, []);

  const loadRiskConfig = async () => {
    try {
      setLoading(true);
      const config = await getRiskConfig(organizationId);
      setRiskConfig(config);
    } catch (error) {
      console.error("위험 설정 조회 실패:", error);
      toast.error("설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (field, value) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    if (
      numValue !== null &&
      (isNaN(numValue) || numValue < 0 || numValue > 100)
    ) {
      return; // 유효하지 않은 값은 무시
    }
    setRiskConfig((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateRiskConfig(organizationId, riskConfig);
      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      console.error("설정 저장 실패:", error);
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const ThresholdInput = ({ label, value, onChange, description, icon: Icon, iconColorClass, iconBgClass }) => (
    <div className="flex items-center justify-between p-4 bg-cp-bg/30 border border-cp-border/50 rounded-sm hover:border-teal-500/30 transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-sm border ${iconBgClass || "bg-cp-bg border-cp-border/50"}`}>
          <Icon size={20} className={iconColorClass || "text-teal-400"} />
        </div>
        <div>
          <label className={`text-base font-medium block ${iconColorClass || "text-cp-text"}`}>{label}</label>
          <p className="text-xs text-cp-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="100"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-3 py-2 border border-cp-border rounded-sm bg-cp-input text-cp-text text-base font-medium text-center focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
          placeholder="0-100"
        />
        <span className="text-base text-cp-muted font-medium">점</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-cp-border flex items-center gap-3 bg-cp-bg/20">
          <div className="p-2 bg-teal-500/10 rounded-sm">
            <ShieldAlert className="text-teal-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-cp-text tracking-tight uppercase">위험 설정</h1>
        </div>

        <div className="p-8 space-y-10">
          {/* 위험 등급 기준 섹션 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-cp-border/50">
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              <h2 className="text-base font-bold text-cp-text uppercase tracking-widest">
                위험 등급 기준 점수
              </h2>
            </div>
            <p className="text-xs text-cp-muted -mt-2">각 등급별 기준 점수를 설정해 위험도를 결정할 수 있습니다. (0~100점)</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ThresholdInput
                label="긴급"
                value={riskConfig.criticalThreshold}
                onChange={(value) =>
                  handleThresholdChange("criticalThreshold", value)
                }
                description={`${riskConfig.criticalThreshold ?? 90}점 이상이면 긴급으로 분류됩니다.`}
                icon={AlertTriangle}
                iconColorClass="text-red-400"
                iconBgClass="bg-red-500/20 border-red-500/50"
              />

              <ThresholdInput
                label="위험"
                value={riskConfig.highThreshold}
                onChange={(value) =>
                  handleThresholdChange("highThreshold", value)
                }
                description={`${riskConfig.highThreshold ?? 70}점 이상이면 위험으로 분류됩니다.`}
                icon={AlertCircle}
                iconColorClass="text-orange-400"
                iconBgClass="bg-orange-500/20 border-orange-500/50"
              />

              <ThresholdInput
                label="보통"
                value={riskConfig.mediumThreshold}
                onChange={(value) =>
                  handleThresholdChange("mediumThreshold", value)
                }
                description={`${riskConfig.mediumThreshold ?? 50}점 이상이면 보통으로 분류됩니다.`}
                icon={Activity}
                iconColorClass="text-yellow-400"
                iconBgClass="bg-yellow-500/20 border-yellow-500/50"
              />

              <div className="flex items-center gap-4 p-4 bg-cp-bg/30 border border-cp-border/50 rounded-sm">
                <div className="p-2.5 rounded-sm border bg-emerald-500/20 border-emerald-500/50">
                  <ShieldCheck size={20} className="text-emerald-400" />
                </div>
                <div>
                  <label className="text-base font-medium block text-emerald-400">낮음</label>
                  <p className="text-xs text-cp-muted mt-0.5">
                    보통 기준({riskConfig.mediumThreshold ?? 50}점) 미만이면 낮음으로 분류됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="pt-8 border-t border-cp-border flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-10 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-bold text-lg hover:from-teal-500 hover:to-teal-600 transition-all shadow-lg shadow-teal-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default RiskSetting;
