import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CareTarget from '../../components/caretarget/CareTarget';
import CareTargetUploadModal from '../../components/caretarget/CareTargetUploadModal';
import CareTargetInsertModal from '../../components/caretarget/CareTargetInsertModal';
import CareTargetActionBar from '../../components/caretarget/CareTargetActionBar'; 
import { deleteCareTarget, uploadCsvCareTarget, uploadOneCareTarget } from '../../api/caretarget/careTargetApi';
import { useAuth } from '../../hooks/useAuth';

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
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentList.map(item => item.careTargetId);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };
  //--------------------------------------------------------------------

  const isAllSelected = currentList.length > 0 && selectedIds.length === currentList.length;
  // //--------- [체크박스 영역] 끝 ---------


  // //--------- [통합 액션 핸들러 영역] 타입별 분기 처리 ---------
  const handleAction = async (type) => {
    if (selectedIds.length === 0) {
      alert("대상자를 선택해주세요.");
      return;
    }

    if (type === "CALL") {
      // 통화 로직은 나중에 구현 (생략)
      console.log("통화 요청 ID 리스트:", selectedIds);
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">케어 대상자 관리</h1>
        <p className="text-gray-500">케어 대상자 정보를 등록하고 관리할 수 있습니다.</p>
        
        {selectedIds.length > 0 && (
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-teal-50 border border-teal-200 rounded-full">
            <span className="text-[#008080] text-sm font-bold">
              {selectedIds.length}명 선택됨
            </span>
          </div>
        )}
      </div>

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
      />

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-4">
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 py-3 px-4 text-sm font-semibold text-gray-600 text-center items-center">
          <div className="flex justify-center">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-[#008080] rounded border-gray-300 focus:ring-[#008080] cursor-pointer"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />
          </div>
          <div>사진</div>
          <div>이름(성별)</div>
          <div>나이</div>
          <div>전화번호</div>
          <div>질환</div>
          <div>위험 레벨</div>
          <div>관리</div>
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