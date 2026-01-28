import React, { useState } from 'react';
import { User } from 'lucide-react';
import { getFileUrl } from '../../hooks/fileHelper';
import { useNavigate } from 'react-router-dom';

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

  const getRiskStyle = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'HIGH': return 'bg-red-100 text-red-600 border-red-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'LOW':
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
  };

  return (
    // //--------- [체크박스 영역] grid-cols-7 -> grid-cols-8 변경 ---------
    <div className={`grid grid-cols-8 py-4 px-4 text-sm text-center items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isSelected ? 'bg-teal-50/30' : ''}`}>
      
      {/* 체크박스 열 */}
      <div className="flex justify-center">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => onSelectChange(data.careTargetId, e.target.checked)}
          className="w-4 h-4 text-[#008080] rounded border-gray-300 focus:ring-[#008080] cursor-pointer"
        />
      </div>
      {/* //--------- [체크박스 영역] 끝 --------- */}

      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
          {(imageUrl && !imgError) ? (
            <img src={imageUrl} alt={data.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-200">
              <User size={24} className="text-gray-400" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>
      <div className="font-medium text-gray-900">
        {data?.name || "-"} <span className="text-xs text-gray-400 font-normal">({data?.gender || "-"})</span>
      </div>
      <div className="text-gray-600">{data?.age ? `${data.age}세` : "-"}</div>
      <div className="text-gray-600 font-mono text-xs">{data?.careTargetPhone || "-"}</div>
      <div className="text-gray-600 truncate px-2">{data?.disease || "-"}</div>
      <div className="flex justify-center">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getRiskStyle(displayRiskLevel)}`}>
          {displayRiskLevel}
        </span>
      </div>
      <div className="flex justify-center">
        <button onClick={handleDetailGo} className="px-4 py-1.5 bg-white border border-[#008080] text-[#008080] text-xs font-bold rounded-md hover:bg-[#008080] hover:text-white transition-all shadow-sm">
          관리
        </button>
      </div>
    </div>
  );
}

export default CareTargetRow;