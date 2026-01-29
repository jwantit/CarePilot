import React, { useEffect, useState, useCallback } from 'react';
import CareTargetRow from "./CareTargetRow";
import { getCareTargetAllList } from '../../api/caretarget/careTargetApi';

// //--------- [체크박스 영역] props 추가 (selectedIds, onSelectChange, onListFetched) ---------
function CareTarget({ 
  organizationId, 
  setRefreshHandler, 
  keyword, 
  selectedIds, 
  onSelectChange, 
  onListFetched 
}) {
  const [careTargetList, setCareTargetList] = useState([]);
  const [loading, setLoading] = useState(false);

  // API 호출 함수
  const fetchList = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const data = await getCareTargetAllList(organizationId, keyword);
      const list = data || [];
      setCareTargetList(list);

      // //--------- [체크박스 영역] 부모 컴포넌트에 전체 리스트 정보 전달 ---------
      if (onListFetched) {
        onListFetched(list);
      }
      // //--------- [체크박스 영역] 끝 ---------

    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, keyword, onListFetched]); 

  useEffect(() => {
    if (setRefreshHandler) {
      setRefreshHandler(() => fetchList);
    }
    fetchList();
  }, [fetchList, setRefreshHandler]);

  if (loading && careTargetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <div className="w-8 h-8 border-4 border-[#008080]/20 border-t-[#008080] rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="divide-y divide-gray-100">
        {careTargetList && careTargetList.length > 0 ? (
          careTargetList.map((patient) => (
            <CareTargetRow 
              key={patient.careTargetId} 
              data={patient} 
              organizationId={organizationId}
              // //--------- [체크박스 영역] 개별 행에 체크 상태 및 핸들러 전달 ---------
              isSelected={selectedIds?.includes(patient.careTargetId)}
              onSelectChange={onSelectChange}
              // //--------- [체크박스 영역] 끝 ---------
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-gray-50/30">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-gray-300">!</span>
            </div>
            <p className="text-gray-500 font-medium">
              {keyword ? `"${keyword}"에 대한 검색 결과가 없습니다.` : "등록된 환자 데이터가 없습니다."}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {keyword ? "검색어를 다시 확인해 주세요." : "상단의 '환자 등록' 버튼을 통해 추가해 보세요."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CareTarget;