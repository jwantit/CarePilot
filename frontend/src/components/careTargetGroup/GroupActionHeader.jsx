import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

const GroupActionHeader = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, onReset }) => (
  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
    <div className="relative w-full md:w-96">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        placeholder="그룹명 또는 타입 검색..."
        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <div className="flex items-center gap-3 w-full md:w-auto">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="bg-slate-50 border-none text-slate-600 font-semibold text-sm rounded-2xl px-4 py-3 outline-none cursor-pointer min-w-[150px] focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">전체 상태</option>
        <option value="active">스케줄 활성</option>
        <option value="inactive">스케줄 비활성</option>
      </select>
      
      <button
        onClick={onReset}
        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
        title="필터 초기화"
      >
        <RotateCcw size={22} />
      </button>
    </div>
  </div>
);

export default GroupActionHeader;