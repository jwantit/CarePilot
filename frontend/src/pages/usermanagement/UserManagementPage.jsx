import React, { useState, useMemo } from 'react';
import { useStaffManagement } from '../../hooks/user/useStaffManagement';
import StaffListComponent from '../../components/user/StaffListComponent';
import Loading from '../../components/common/Loading';
import Breadcrumb from '../../components/common/Breadcrumb';
import { Search, RotateCcw } from 'lucide-react';

const UserManagementPage = () => {
  const { staffList, loading, handleStatusUpdate, handleRoleUpdate } = useStaffManagement();
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredStaffList = useMemo(() => {
    if (!searchKeyword.trim()) return staffList;
    const lowerKeyword = searchKeyword.toLowerCase().trim();
    return staffList.filter(member => 
      member.name?.toLowerCase().includes(lowerKeyword) ||
      member.email?.toLowerCase().includes(lowerKeyword) ||
      member.phone?.toLowerCase().includes(lowerKeyword)
    );
  }, [staffList, searchKeyword]);

  const handleSearch = () => {
    setSearchKeyword(searchInput);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchKeyword("");
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={["직원 관리"]} />

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-5 flex flex-wrap items-center gap-3 shadow-lg">
        {/* 검색 영역 */}
        <div className="relative flex-1 min-w-[300px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-slate-600 shadow-md focus:shadow-lg"
            placeholder="직원 검색 (이름 / 이메일 / 연락처)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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

      <StaffListComponent 
        staff={filteredStaffList} 
        onStatusUpdate={handleStatusUpdate}
        onRoleUpdate={handleRoleUpdate}
      />
    </div>
  );
};

export default UserManagementPage;
