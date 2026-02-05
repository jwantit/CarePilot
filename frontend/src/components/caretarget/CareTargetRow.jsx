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
      className={`grid grid-cols-8 py-3 px-4 text-xs text-center items-center bg-gradient-to-r from-slate-800/50 to-slate-900/50 hover:from-slate-700/60 hover:to-slate-800/60 transition-all border-b border-slate-700/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSelected ? "bg-gradient-to-r from-slate-700/40 to-slate-800/40 border-l-2 border-l-teal-400 shadow-md" : ""}`}
    >
      {/* 체크박스 열 */}
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(data.careTargetId, e.target.checked)}
          className="custom-checkbox w-5 h-5 rounded-sm border-2 border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 focus:ring-2 focus:ring-teal-500/50 cursor-pointer shadow-md hover:border-teal-500/50 transition-all"
        />
      </div>

      {/* 사진 열 */}
      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 overflow-hidden flex items-center justify-center shadow-md">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={data.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
              <User size={18} className="text-slate-500" strokeWidth={2} />
            </div>
          )}
        </div>
      </div>

      {/* 이름(성별) 열 */}
      <div className="font-semibold text-slate-200">
        <div className="flex flex-col items-center gap-0.5">
          <span>{data?.name || "-"}</span>
          <span className="text-xs text-slate-500 font-normal">
            ({data?.gender || "-"})
          </span>
        </div>
      </div>
      {/* 나이 열 */}
      <div className="text-slate-300 font-medium">
        {data?.age ? (
          <div className="flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{data.age}</span>
          </div>
        ) : (
          <span className="text-slate-600">-</span>
        )}
      </div>

      {/* 전화번호 열 */}
      <div className="text-slate-300 text-xs">
        {data?.careTargetPhone ? (
          <div className="flex items-center justify-center gap-1">
            <Phone className="w-3 h-3 text-slate-500" />
            <span className="font-mono">{data.careTargetPhone}</span>
          </div>
        ) : (
          <span className="text-slate-600">-</span>
        )}
      </div>

      {/* 질환 열 */}
      <div className="text-slate-300 truncate px-2 font-medium">
        {data?.disease ? (
          <div className="flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span className="truncate">{data.disease}</span>
          </div>
        ) : (
          <span className="text-slate-600">-</span>
        )}
      </div>

      {/* 위험 레벨 열 */}
      <div className="flex justify-center">
        <span
          className={`px-2 py-0.5 text-xs font-semibold border ${getRiskLevelStyle(displayRiskLevel)}`}
        >
          {getRiskLevelLabel(displayRiskLevel)}
        </span>
      </div>

      {/* 관리 버튼 열 */}
      <div className="flex justify-center">
        <button
          onClick={handleDetailGo}
          className="px-3 py-1 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 text-xs font-semibold transition-all border border-teal-500/50 hover:border-teal-500 flex items-center gap-1 shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="font-mono text-teal-400">&gt;</span>
          <span>관리</span>
        </button>
      </div>
    </div>
  );
}

export default CareTargetRow;
