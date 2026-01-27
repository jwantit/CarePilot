import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, FileUp, Search, RotateCcw } from 'lucide-react'; // RotateCcw 아이콘 추가
import CareTarget from '../../components/caretarget/CareTarget';
import CareTargetUploadModal from '../../components/caretarget/CareTargetUploadModal';
import CareTargetInsertModal from '../../components/caretarget/CareTargetInsertModal';
import CareTargetActionBar from '../../components/caretarget/CareTargetActionBar'; // 통합 컴포넌트 임포트
import { uploadCsvCareTarget, uploadOneCareTarget } from '../../api/caretarget/careTargetApi';
import { useAuth } from '../../hooks/useAuth';


function CareTargetPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = searchParams.get('status') || 'all';
  const keywordParam = searchParams.get('keyword') || '';
  const [searchInput, setSearchInput] = useState(keywordParam);

  //모달--------------------------------------------------------------
  //CSV/Excel 대량 등록을 위한 업로드 모달의 열림/닫힘 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  //개별 환자를 직접 등록하는 단일 등록 모달의 열림/닫힘 상태
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
//------------------------------------------------------------------

//대량등록 다령의 파일
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [isUploading, setIsUploading] = useState(false);
 
  const [refreshCareList, setRefreshCareList] = useState(null);

  const handleFilterChange = (e) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    value === 'all' ? newParams.delete('status') : newParams.set('status', value);
    setSearchParams(newParams);
  };

  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    searchInput.trim() === '' ? newParams.delete('keyword') : newParams.set('keyword', searchInput);
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handleUpload = async (careStatus) => {
    if (selectedFiles.length === 0) return;
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('organizationId', organizationId);
    formData.append('careStatus', careStatus);

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
      </div>

      <CareTargetActionBar 
        onInsertClick={() => setIsInsertModalOpen(true)}
        onUploadClick={() => setIsModalOpen(true)}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        handleReset={handleReset}
        filterStatus={filterStatus}
        handleFilterChange={handleFilterChange}
      />

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 py-3 px-4 text-sm font-semibold text-gray-600 text-center">
          <div>사진</div><div>이름</div><div>나이</div><div>질환</div><div>위험 점수</div><div>최근 통화</div><div>상태</div><div>관리</div>
        </div>
        <CareTarget 
          organizationId={organizationId} 
          setRefreshHandler={setRefreshCareList}
          filterStatus={filterStatus} 
          keyword={keywordParam}
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