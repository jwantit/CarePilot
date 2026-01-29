import React, { useState } from 'react';
import { CheckCircle2, XCircle, PauseCircle, PlayCircle, Edit2, X, Check } from 'lucide-react';

const StaffListComponent = ({ staff, onStatusUpdate, onRoleUpdate }) => {
  const [editingRole, setEditingRole] = useState({});

  // 상태 한글 변환
  const getStatusLabel = (status) => {
    const statusMap = {
      ACTIVE: '활성',
      WAITING: '대기',
      DENIED: '거부',
      DISABLED: '비활성'
    };
    return statusMap[status] || status;
  };

  // 상태 색상 (기존 프로젝트 스타일에 맞춤)
  const getStatusColor = (status) => {
    const colorMap = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-300',
      WAITING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      DENIED: 'bg-red-100 text-red-700 border-red-300',
      DISABLED: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // 권한 한글 변환
  const getRoleLabel = (role) => {
    const roleMap = {
      ADMIN: '관리자',
      MANAGER: '매니저',
      USER: '일반 사용자'
    };
    return roleMap[role] || role;
  };

  // 날짜 포맷팅 (기존 프로젝트 형식과 동일)
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  const handleStatusClick = (userId, currentStatus) => {
    let newStatus;
    if (currentStatus === 'WAITING') {
      newStatus = 'ACTIVE';
    } else if (currentStatus === 'ACTIVE') {
      newStatus = 'DISABLED';
    } else if (currentStatus === 'DENIED' || currentStatus === 'DISABLED') {
      newStatus = 'ACTIVE';
    }
    
    if (newStatus && window.confirm(`상태를 "${getStatusLabel(newStatus)}"로 변경하시겠습니까?`)) {
      onStatusUpdate(userId, newStatus);
    }
  };

  const handleDenyClick = (userId) => {
    if (window.confirm('이 직원의 승인을 거부하시겠습니까?')) {
      onStatusUpdate(userId, 'DENIED');
    }
  };

  const handleRoleChange = (userId, newRole) => {
    if (window.confirm(`권한을 "${getRoleLabel(newRole)}"로 변경하시겠습니까?`)) {
      onRoleUpdate(userId, newRole);
      setEditingRole({ ...editingRole, [userId]: false });
    }
  };

  const cancelRoleEdit = (userId) => {
    setEditingRole({ ...editingRole, [userId]: false });
  };

  if (!staff || staff.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">등록된 직원이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[10%]">
                이름
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[18%]">
                이메일
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
                연락처
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
                권한
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[8%]">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[15%]">
                신청일
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[15%]">
                처리일
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((member) => (
              <tr 
                key={member.userId} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                  <div className="text-sm text-gray-600 truncate" title={member.email}>
                    {member.email}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                  <div className="text-sm text-gray-600 truncate">
                    {member.phone || '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingRole[member.userId] ? (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={member.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== member.role) {
                            handleRoleChange(member.userId, newRole);
                          } else {
                            cancelRoleEdit(member.userId);
                          }
                        }}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
                        autoFocus
                        onBlur={() => cancelRoleEdit(member.userId)}
                      >
                        <option value="USER">일반 사용자</option>
                        <option value="MANAGER">매니저</option>
                      </select>
                      <button
                        onClick={() => cancelRoleEdit(member.userId)}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="취소"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 whitespace-nowrap">{getRoleLabel(member.role)}</span>
                      {member.role !== 'ADMIN' && (
                        <button
                          onClick={() => setEditingRole({ ...editingRole, [member.userId]: true })}
                          className="text-[#008080] hover:text-[#006666] transition-colors p-1 rounded hover:bg-[#008080]/10 flex-shrink-0"
                          title="권한 변경"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(member.status)} whitespace-nowrap`}>
                    {getStatusLabel(member.status)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                  <div className="text-sm text-gray-600 truncate">
                    {formatDateTime(member.approvalRequestedAt)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap overflow-hidden">
                  <div className="text-sm text-gray-600 truncate">
                    {formatDateTime(member.approvalProcessedAt)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {member.status === 'WAITING' && (
                      <>
                        <button
                          onClick={() => handleStatusClick(member.userId, member.status)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-medium rounded-lg transition-colors shadow-sm min-w-[70px] justify-center"
                          title="승인"
                        >
                          <CheckCircle2 size={14} />
                          승인
                        </button>
                        <button
                          onClick={() => handleDenyClick(member.userId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors shadow-sm min-w-[70px] justify-center"
                          title="거부"
                        >
                          <XCircle size={14} />
                          거부
                        </button>
                      </>
                    )}
                    {member.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusClick(member.userId, member.status)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 text-xs font-medium rounded-lg transition-colors shadow-sm min-w-[70px] justify-center"
                        title="중지"
                      >
                        <PauseCircle size={14} />
                        중지
                      </button>
                    )}
                    {(member.status === 'DENIED' || member.status === 'DISABLED') && (
                      <button
                        onClick={() => handleStatusClick(member.userId, member.status)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-medium rounded-lg transition-colors shadow-sm min-w-[70px] justify-center"
                        title="활성화"
                      >
                        <PlayCircle size={14} />
                        활성화
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffListComponent;
