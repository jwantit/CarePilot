import React from 'react';
import { Plus, FileUp, Search, RotateCcw, Phone, Trash2, Upload, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

function CareTargetActionBar({ 
  onInsertClick, 
  onUploadClick, 
  searchInput, 
  setSearchInput, 
  handleSearch, 
  handleReset,
  onActionClick,
  selectedCount = 0
}) {

  const { user } = useAuth();
  const role = user?.role; // ADMIN, MANAGER, USER 값 확인

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-5 mb-6 space-y-4 shadow-lg hover:shadow-xl transition-shadow">
      {/* 상단: 검색 영역 - 터미널 스타일 */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-600 shadow-md focus:shadow-lg"
            placeholder="검색 (이름 / 전화번호 / 질환)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <button 
          onClick={handleSearch}
          className="bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 px-6 py-2.5 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="font-mono text-teal-400">&gt;</span> 검색
        </button>

        <button 
          onClick={handleReset}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 text-slate-300 text-sm font-semibold hover:from-slate-800 hover:to-slate-900 hover:border-slate-500 hover:text-slate-100 transition-all whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <RotateCcw size={14} />
          전체보기
        </button>
      </div>

      {/* 하단: 체크 숫자, 통화/삭제 버튼, 환자 등록 버튼 */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-700">
        {/* 왼쪽: 체크 숫자와 통화/삭제 버튼 */}
        <div className="flex items-center gap-3">
          {/* 체크 숫자 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/50 shadow-md">
            <span className="text-teal-400 text-sm font-semibold">
              <span className="font-mono">[{selectedCount}]</span> 선택됨
            </span>
          </div>

          {/* 통화하기, 삭제하기 버튼 */}
          <button 
            onClick={() => onActionClick("CALL")}
            className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-green-400 px-5 py-2.5 font-semibold transition-all border border-green-500/50 hover:border-green-500 whitespace-nowrap text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Phone size={18} />
            통화하기
          </button>

          {(role === 'ADMIN' || role === 'MANAGER') && (
            <button 
              onClick={() => onActionClick("DELETE")}
              className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-red-400 px-5 py-2.5 font-semibold transition-all border border-red-500/50 hover:border-red-500 whitespace-nowrap text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Trash2 size={18} />
              삭제하기
            </button>
          )}
        </div>

        {/* 오른쪽 끝: 환자 등록, CSV 업로드 버튼 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onInsertClick}
            className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 px-5 py-2.5 font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <UserPlus size={18} />
            대상자 등록
          </button>
          
          <button 
            onClick={onUploadClick}
            className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-slate-300 px-5 py-2.5 font-semibold transition-all border border-slate-600 hover:border-slate-500 whitespace-nowrap text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Upload size={18} />
            CSV/EXCEL 업로드
          </button>
        </div>
      </div>
    </div>
  );
}

export default CareTargetActionBar;
