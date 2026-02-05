import React, { useEffect, useState, useCallback } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import 'react-virtualized/styles.css';
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
      <div className="flex flex-col items-center justify-center p-20 gap-4 bg-slate-800">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-teal-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-mono">로딩 중...</p>
      </div>
    );
  }

  // 가상 스크롤을 위한 row renderer
  const rowRenderer = ({ key, index, style }) => {
    const patient = careTargetList[index];
    if (!patient) return null;
    
    return (
      <div key={key} style={style}>
        <CareTargetRow 
          data={patient} 
          organizationId={organizationId}
          isSelected={selectedIds?.includes(patient.careTargetId)}
          onSelectChange={onSelectChange}
        />
      </div>
    );
  };

  if (careTargetList && careTargetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-800">
        <div className="w-20 h-20 bg-slate-900 border-2 border-slate-700 rounded flex items-center justify-center mb-5">
          <span className="text-3xl text-slate-600">[ ]</span>
        </div>
        <p className="text-slate-300 font-mono font-semibold text-base mb-2">
          {keyword ? `// No results for "${keyword}"` : "// No patient data found"}
        </p>
        <p className="text-slate-500 text-sm font-mono">
          {keyword ? "// Please check your search query" : "// Use 'ADD' button to register patients"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-800" style={{ height: '600px' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            width={width}
            height={height}
            rowCount={careTargetList.length}
            rowHeight={60} // CareTargetRow의 높이 조정
            rowRenderer={rowRenderer}
            overscanRowCount={5} // 성능 최적화를 위한 추가 렌더링 행 수
          />
        )}
      </AutoSizer>
    </div>
  );
}

export default CareTarget;
