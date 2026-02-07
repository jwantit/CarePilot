import React, { useState } from "react";
import { User } from "lucide-react";
import { getFileUrl } from "../../hooks/fileHelper";
import { useNavigate } from "react-router-dom";
import { getRiskLevelLabel, getRiskLevelStyle } from "../../utils/riskLevelStyles";

const getGenderLabel = (gender) => {
  if (!gender) return "-";
  const g = String(gender).toUpperCase();
  if (g === "M" || g === "MALE" || g === "남" || g === "남성") return "남성";
  if (g === "F" || g === "FEMALE" || g === "여" || g === "여성") return "여성";
  return gender;
};

function CareTargetRow({ data, organizationId, isSelected, onSelectChange }) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleRowClick = () => {
    if (data?.careTargetId) {
      navigate(`/care-target/detail/${data.careTargetId}`);
    } else {
      alert("환자 정보를 찾을 수 없습니다.");
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
  };

  const imageUrl = getFileUrl(data?.thumbnailStoragePath);
  const displayRiskLevel = data?.riskLevel || "LOW";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => e.key === "Enter" && handleRowClick()}
      className={`grid grid-cols-8 py-3 px-4 text-sm text-center items-center min-h-[60px] bg-cp-card/30 hover:bg-cp-bg/50 transition border-b border-cp-border cursor-pointer ${isSelected ? "bg-cp-bg/40 border-l-2 border-l-teal-400 -ml-[2px]" : ""}`}
    >
      {/* 체크박스 열 */}
      <div className="flex items-center justify-center h-full" onClick={handleCheckboxClick}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(data.careTargetId, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="custom-checkbox w-6 h-6 rounded-sm border-2 border-cp-border bg-cp-input focus:ring-2 focus:ring-teal-500/50 cursor-pointer transition-all"
        />
      </div>

      {/* 사진 열 */}
      <div className="flex items-center justify-center h-full">
        <div className="w-11 h-11 rounded-full bg-cp-bg border border-cp-border overflow-hidden flex items-center justify-center shadow-md">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={data.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-cp-bg">
              <User size={20} className="text-cp-muted" strokeWidth={2} />
            </div>
          )}
        </div>
      </div>

      {/* 이름 열 */}
      <div className="flex items-center justify-center h-full">
        <span className="text-cp-text text-base truncate">{data?.name || "-"}</span>
      </div>

      {/* 성별 열 */}
      <div className="flex items-center justify-center h-full">
        <span className="text-cp-text text-base">{getGenderLabel(data?.gender)}</span>
      </div>

      {/* 나이 열 */}
      <div className="flex items-center justify-center h-full">
        <span className="text-cp-text text-base">{data?.age ?? "-"}세</span>
      </div>

      {/* 전화번호 열 */}
      <div className="flex items-center justify-center h-full">
        {data?.careTargetPhone ? (
          <span className="text-cp-text text-sm font-mono truncate">{data.careTargetPhone}</span>
        ) : (
          <span className="text-cp-muted">-</span>
        )}
      </div>

      {/* 질환 열 */}
      <div className="flex items-center justify-center h-full">
        <span className="text-cp-text truncate text-sm">{data?.disease || "-"}</span>
      </div>

      {/* 위험 레벨 열 */}
      <div className="flex items-center justify-center h-full">
        <span
          className={`px-3 py-1 text-xs font-bold border ${getRiskLevelStyle(displayRiskLevel)} shadow-sm`}
        >
          {getRiskLevelLabel(displayRiskLevel)}
        </span>
      </div>
    </div>
  );
}

export default CareTargetRow;
