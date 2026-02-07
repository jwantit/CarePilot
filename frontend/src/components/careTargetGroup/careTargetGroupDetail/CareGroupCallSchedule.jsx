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
      case '취소됨': return 'bg-cp-bg/50 text-cp-muted border border-cp-border/50';
      default: return 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/50';
    }
  };

  const getRecurrenceLabel = (s) => {
    if (s.type !== '반복') return '일회성';
    const recurrenceMap = {
      'DAILY': '일간 반복',
      'WEEKLY': '주간 반복',
      'MONTHLY': '월간 반복'
    };
    return recurrenceMap[s.recurrence] || `${s.recurrence || ''} 반복`;
  };

  return (
    <>
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-[600px] rounded-sm">
        {/* 헤더 */}
        <div className="p-6 border-b border-cp-border flex justify-between items-center bg-cp-bg/30 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
              <CalendarDays size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-cp-text tracking-tight">그룹 통화 스케줄</h2>
            </div>
          </div>
          
          {/* 권한 체크: ADMIN 혹은 MANAGER일 때만 스케줄 추가 버튼 노출 */}
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-5 py-2.5 bg-cp-input hover:bg-cp-bg text-teal-400 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
            >
              스케줄 추가
            </button>
          )}
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-y-auto flex-1 modal-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-cp-bg/60 z-20">
              <div className="w-12 h-12 border-4 border-cp-border border-t-teal-400 rounded-full animate-spin" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-cp-muted">
              <div className="w-20 h-20 bg-cp-bg border-2 border-cp-border rounded flex items-center justify-center mb-5">
                <Calendar size={32} className="text-cp-muted/40"/>
              </div>
              <p className="text-cp-text font-mono font-semibold text-base mb-2">// No schedule found</p>
              <p className="text-cp-muted text-sm font-mono">// 등록된 스케줄이 없습니다.</p>
            </div>
          ) : (
            <div className="w-full">
              {/* 헤더 - CareTarget 스타일 동일 적용 (6열) */}
              <div className="grid grid-cols-6 bg-cp-header border-b-2 border-teal-500/30 py-3.5 px-4 text-sm font-semibold text-white dark:text-cp-text text-center items-center min-h-[48px] sticky top-0 z-10">
                <div className="text-white dark:text-teal-400">유형 / 반복 정보</div>
                <div className="text-white dark:text-teal-400">시작 일시</div>
                <div className="text-white dark:text-teal-400">우선도</div>
                <div className="text-white dark:text-teal-400">메모</div>
                <div className="text-white dark:text-teal-400">상태</div>
                <div className="text-white dark:text-teal-400">관리</div>
              </div>

              {/* 데이터 행 */}
              <div className="">
                {schedules.map((s, idx) => (
                  <div
                    key={s.scheduleId || idx}
                    onClick={() => { setSelectedSchedule(s); setIsModalOpen(true); }}
                    className="grid grid-cols-6 py-3 px-4 text-sm text-center items-center min-h-[60px] bg-cp-card/30 hover:bg-cp-bg/50 transition border-b border-cp-border cursor-pointer group"
                  >
                    {/* 유형 및 반복상세 */}
                    <div className="flex items-center justify-center h-full">
                      <span className={`text-xs ${s.type === '반복' ? 'text-teal-400' : 'text-cp-muted'}`}>
                        {getRecurrenceLabel(s)}
                      </span>
                    </div>

                    {/* 시작 일시 */}
                    <div className="flex items-center justify-center h-full">
                      <span className="text-sm text-cp-text">{s.scheduledTime}</span>
                    </div>

                    {/* 우선도 */}
                    <div className="flex items-center justify-center h-full">
                      <span className="text-[13px] text-cp-text bg-cp-input px-3 py-1.5 rounded-sm border border-cp-border shadow-sm">
                        {s.priority}
                      </span>
                    </div>

                    {/* 메모 */}
                    <div className="flex items-center justify-center h-full px-2">
                      <p className="text-sm text-cp-muted truncate w-full" title={s.memo}>
                        {s.memo || <span className="text-cp-muted/40">-</span>}
                      </p>
                    </div>

                    {/* 상태 */}
                    <div className="flex items-center justify-center h-full">
                      <span className={`px-3 py-1.5 rounded-sm text-[13px] border ${getStatusStyle(s.scheduleStatus)} shadow-sm`}>
                        {s.scheduleStatus}
                      </span>
                    </div>

                    {/* 관리 버튼 */}
                    <div className="flex justify-center gap-1.5">
                      {(role === 'ADMIN' || role === 'MANAGER') ? (
                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedSchedule(s); setIsModalOpen(true); }} 
                            className="cp-link-blue"
                          >
                            수정
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.scheduleId); }} 
                            className="cp-link-red"
                          >
                            삭제
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-cp-muted italic">권한 없음</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
