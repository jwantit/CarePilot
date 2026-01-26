import { useState, useEffect } from "react";
import { getRiskConfig, updateRiskConfig } from "../../api/riskConfigApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

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

  const ThresholdInput = ({ label, value, onChange, description }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-3">
        <input
          type="number"
          min="0"
          max="100"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="0-100"
        />
        <span className="text-sm text-gray-500">점</span>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">위험 설정</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              위험 점수 임계값 설정
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              각 위험 계급에 대한 점수 임계값을 설정합니다. (0-100점)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThresholdInput
              label="위험 점수 임계값 (긴급)"
              value={riskConfig.criticalThreshold}
              onChange={(value) =>
                handleThresholdChange("criticalThreshold", value)
              }
              description="이 값 이상이면 긴급(CRITICAL)으로 분류됩니다."
            />

            <ThresholdInput
              label="위험 점수 임계값 (높음)"
              value={riskConfig.highThreshold}
              onChange={(value) =>
                handleThresholdChange("highThreshold", value)
              }
              description="이 값 이상이면 높음(HIGH)으로 분류됩니다."
            />

            <ThresholdInput
              label="위험 점수 임계값 (보통)"
              value={riskConfig.mediumThreshold}
              onChange={(value) =>
                handleThresholdChange("mediumThreshold", value)
              }
              description="이 값 이상이면 보통(MEDIUM)으로 분류됩니다."
            />

            <ThresholdInput
              label="위험 점수 임계값 (낮음)"
              value={riskConfig.lowThreshold}
              onChange={(value) => handleThresholdChange("lowThreshold", value)}
              description="이 값 이상이면 낮음(LOW)으로 분류됩니다."
            />
          </div>
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

export default RiskSetting;
