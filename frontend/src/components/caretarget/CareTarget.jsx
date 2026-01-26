import React, { useEffect, useState, useCallback } from 'react';
import CareTargetRow from "./CareTargetRow";
import { getCareTargetAllList } from '../../api/caretarget/careTargetApi';

/**
 * @param {number} organizationId - 기관 ID
 * @param {function} setRefreshHandler - 부모에게 갱신 함수를 전달하기 위한 setter
 * @param {string} filterStatus - 부모로부터 전달받은 필터 상태 (all, active, inactive)
 */

function CareTarget({ organizationId, setRefreshHandler, filterStatus ,keyword}) {
  // 1. 상태 관리
  const [careTargetList, setCareTargetList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 데이터 가져오는 함수 (비동기)-----------------------------------------------------
  // useCallback을 사용하여 함수가 불필요하게 재생성되는 것을 방지합니다.
  const fetchList = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      // API 호출 (업체 ID 전달)
      const data = await getCareTargetAllList(organizationId, filterStatus, keyword);
      setCareTargetList(data || []);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, filterStatus, keyword]);
  //-------------------------------------------------------------------------------


  // 컴포넌트 마운트 및 organizationId 변경 시 호출------------------------------------
  useEffect(() => {
    // 부모 컴포넌트가 이 fetchList 함수를 호출할 수 있도록 전달합니다.
    if (setRefreshHandler) {
      setRefreshHandler(() => fetchList);
    }
    
    fetchList();
  }, [fetchList, setRefreshHandler]);
  //-------------------------------------------------------------------------------


  // 로딩 중일 때 표시 (데이터가 없을 때만 로딩 스피너 표시)--------------------------------------
  if (loading && careTargetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <div className="w-8 h-8 border-4 border-[#008080]/20 border-t-[#008080] rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }
    //-------------------------------------------------------------------------------


  return (
    <div className="w-full">
      <div className="divide-y divide-gray-100">
        {/* 데이터 렌더링 */}
        {careTargetList && careTargetList.length > 0 ? (
          careTargetList.map((patient) => (
            <CareTargetRow 
              key={patient.careTargetId} 
              data={patient} 
              organizationId={organizationId}
              // 만약 행 내부에서 삭제 후 목록 갱신이 필요하다면 fetchList를 전달할 수도 있습니다.
              onRefresh={fetchList} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-gray-50/30">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-gray-300">!</span>
            </div>
            <p className="text-gray-500 font-medium">등록된 환자 데이터가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1">상단의 '환자 등록' 버튼을 통해 신규 환자를 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CareTarget;