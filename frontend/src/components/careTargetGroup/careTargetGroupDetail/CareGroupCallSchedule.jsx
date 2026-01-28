import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, RefreshCcw, Loader2, Edit2, Trash2, CalendarDays } from 'lucide-react';
import { getCareGroupCallScheduleList, addCareTargetGroupCallSchedule, deleteGroupSchedule } from '../../../api/caretarget/careTargetGroupApi';
import CareGroupAddScheduleModal from './CareGroupAddScheduleModal';
import { useAuth } from '../../../hooks/useAuth';

const CareGroupCallSchedule = ({ organizationId, groupId }) => {
  const { user } = useAuth();
  const role = user?.role; // ADMIN, MANAGER, USER 값 확인

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const fetchSchedules = useCallback(async () => {
    if (!organizationId || !groupId) return;
    try {
      setLoading(true);
      const data = await getCareGroupCallScheduleList(organizationId, groupId);
      setSchedules(data || []);
    } catch (error) {
      console.error("조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, groupId]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleFormSubmit = async (formData) => {
    const payload = {
      organizationId: Number(organizationId),
      groupId: Number(groupId),
      ...formData
    };

    try {
      await addCareTargetGroupCallSchedule(payload);
      alert(formData.scheduleId ? "스케줄이 수정되었습니다." : "새 스케줄이 등록되었습니다.");
      handleCloseModal();
      fetchSchedules();
    } catch (error) {
      alert("요청 실패: " + (error.response?.data?.message || "서버 오류"));
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("이 스케줄을 삭제하시겠습니까?\n반복 스케줄의 경우 향후 일정이 모두 삭제됩니다.")) return;
    try {
      await deleteGroupSchedule(Number(groupId), Number(scheduleId));
      alert("삭제되었습니다.");
      fetchSchedules();
    } catch (error) {
      alert("삭제 실패");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case '예약됨': return 'bg-teal-50 text-teal-600 border-teal-100';
      case '완료됨': return 'bg-blue-50 text-blue-600 border-blue-100';
      case '취소됨': return 'bg-slate-50 text-slate-400 border-slate-200';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <>
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* 헤더 */}
        <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-2xl">
              <CalendarDays className="text-teal-600" size={22} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">그룹 통화 스케줄</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Group Call Management</p>
            </div>
          </div>
          
          {/* 권한 체크: ADMIN 혹은 MANAGER일 때만 스케줄 추가 버튼 노출 */}
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-6 py-3.5 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-100 active:scale-95 transition-all hover:bg-teal-700"
            >
              스케줄 추가
            </button>
          )}
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-y-auto flex-1 custom-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20">
              <Loader2 className="animate-spin text-teal-600" size={32} />
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <Calendar size={48} className="opacity-10 mb-4"/>
              <p className="font-bold text-slate-400">등록된 스케줄이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
                <tr className="text-slate-400 text-[11px] font-black uppercase tracking-widest text-left">
                  <th className="px-8 py-4 border-b border-slate-100">유형 / 반복 정보</th>
                  <th className="px-8 py-4 border-b border-slate-100">시작 일시</th>
                  <th className="px-8 py-4 border-b border-slate-100">우선도</th>
                  <th className="px-8 py-4 border-b border-slate-100">메모</th>
                  <th className="px-8 py-4 border-b border-slate-100">상태</th>
                  <th className="px-8 py-4 text-right border-b border-slate-100">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-left">
                {schedules.map((s, idx) => (
                  <tr key={s.scheduleId || idx} className="hover:bg-slate-50/50 transition-colors group">
                    {/* 유형 및 반복상세 */}
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[11px] font-black flex items-center gap-1.5 ${s.type === '반복' ? 'text-teal-600' : 'text-slate-500'}`}>
                          {s.type === '반복' ? <RefreshCcw size={12} strokeWidth={3}/> : <Clock size={12} strokeWidth={3}/>}
                          {s.type}
                        </span>
                        {s.type === '반복' && (
                          <div className="flex flex-col text-[10px] font-bold text-slate-400">
                            <span>주기: {s.recurrence || '-'}</span>
                            <span className="text-[9px] text-slate-300 font-medium">종료: {s.recurrenceEndDate || '기한없음'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* 시작 일시 */}
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-700 block">{s.scheduledTime}</span>
                    </td>
                    {/* 우선도 */}
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {s.priority}
                      </span>
                    </td>
                    {/* 메모 */}
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-500 truncate max-w-[180px] font-medium" title={s.memo}>
                        {s.memo || <span className="text-slate-200">-</span>}
                      </p>
                    </td>
                    {/* 상태 */}
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusStyle(s.scheduleStatus)}`}>
                        {s.scheduleStatus}
                      </span>
                    </td>
                    {/* 관리 버튼: ADMIN 혹은 MANAGER일 때만 노출 */}
                    <td className="px-8 py-5 text-right">
                      {(role === 'ADMIN' || role === 'MANAGER') ? (
                        <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedSchedule(s); setIsModalOpen(true); }} 
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.scheduleId)} 
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold italic">권한 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* 권한이 있는 경우에만 모달 렌더링 (안전장치) */}
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <CareGroupAddScheduleModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSubmit={handleFormSubmit} 
          initialData={selectedSchedule} 
        />
      )}
    </>
  );
};

export default CareGroupCallSchedule;