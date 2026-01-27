import React from 'react';
import { Plus, FileUp, Search, RotateCcw } from 'lucide-react';

function CareTargetActionBar({ 
  onInsertClick, 
  onUploadClick, 
  searchInput, 
  setSearchInput, 
  handleSearch, 
  handleReset, 
  filterStatus, 
  handleFilterChange 
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      {/* 왼쪽: 등록 및 업로드 버튼 그룹 */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onInsertClick}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm border border-[#006666] bg-[#008080] hover:bg-[#006666]"
        >
          <Plus size={18} />
          등록
        </button>
        
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm"
        >
          <FileUp size={18} />
          CSV/EXCEL 업로드
        </button>
      </div>

      {/* 오른쪽: 검색 및 필터 그룹 */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div className="relative flex-1 md:flex-none md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none transition-all text-sm"
            placeholder="검색 (이름 / 전화번호 / 질환)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <button 
          onClick={handleSearch}
          className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          검색
        </button>

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
          className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2.5 outline-none cursor-pointer h-[38px]"
        >
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
    </div>
  );
}

export default CareTargetActionBar;