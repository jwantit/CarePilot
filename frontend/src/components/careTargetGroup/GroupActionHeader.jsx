import React from 'react';
import { Search, RotateCcw, Plus } from 'lucide-react';

const GroupActionHeader = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, onReset, onCreateGroup, role }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-5 mb-6 shadow-lg hover:shadow-xl transition-shadow">
    <div className="flex flex-col md:flex-row items-center gap-2">
      {/* 왼쪽: 그룹 생성 버튼 */}
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <button 
          onClick={onCreateGroup}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 px-5 h-[42px] font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus size={18} />
          그룹 생성
        </button>
      )}

      {/* 오른쪽: 검색창, 전체보기 버튼 */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="그룹명 또는 타입 검색..."
            className="w-full pl-10 pr-3 h-[42px] border border-slate-600 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-600 shadow-md focus:shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-5 h-[42px] bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-slate-600 text-slate-300 text-sm font-semibold hover:border-slate-500 hover:text-slate-100 transition-all whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          title="필터 초기화"
        >
          <RotateCcw size={14} />
          전체보기
        </button>
      </div>
    </div>
  </div>
);

export default GroupActionHeader;