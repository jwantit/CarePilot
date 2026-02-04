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
      case '예약됨': return 'bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50';
      case '완료됨': return 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/50';
      case '취소됨': return 'bg-gradient-to-br from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/50';
      default: return 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/50';
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-[600px] rounded-sm">
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
              <CalendarDays size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-200 tracking-tight">그룹 통화 스케줄</h2>
            </div>
          </div>
          
          {/* 권한 체크: ADMIN 혹은 MANAGER일 때만 스케줄 추가 버튼 노출 */}
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
            >
              스케줄 추가
            </button>
          )}
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-y-auto flex-1 modal-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-20">
              <Loader2 className="animate-spin border-4 border-slate-700 border-t-teal-400 rounded-full" size={32} />
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="w-20 h-20 bg-slate-900 border-2 border-slate-700 rounded flex items-center justify-center mb-5">
                <Calendar size={32} className="text-slate-600"/>
              </div>
              <p className="text-slate-300 font-mono font-semibold text-base mb-2">// No schedule found</p>
              <p className="text-slate-500 text-sm font-mono">// 등록된 스케줄이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 bg-slate-900 border-b-2 border-teal-500/30 z-10">
                <tr className="text-xs font-semibold text-slate-300 text-left">
                  <th className="px-8 py-3.5">
                    <div className="flex items-center gap-1 text-teal-400">
                      <RefreshCcw className="w-3.5 h-3.5" />
                      <span>유형 / 반복 정보</span>
                    </div>
                  </th>
                  <th className="px-8 py-3.5">
                    <div className="flex items-center gap-1 text-teal-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>시작 일시</span>
                    </div>
                  </th>
                  <th className="px-8 py-3.5 text-teal-400">우선도</th>
                  <th className="px-8 py-3.5 text-teal-400">메모</th>
                  <th className="px-8 py-3.5 text-teal-400">상태</th>
                  <th className="px-8 py-3.5 text-right text-teal-400">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-left">
                {schedules.map((s, idx) => (
                  <tr key={s.scheduleId || idx} className="hover:bg-slate-700/50 transition-colors group bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                    {/* 유형 및 반복상세 */}
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[11px] font-black flex items-center gap-1.5 ${s.type === '반복' ? 'text-teal-400' : 'text-slate-400'}`}>
                          {s.type === '반복' ? <RefreshCcw size={12} strokeWidth={3}/> : <Clock size={12} strokeWidth={3}/>}
                          {s.type}
                        </span>
                        {s.type === '반복' && (
                          <div className="flex flex-col text-[10px] font-bold text-slate-500">
                            <span>주기: {s.recurrence || '-'}</span>
                            <span className="text-[9px] text-slate-600 font-medium">종료: {s.recurrenceEndDate || '기한없음'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* 시작 일시 */}
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-200 block">{s.scheduledTime}</span>
                    </td>
                    {/* 우선도 */}
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-300 bg-gradient-to-br from-slate-900 to-slate-950 px-2.5 py-1 rounded-sm border border-slate-700 shadow-sm">
                        {s.priority}
                      </span>
                    </td>
                    {/* 메모 */}
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-400 truncate max-w-[180px] font-medium" title={s.memo}>
                        {s.memo || <span className="text-slate-600">-</span>}
                      </p>
                    </td>
                    {/* 상태 */}
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black border ${getStatusStyle(s.scheduleStatus)} shadow-sm`}>
                        {s.scheduleStatus}
                      </span>
                    </td>
                    {/* 관리 버튼: ADMIN 혹은 MANAGER일 때만 노출 */}
                    <td className="px-8 py-5 text-right">
                      {(role === 'ADMIN' || role === 'MANAGER') ? (
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => { setSelectedSchedule(s); setIsModalOpen(true); }} 
                            className="p-2 text-orange-400 hover:text-orange-300 bg-gradient-to-br from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 rounded-sm transition-all border border-orange-500/30 hover:border-orange-500/50 shadow-sm hover:shadow-md"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.scheduleId)} 
                            className="p-2 text-red-400 hover:text-red-300 bg-gradient-to-br from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 rounded-sm transition-all border border-red-500/30 hover:border-red-500/50 shadow-sm hover:shadow-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold italic">권한 없음</span>
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