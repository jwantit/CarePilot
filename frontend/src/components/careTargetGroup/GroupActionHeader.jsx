import React from 'react';
import { Search, RotateCcw, Plus } from 'lucide-react';

const GroupActionHeader = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, onReset, onCreateGroup, role }) => (
  <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-5 mb-6 shadow-lg hover:shadow-xl transition-shadow rounded-sm">
    <div className="flex flex-col md:flex-row items-center gap-2">
      {/* 왼쪽: 그룹 생성 버튼 */}
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <button 
          onClick={onCreateGroup}
          className="flex items-center justify-center gap-2 bg-cp-input hover:bg-cp-bg text-teal-400 px-5 h-[42px] font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
        >
          <Plus size={18} />
          그룹 생성
        </button>
      )}

      {/* 오른쪽: 검색창, 전체보기 버튼 */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cp-muted" size={18} />
          <input
            type="text"
            placeholder="그룹명 또는 타입 검색..."
            className="w-full pl-10 pr-3 h-[42px] border border-cp-border bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-cp-muted shadow-md focus:shadow-lg rounded-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-5 h-[42px] bg-cp-input hover:bg-cp-bg border border-cp-border text-cp-text text-sm font-semibold hover:border-cp-border hover:text-cp-text transition-all whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
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
