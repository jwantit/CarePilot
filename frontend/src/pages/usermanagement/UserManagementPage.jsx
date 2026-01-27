import React from 'react';
import { useStaffManagement } from '../../hooks/user/useStaffManagement';
import StaffListComponent from '../../components/user/StaffListComponent';
import Loading from '../../components/common/Loading';

const UserManagementPage = () => {
  const { staffList, loading, handleStatusUpdate, handleRoleUpdate } = useStaffManagement();

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">직원 관리</h1>
        <p className="text-gray-500">조직 내 직원의 승인, 권한, 상태를 관리할 수 있습니다.</p>
      </div>

      <StaffListComponent 
        staff={staffList} 
        onStatusUpdate={handleStatusUpdate}
        onRoleUpdate={handleRoleUpdate}
      />
    </div>
  );
};

export default UserManagementPage;
