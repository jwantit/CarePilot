import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CareTarget from '../../components/caretarget/CareTarget';
import CareTargetUploadModal from '../../components/caretarget/CareTargetUploadModal';
import CareTargetInsertModal from '../../components/caretarget/CareTargetInsertModal';
import CareTargetActionBar from '../../components/caretarget/CareTargetActionBar'; 
import Breadcrumb from '../../components/common/Breadcrumb';
import StatCardGrid from '../../components/common/StatCardGrid';
import { deleteCareTarget, uploadCsvCareTarget, uploadOneCareTarget, getCareTargetAllList } from '../../api/caretarget/careTargetApi';
import { makeCallTest } from '../../api/callApi';
import { useAuth } from '../../hooks/useAuth';
import { Users, AlertTriangle, AlertCircle, Activity, Shield } from 'lucide-react';

function CareTargetPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [searchParams, setSearchParams] = useSearchParams();
  const keywordParam = searchParams.get('keyword') || '';
  const [searchInput, setSearchInput] = useState(keywordParam);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshCareList, setRefreshCareList] = useState(null);

  // //--------- [체크박스 영역] 선택된 ID 상태 및 리스트 데이터 관리 ---------
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentList, setCurrentList] = useState([]); // 현재 렌더링된 환자 리스트 저장용
  //--------------------------------------------------------------------

  // 통계 데이터 상태
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  // 통계 데이터 계산
  useEffect(() => {
    if (currentList.length > 0) {
      const newStats = {
        total: currentList.length,
        critical: currentList.filter(p => p.riskLevel === 'CRITICAL').length,
        high: currentList.filter(p => p.riskLevel === 'HIGH').length,
        medium: currentList.filter(p => p.riskLevel === 'MEDIUM').length,
        low: currentList.filter(p => p.riskLevel === 'LOW' || !p.riskLevel).length
      };
      setStats(newStats);
    } else {
      setStats({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
    }
  }, [currentList]);

  //단일 체크박스 선택시 set-------------------------------------------------------------------------
  const handleSelectChange = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };
  //-------------------------------------------------------------------------

  //전체체크시시---------------------------------------------------------------------
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      const allIds = currentList.map(item => item.careTargetId);
      setSelectedIds(allIds);
    }
  };
  //--------------------------------------------------------------------

  const isAllSelected = currentList.length > 0 && selectedIds.length === currentList.length;
  // //--------- [체크박스 영역] 끝 ---------

  // 통계 카드 데이터 준비
  const statCards = useMemo(() => [
    {
      value: stats.total,
      label: '대상',
      icon: Users,
      iconColor: 'text-teal-400',
      valueColor: 'text-cp-text',
      hoverBorderColor: 'hover:border-teal-500/50'
    },
    {
      value: stats.critical,
      label: '긴급',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      valueColor: 'text-red-400',
      hoverBorderColor: 'hover:border-red-500/50'
    },
    {
      value: stats.high,
      label: '위험',
      icon: AlertCircle,
      iconColor: 'text-orange-400',
      valueColor: 'text-orange-400',
      hoverBorderColor: 'hover:border-orange-500/50'
    },
    {
      value: stats.medium,
      label: '보통',
      icon: Activity,
      iconColor: 'text-yellow-400',
      valueColor: 'text-yellow-400',
      hoverBorderColor: 'hover:border-yellow-500/50'
    },
    {
      value: stats.low,
      label: '낮음',
      icon: Shield,
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400',
      hoverBorderColor: 'hover:border-emerald-500/50'
    }
  ], [stats]);

  // //--------- [통합 액션 핸들러 영역] 타입별 분기 처리 ---------
  const handleAction = async (type) => {
    if (selectedIds.length === 0) {
      alert("대상자를 선택해주세요.");
      return;
    }

    if (type === "CALL") {
      const selectedItems = currentList.filter((item) => selectedIds.includes(item.careTargetId));
      const withPhone = selectedItems.filter((item) => item.careTargetPhone);
      const noPhone = selectedItems.filter((item) => !item.careTargetPhone);

      if (noPhone.length > 0) {
        alert(`전화번호가 없는 대상 ${noPhone.length}명은 제외됩니다.\n(${noPhone.map((p) => p.name).join(', ')})`);
      }
      if (withPhone.length === 0) {
        alert("통화 가능한 대상이 없습니다. 전화번호를 확인해 주세요.");
        return;
      }

      const now = new Date().toISOString().slice(0, 19);
      try {
        for (const item of withPhone) {
          await makeCallTest({ to: item.careTargetPhone, scheduledTime: now });
        }
        alert(`선택한 대상(${withPhone.length}명)에게 통화를 연결합니다.`);
        setSelectedIds([]);
      } catch (error) {
        if (error.response?.status === 403) {
          alert("권한이 없습니다.");
        } else {
          alert("통화 요청 중 오류가 발생했습니다.");
        }
      }
    } 
    else if (type === "DELETE") {
      // 2. 삭제 로직
      if (window.confirm(`선택한 ${selectedIds.length}명의 환자 정보를 정말 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) {
        setIsUploading(true); // 로딩 상태 활성화
        try {
          await deleteCareTarget(selectedIds); 
          alert("성공적으로 삭제되었습니다.");
          setSelectedIds([]); // 선택 초기화
          if (refreshCareList) refreshCareList(); // 목록 새로고침 호출
        } catch (error) {
          // 서버에서 403(FORBIDDEN)을 보냈을 경우 에러 처리
          if (error.response?.status === 403) {
            alert("삭제 권한이 없습니다. 관리자에게 문의하세요.");
          } else {
            alert("삭제 중 오류가 발생했습니다.");
          }
        } finally {
          setIsUploading(false); // 로딩 종료
        }
      }
    }
  };

  //체크박스 end---------------------------------------------------

  //-------------------------------------------
  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim() === '') {
      newParams.delete('keyword');
    } else {
      newParams.set('keyword', searchInput);
    }
    setSearchParams(newParams);
    setSelectedIds([]); 
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchParams({});
    setSelectedIds([]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('organizationId', organizationId);
    
    setIsUploading(true);
    try {
      await uploadCsvCareTarget(formData);
      alert("데이터 업로드가 완료되었습니다.");
      setIsModalOpen(false);
      setSelectedFiles([]);
      if (refreshCareList) refreshCareList();
    } catch (error) {
      alert("업로드 중 오류가 발생했습니다.");
    } finally { setIsUploading(false); }
  };

  const handleInsert = async (formData) => {
    setIsUploading(true);
    try {
      await uploadOneCareTarget(formData);
      alert("환자 등록이 완료되었습니다.");
      setIsInsertModalOpen(false);
      if (refreshCareList) refreshCareList();
    } catch (error) {
      alert("등록 중 오류가 발생했습니다.");
    } finally { setIsUploading(false); }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={['케어 대상자']} />

        {/* 통계 카드 섹션 */}
        <StatCardGrid cards={statCards} />

      <CareTargetActionBar 
        onInsertClick={() => setIsInsertModalOpen(true)}
        onUploadClick={() => setIsModalOpen(true)}
        // //--------- [액션바 연결] 통합 핸들러 전달 ---------
        onActionClick={handleAction}
        // //--------- [액션바 연결] 끝 ---------
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        handleReset={handleReset}
        selectedCount={selectedIds.length}
      />

      <div className="bg-cp-card border border-cp-border overflow-hidden">
        {/* 테이블 헤더 - 터미널 스타일 */}
        <div className="grid grid-cols-8 bg-cp-header border-b-2 border-teal-500/30 py-3.5 px-4 text-sm font-semibold text-white dark:text-cp-text text-center items-center min-h-[48px]">
          <div className="flex items-center justify-center">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 bg-cp-input hover:bg-cp-bg text-teal-600 dark:text-teal-400 text-xs font-semibold transition-all border border-teal-500/50 hover:border-teal-500 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              전체선택
            </button>
          </div>
          <div className="flex items-center justify-center text-white dark:text-teal-400">
            <span>프로필 사진</span>
          </div>
          <div className="flex items-center justify-center text-white dark:text-teal-400">
            <span>이름</span>
          </div>
          <div className="flex items-center justify-center text-white dark:text-teal-400">
            <span>성별</span>
          </div>
          <div className="flex items-center justify-center text-white dark:text-teal-400">
            <span>나이</span>
          </div>
          <div className="flex items-center justify-center text-white dark:text-teal-400">
            <span>연락처</span>
          </div>
          <div className="flex items-center justify-center text-white dark:text-teal-400">
            <span>질환</span>
          </div>
          <div className="flex items-center justify-center text-white dark:text-teal-400">
            <span>위험도</span>
          </div>
        </div>
        
        <CareTarget 
          organizationId={organizationId} 
          setRefreshHandler={setRefreshCareList}
          keyword={keywordParam}
          selectedIds={selectedIds}
          onSelectChange={handleSelectChange}
          onListFetched={setCurrentList}
        />
      </div>

      <CareTargetUploadModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedFiles([]); }}
        selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles}
        onUpload={handleUpload} isUploading={isUploading}
      />

      <CareTargetInsertModal 
        isOpen={isInsertModalOpen} onClose={() => setIsInsertModalOpen(false)}
        organizationId={organizationId} onInsert={handleInsert} isUploading={isUploading}
      />
    </div>
  );
}

export default CareTargetPage;
