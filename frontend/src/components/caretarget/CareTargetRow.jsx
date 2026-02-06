import React, { useState } from "react";
import { User, Phone, Calendar, AlertCircle, ChevronRight } from "lucide-react";
import { getFileUrl } from "../../hooks/fileHelper";
import { useNavigate } from "react-router-dom";
import { getRiskLevelLabel, getRiskLevelStyle } from "../../utils/riskLevelStyles";

function CareTargetRow({ data, organizationId, isSelected, onSelectChange }) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleDetailGo = () => {
    if (data?.careTargetId) {
      navigate(`/care-target/detail/${data.careTargetId}`);
    } else {
      alert("환자 정보를 찾을 수 없습니다.");
    }
  };

  const imageUrl = getFileUrl(data?.thumbnailStoragePath);
  const displayRiskLevel = data?.riskLevel || "LOW";


  return (
    <div
      className={`grid grid-cols-8 py-4 px-4 text-sm text-center items-center bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg hover:bg-cp-bg/50 transition-all border-b border-cp-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSelected ? "bg-cp-bg/40 border-l-2 border-l-teal-400 shadow-md" : ""}`}
    >
      {/* 체크박스 열 */}
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(data.careTargetId, e.target.checked)}
          className="custom-checkbox w-6 h-6 rounded-sm border-2 border-cp-border bg-cp-input focus:ring-2 focus:ring-teal-500/50 cursor-pointer shadow-md hover:border-teal-500/50 transition-all"
        />
      </div>

      {/* 사진 열 */}
      <div className="flex justify-center">
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
      <div className="font-bold text-cp-text text-base">
        <span>{data?.name || "-"}</span>
      </div>
      {/* 나이 열 */}
      <div className="text-cp-text font-semibold text-base">
        {data?.age ? (
          <div className="flex items-center justify-center gap-1">
            <span>{data.age}</span>
          </div>
        ) : (
          <span className="text-cp-muted">-</span>
        )}
      </div>

      {/* 전화번호 열 */}
      <div className="text-cp-text text-sm font-medium">
        {data?.careTargetPhone ? (
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono">{data.careTargetPhone}</span>
          </div>
        ) : (
          <span className="text-cp-muted">-</span>
        )}
      </div>

      {/* 질환 열 */}
      <div className="text-cp-text truncate px-2 font-medium text-sm">
        {data?.disease ? (
          <div className="flex items-center justify-center gap-1">
            <span className="truncate">{data.disease}</span>
          </div>
        ) : (
          <span className="text-cp-muted">-</span>
        )}
      </div>

      {/* 위험 레벨 열 */}
      <div className="flex justify-center">
        <span
          className={`px-3 py-1 text-xs font-bold border ${getRiskLevelStyle(displayRiskLevel)} shadow-sm`}
        >
          {getRiskLevelLabel(displayRiskLevel)}
        </span>
      </div>

      {/* 관리 버튼 열 */}
      <div className="flex justify-center">
        <button
          onClick={handleDetailGo}
          className="cp-link-muted font-bold text-sm"
        >
          상세
        </button>
      </div>
    </div>
  );
}

export default CareTargetRow;
