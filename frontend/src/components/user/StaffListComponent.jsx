import React from 'react';
import { CheckCircle2, XCircle, Users } from 'lucide-react';

const StaffListComponent = ({ staff, onStatusUpdate, onRoleUpdate }) => {

  // 상태 한글 변환
  const getStatusLabel = (status) => {
    const statusMap = {
      ACTIVE: '활성',
      WAITING: '대기',
      DENIED: '거부',
      DISABLED: '탈퇴'
    };
    return statusMap[status] || status;
  };

  // 상태 색상 (기존 프로젝트 스타일에 맞춤)
  const getStatusColor = (status) => {
    const colorMap = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      WAITING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      DENIED: 'bg-red-500/10 text-red-400 border-red-500/30',
      DISABLED: 'bg-cp-bg/50 text-cp-muted border-cp-border'
    };
    return colorMap[status] || 'bg-cp-bg text-cp-text border-cp-border';
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
    
    let confirmMsg = `상태를 "${getStatusLabel(newStatus)}"로 변경하시겠습니까?`;
    if (currentStatus === 'ACTIVE' && newStatus === 'DISABLED') {
      confirmMsg = '이 직원을 탈퇴 처리하시겠습니까?';
    } else if ((currentStatus === 'DENIED' || currentStatus === 'DISABLED') && newStatus === 'ACTIVE') {
      confirmMsg = '이 직원을 복구하시겠습니까?';
    } else if (currentStatus === 'WAITING' && newStatus === 'ACTIVE') {
      confirmMsg = '이 직원을 승인하시겠습니까?';
    }
    if (newStatus && window.confirm(confirmMsg)) {
      onStatusUpdate(userId, newStatus);
    }
  };

  const handleDenyClick = (userId) => {
    if (window.confirm('이 직원의 승인을 거부하시겠습니까?')) {
      onStatusUpdate(userId, 'DENIED');
    }
  };

  const handleRoleChange = (userId, newRole, currentRole) => {
    if (newRole === currentRole) return;
    if (window.confirm(`권한을 "${getRoleLabel(newRole)}"로 변경하시겠습니까?`)) {
      onRoleUpdate(userId, newRole);
    }
  };

  if (!staff || staff.length === 0) {
    return (
      <div className="bg-cp-card border border-cp-border rounded-sm p-20 text-center shadow-lg">
        <div className="text-cp-muted mb-4 flex justify-center">
          <Users size={64} className="opacity-20" />
        </div>
        <p className="text-cp-muted text-lg font-bold">등록된 직원이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-cp-card border border-cp-border rounded-sm shadow-xl overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto modal-scrollbar">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <thead className="bg-cp-header border-b-2 border-teal-500/30 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[10%] bg-cp-header border-b-2 border-teal-500/30">
                이름
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[18%] bg-cp-header border-b-2 border-teal-500/30">
                이메일
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[12%] bg-cp-header border-b-2 border-teal-500/30">
                연락처
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[12%] bg-cp-header border-b-2 border-teal-500/30">
                권한
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[8%] bg-cp-header border-b-2 border-teal-500/30">
                상태
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[15%] bg-cp-header border-b-2 border-teal-500/30">
                신청일
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[15%] bg-cp-header border-b-2 border-teal-500/30">
                처리일
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-black text-white dark:text-teal-400 uppercase tracking-widest w-[12%] bg-cp-header border-b-2 border-teal-500/30">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cp-border">
            {staff.map((member) => (
              <tr 
                key={member.userId} 
                className="hover:bg-cp-bg/30 transition-colors bg-cp-card/30"
              >
                <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-center">
                  <div className="text-sm font-bold text-cp-text truncate">
                    {member.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-center">
                  <div className="text-sm text-cp-muted truncate font-mono" title={member.email}>
                    {member.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-center">
                  <div className="text-sm text-cp-text truncate font-mono">
                    {member.phone || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {member.role === 'ADMIN' ? (
                    <span className="text-sm text-cp-text font-bold whitespace-nowrap">{getRoleLabel(member.role)}</span>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value, member.role)}
                      className="bg-cp-input border border-cp-border rounded-sm px-3 py-1.5 text-xs text-cp-text font-bold focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                    >
                      <option value="USER">일반 사용자</option>
                      <option value="MANAGER">매니저</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-sm text-[11px] font-black border ${getStatusColor(member.status)} whitespace-nowrap`}>
                    {getStatusLabel(member.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-center">
                  <div className="text-xs text-cp-muted truncate font-mono">
                    {formatDateTime(member.approvalRequestedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-center">
                  <div className="text-xs text-cp-muted truncate font-mono">
                    {formatDateTime(member.approvalProcessedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {member.status === 'WAITING' && (
                      <>
                        <button
                          onClick={() => handleStatusClick(member.userId, member.status)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-black rounded-sm border border-teal-500 transition-all shadow-md active:scale-95"
                          title="승인"
                        >
                          <CheckCircle2 size={14} />
                          승인
                        </button>
                        <button
                          onClick={() => handleDenyClick(member.userId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cp-bg hover:bg-cp-card text-red-400 text-xs font-bold rounded-sm border border-red-500/30 hover:border-red-500 transition-all shadow-md active:scale-95"
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
                        className="px-3 py-1.5 bg-cp-bg hover:bg-cp-card text-amber-400 text-xs font-bold rounded-sm border border-amber-500/30 hover:border-amber-500 transition-all shadow-md active:scale-95"
                        title="탈퇴 처리"
                      >
                        탈퇴 처리
                      </button>
                    )}
                    {(member.status === 'DENIED' || member.status === 'DISABLED') && (
                      <button
                        onClick={() => handleStatusClick(member.userId, member.status)}
                        className="px-3 py-1.5 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-black rounded-sm border border-teal-500 transition-all shadow-md active:scale-95"
                        title="복구"
                      >
                        복구
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
