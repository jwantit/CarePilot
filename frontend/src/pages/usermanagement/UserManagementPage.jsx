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

      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-5 flex flex-wrap items-center gap-3 shadow-lg">
        {/* 검색 영역 */}
        <div className="relative flex-1 min-w-[300px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-cp-muted">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-cp-border bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-cp-muted shadow-md focus:shadow-lg"
            placeholder="직원 검색 (이름 / 이메일 / 연락처)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <button
          onClick={handleSearch}
          className="bg-cp-input hover:bg-cp-bg text-teal-400 px-6 py-2.5 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="font-mono text-teal-400">&gt;</span> 검색
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-cp-input border border-cp-border text-cp-muted text-sm font-semibold hover:bg-cp-bg hover:border-cp-border hover:text-cp-text transition-all whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
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
