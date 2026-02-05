import React from 'react';
import { useStaffManagement } from '../../hooks/user/useStaffManagement';
import StaffListComponent from '../../components/user/StaffListComponent';
import Loading from '../../components/common/Loading';
import Breadcrumb from '../../components/common/Breadcrumb';

const UserManagementPage = () => {
  const { staffList, loading, handleStatusUpdate, handleRoleUpdate } = useStaffManagement();

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
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">직원 관리</h1>
        <p className="text-slate-400 text-sm">조직 내 직원의 승인, 권한, 상태를 관리할 수 있습니다.</p>
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
