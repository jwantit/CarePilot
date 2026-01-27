import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, ClipboardList } from 'lucide-react';
import { getCareGroupList} from '../../api/caretarget/careTargetGroupApi';

import GroupActionHeader from '../../components/careTargetGroup/GroupActionHeader';
import GroupRow from '../../components/careTargetGroup/GroupRow';
import CreateGroupModal from '../../components/careTargetGroup/CreateGroupModal';
import { useAuth } from '../../hooks/useAuth';

const CareTargetGroupPage = () => {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  //그룹 데이터 -> 그룹 Row -> props
  const [groups, setGroups] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  //검색, 활성, 비활성, 전체보기 필터-------------------------
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  //------------------------------------


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
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/30">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">케어 대상자 그룹 관리</h1>
          <p className="text-slate-500 font-medium">그룹을 생성하고 효율적으로 관리하세요.</p>
        </div>
        
        {/* 그룹 생성 버튼 - 틸(#008080) 컬러 적용 */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
          style={{ 
            backgroundColor: '#008080',
            boxShadow: '0 10px 15px -3px rgba(0, 128, 128, 0.2)' 
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#006666'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#008080'}
        >
          <Plus size={20} />
          그룹 생성
        </button>
      </div>

      <GroupActionHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onReset={handleReset}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-80 text-slate-400">
          {/* 로딩 아이콘도 틸 컬러로 변경 */}
          <Loader2 className="animate-spin mb-4" size={48} style={{ color: '#008080' }} />
          <p className="font-medium text-slate-600">그룹 데이터를 불러오는 중입니다...</p>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGroups.map((group, index) => (
            <GroupRow key={index} data={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
          <ClipboardList className="mx-auto mb-4 text-slate-200" size={64} />
          <p className="text-slate-400 font-semibold text-lg">검색 조건에 맞는 그룹이 없습니다.</p>
        </div>
      )}

      <CreateGroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        organizationId={organizationId}
      />
    </div>
  );
};

export default CareTargetGroupPage;