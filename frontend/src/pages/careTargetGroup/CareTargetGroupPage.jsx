import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ClipboardList } from 'lucide-react';
import { getCareGroupList} from '../../api/caretarget/careTargetGroupApi';

import GroupActionHeader from '../../components/careTargetGroup/GroupActionHeader';
import GroupRow from '../../components/careTargetGroup/GroupRow';
import CreateGroupModal from '../../components/careTargetGroup/CreateGroupModal';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';

const CareTargetGroupPage = () => {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const role = user?.role; // ADMIN, MANAGER, USER 값 확인

  // 그룹 데이터 관리
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 검색, 활성, 비활성, 전체보기 필터
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGroups = async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const data = await getCareGroupList(organizationId);
      setGroups(data || []);
    } catch (error) {
      console.error("그룹 목록 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [organizationId]);

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && (group.groupStatus === 'ACTIVE' || group.groupStatus === '활성')) ||
        (filterStatus === 'inactive' && (group.groupStatus === 'INACTIVE' || group.groupStatus === '비활성'));

      const matchesSearch =
        group.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.groupType?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [groups, filterStatus, searchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={['케어 그룹']} />

      <GroupActionHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onReset={handleReset}
        onCreateGroup={() => setIsModalOpen(true)}
        role={role}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-80 text-cp-muted">
          <div className="w-12 h-12 border-4 border-cp-border border-t-teal-400 rounded-full animate-spin mb-4" />
          <p className="font-medium text-cp-muted font-mono">로딩 중...</p>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group, index) => (
            <GroupRow key={index} data={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-cp-card border border-cp-border shadow-xl rounded-sm">
          <ClipboardList className="mx-auto mb-4 text-cp-muted/40" size={64} />
          <p className="text-cp-muted font-semibold text-lg">검색 조건에 맞는 그룹이 없습니다.</p>
        </div>
      )}

      {/* 모달도 권한이 있는 경우에만 작동하도록 보호(안전장치) */}
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <CreateGroupModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          organizationId={organizationId}
        />
      )}
    </div>
  );
};

export default CareTargetGroupPage;
