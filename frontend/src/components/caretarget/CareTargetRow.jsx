import React, { useState } from 'react';
import { User } from 'lucide-react';
import { getFileUrl } from '../../hooks/fileHelper';


//관리 페이지
import { useNavigate } from 'react-router-dom';

function CareTargetRow({ data, organizationId }) {
  const [imgError, setImgError] = useState(false);

  //관리페이지 이동
  const navigate = useNavigate();

  const handleDetailGo = () => {
    if (data?.careTargetId) {
      navigate(`/care-target/detail/${data.careTargetId}`);
    } else {
      alert("환자 정보를 찾을 수 없습니다.");
    }
  };


  const imageUrl = getFileUrl(data?.thumbnailStoragePath);
   



  return (
    <div className="grid grid-cols-8 py-4 px-4 text-sm text-center items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      
      {/* 사진 */}
      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
          {(imageUrl && !imgError) ? (
            <img 
              src={imageUrl} 
              alt={data.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)} 
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-200">
              <User size={24} className="text-gray-400" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      {/* 이름 */}
      <div className="font-medium text-gray-900">{data?.name || "-"}</div>

      {/* 나이 */}
      <div className="text-gray-600">{data?.age ? `${data.age}세` : "-"}</div>

      {/* 질환 */}
      <div className="text-gray-600 truncate px-2">{data?.disease || "-"}</div>

      {/* 위험점수*/}
      <div className="flex justify-center">
        {data?.riskScore > 0 ? (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            data.riskScore >= 80 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
          }`}>
            {data.riskScore}점
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
            측정 전
          </span>
        )}
      </div>

      {/* 최근통화화 */}
      <div className="flex justify-center">
        {data?.recentCall ? (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
            {data.recentCall}
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
            통화 전
          </span>
        )}
      </div>

      {/* 활성상태 */}
      <div className="flex justify-center">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          data?.careStatus ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {data?.careStatus ? "활성" : "비활성"}
        </span>
      </div>

      {/* 관리 */}
      <div className="flex justify-center">
        <button 
          onClick={handleDetailGo}
          className="px-4 py-1.5 bg-white border border-[#008080] text-[#008080] text-xs font-bold rounded-md hover:bg-[#008080] hover:text-white transition-all shadow-sm"
        >
          관리
        </button>
      </div>

    </div>
  );
}

export default CareTargetRow;