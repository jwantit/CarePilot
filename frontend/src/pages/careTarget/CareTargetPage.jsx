import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, FileUp, Search, RotateCcw } from 'lucide-react'; // RotateCcw 아이콘 추가
import CareTarget from '../../components/caretarget/CareTarget';
import CareTargetUploadModal from '../../components/caretarget/CareTargetUploadModal';
import CareTargetInsertModal from '../../components/caretarget/CareTargetInsertModal';
// uploadOneCareTarget(단일등록) 추가
import { uploadCsvCareTarget, uploadOneCareTarget } from '../../api/caretarget/careTargetApi';

function CareTargetPage() {

  const user = useSelector((state) => state.auth.user);

  const organizationId = user?.organizationId;


  // 필터 및 검색 파라미터 관리
  const [searchParams, setSearchParams] = useSearchParams();

  // URL에서 status와 keyword를 가져옴 (기본값 설정)
  const filterStatus = searchParams.get('status') || 'all';
  const keywordParam = searchParams.get('keyword') || '';

  // 입력창의 텍스트를 임시로 담을 로컬 상태
  const [searchInput, setSearchInput] = useState(keywordParam);

  // 필터(전체, 활성, 비활성) 변경 핸들러
  const handleFilterChange = (e) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete('status'); // 전체일 때는 파라미터 삭제
    } else {
      newParams.set('status', value); // 활성/비활성일 때 값 세팅
    }
    setSearchParams(newParams);
  };

  // 검색 실행 핸들러 (버튼 클릭 / 엔터 입력)
  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim() === '') {
      newParams.delete('keyword'); // 검색어가 없으면 파라미터 삭제
    } else {
      newParams.set('keyword', searchInput); // 검색어 세팅
    }
    setSearchParams(newParams);
  };

  // 추가: 전체보기(초기화) 핸들러 ----------------------
  const handleReset = () => {
    setSearchInput(''); // 입력창 비우기
    setSearchParams({}); // URL 파라미터(?status=...&keyword=...) 모두 삭제하여 전체보기 상태로 전환
  };
  // ------------------------------------------------

  // 대량 등록 업로드 모달 CSV / EXCEL
  const [isModalOpen, setIsModalOpen] = useState(false);
  // CSV / EXCEL 임시 저장
  const [selectedFiles, setSelectedFiles] = useState([]);
  // 로딩
  const [isUploading, setIsUploading] = useState(false);
  // 케어대상자 단일 등록 모달 활성화 상태
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);

  // 자식 컴포넌트의 리스트 갱신 함수를 담을 상태
  const [refreshCareList, setRefreshCareList] = useState(null);

  // 대량 등록 API-----------------------------------
  const handleUpload = async (careStatus) => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('organizationId', organizationId);
    // 추가: 백엔드 @RequestParam("careStatus")와 매칭
    formData.append('careStatus', careStatus);

    setIsUploading(true);
    try {
      await uploadCsvCareTarget(formData);
      alert("데이터 업로드가 완료되었습니다.");
      setIsModalOpen(false);
      setSelectedFiles([]);
      
      // 자식 컴포넌트(CareTarget)의 목록 새로고침 호출
      if (refreshCareList) refreshCareList();
    } catch (error) {
      console.error("업로드 에러:", error);
      alert("업로드 중 오류가 발생했습니다. 파일 내용을 확인해주세요.");
    } finally {
      setIsUploading(false);
    }
  };
  //--------------------------------------------


  // 단일등록 API-----------------------------------
  const handleInsert = async (formData) => {
    setIsUploading(true);
    try {
      // API 함수명 매칭 확인 (uploadOneCareTarget)
      await uploadOneCareTarget(formData);
      alert("환자 등록이 완료되었습니다.");
      setIsInsertModalOpen(false);
      
      if (refreshCareList) refreshCareList();
    } catch (error) {
      console.error("등록 에러:", error);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };
  //---------------------------------------------

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">케어 대상자 관리</h1>
        <p className="text-gray-500">케어 대상자 정보를 등록하고 관리할 수 있습니다.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsInsertModalOpen(true)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm border border-[#006666] bg-[#008080] hover:bg-[#006666]"
          >
            <Plus size={18} />
            등록
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm"
          >
            <FileUp size={18} />
            CSV/EXCEL 업로드
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* 검색 입력창 섹션 */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none transition-all text-sm"
              placeholder="검색 (이름 / 전화번호 / 질환)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // 엔터키로 검색 실행
            />
          </div>
          
          {/* 검색 버튼 */}
          <button 
            onClick={handleSearch}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            검색
          </button>

          {/* 추가된 전체보기(초기화) 버튼 */}
          <button 
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-[#008080] transition-all shadow-sm"
            title="검색 및 필터 초기화"
          >
            <RotateCcw size={14} />
            전체보기
          </button>

          <select 
            value={filterStatus}
            onChange={handleFilterChange}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2.5 outline-none cursor-pointer"
          >
            <option value="all">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 py-3 px-4 text-sm font-semibold text-gray-600 text-center">
          <div>사진</div>
          <div>이름</div>
          <div>나이</div>
          <div>질환</div>
          <div>위험 점수</div>
          <div>최근 통화</div>
          <div>상태</div>
          <div>관리</div>
        </div>
        
        <CareTarget 
          organizationId={organizationId} 
          setRefreshHandler={setRefreshCareList}
          filterStatus={filterStatus} 
          keyword={keywordParam} // 검색 키워드를 자식에게 전달
        />
      </div>

      <CareTargetUploadModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFiles([]);
        }}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onUpload={handleUpload} 
        isUploading={isUploading}
      />

       <CareTargetInsertModal 
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
        organizationId={organizationId}
        onInsert={handleInsert}
        isUploading={isUploading}
      />
    </div>
  );
}

export default CareTargetPage;


