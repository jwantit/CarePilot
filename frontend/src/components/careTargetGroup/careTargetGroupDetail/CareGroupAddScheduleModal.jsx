import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RefreshCcw, AlignLeft } from 'lucide-react';

const CareGroupAddScheduleModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    scheduledTime: '',
    type: 'ONE_TIME', 
    recurrence: 'WEEKLY', 
    recurrenceEndDate: '',
    priority: 'MEDIUM',
    memo: '' // 메모 필드 초기화
  });

  const isEditMode = !!initialData;

  const mapToEnum = (value, type) => {
    if (!value) return value;
    const maps = {
      type: { '일회성': 'ONE_TIME', '반복': 'RECURRING', 'ONE_TIME': 'ONE_TIME', 'RECURRING': 'RECURRING' },
      priority: { '낮음': 'LOW', '보통': 'MEDIUM', '높음': 'HIGH', '긴급': 'URGENT', 'LOW': 'LOW', 'MEDIUM': 'MEDIUM', 'HIGH': 'HIGH', 'URGENT': 'URGENT' },
      recurrence: { '주간': 'WEEKLY', '월간': 'MONTHLY', '일간': 'DAILY', '매주': 'WEEKLY', '매월': 'MONTHLY', '매일': 'DAILY', 'WEEKLY': 'WEEKLY', 'MONTHLY': 'MONTHLY', 'DAILY': 'DAILY' }
    };
    return maps[type][value] || value; 
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const formatForInput = (str) => str ? str.replace(' ', 'T').substring(0, 16) : '';
        setForm({
          scheduledTime: formatForInput(initialData.scheduledTime),
          type: mapToEnum(initialData.type, 'type'),
          recurrence: initialData.recurrence ? mapToEnum(initialData.recurrence, 'recurrence') : 'WEEKLY',
          recurrenceEndDate: formatForInput(initialData.recurrenceEndDate),
          priority: mapToEnum(initialData.priority, 'priority'),
          memo: initialData.memo || '' // 기존 메모 불러오기
        });
      } else {
        setForm({ scheduledTime: '', type: 'ONE_TIME', recurrence: 'WEEKLY', recurrenceEndDate: '', priority: 'MEDIUM', memo: '' });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const formatToDTO = (dt) => {
    if (!dt) return null;
    return dt.replace('T', ' ').substring(0, 16); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...(isEditMode && { scheduleId: initialData.scheduleId }),
      scheduledTime: formatToDTO(form.scheduledTime),
      type: form.type,
      priority: form.priority,
      memo: form.memo ? form.memo.trim() : null, // 메모 전송
      recurrence: form.type === 'RECURRING' ? form.recurrence : null,
      recurrenceEndDate: (form.type === 'RECURRING' && form.recurrenceEndDate) ? formatToDTO(form.recurrenceEndDate) : null,
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-cp-border bg-gradient-to-r from-cp-card to-cp-bg">
          <h3 className="text-xl font-bold text-cp-text flex items-center gap-2">
            {isEditMode ? <RefreshCcw size={24} className="text-amber-400" /> : <Calendar size={24} className="text-teal-400" />}
            {isEditMode ? '스케줄 정보 수정' : '새 스케줄 등록'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left modal-scrollbar">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-cp-text mb-1.5">스케줄 유형 *</label>
            <div className="flex gap-2">
              {[{ v: 'ONE_TIME', l: '일회성', i: <Clock size={16}/> }, { v: 'RECURRING', l: '반복 설정', i: <RefreshCcw size={16}/> }].map((t) => (
                <button key={t.v} type="button" onClick={() => setForm({...form, type: t.v})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-medium border transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    form.type === t.v 
                      ? 'bg-cp-input text-teal-400 border-teal-500/50 hover:border-teal-500' 
                      : 'bg-cp-input text-cp-muted border-cp-border hover:bg-cp-bg hover:text-cp-text'
                  }`}>
                  {t.i} {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-cp-text mb-1.5">예약 시작 일시 *</label>
            <input type="datetime-local" required className="w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
              value={form.scheduledTime} onChange={(e) => setForm({...form, scheduledTime: e.target.value})} />
          </div>

          {form.type === 'RECURRING' && (
            <div className={`grid grid-cols-2 gap-4 p-5 rounded-sm border ${isEditMode ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/30' : 'bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-500/30'}`}>
              <div className="space-y-2 text-left">
                <label className="block text-sm font-semibold text-cp-text mb-1.5">반복 주기 *</label>
                <select className="w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer transition-all"
                  value={form.recurrence} onChange={(e) => setForm({...form, recurrence: e.target.value})}>
                  <option value="DAILY" className="bg-cp-card">매일 (DAILY)</option>
                  <option value="WEEKLY" className="bg-cp-card">매주 (WEEKLY)</option>
                  <option value="MONTHLY" className="bg-cp-card">매월 (MONTHLY)</option>
                </select>
              </div>
              <div className="space-y-2 text-left">
                <label className="block text-sm font-semibold text-cp-text mb-1.5">종료일 (선택)</label>
                <input type="datetime-local" className="w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                  value={form.recurrenceEndDate} onChange={(e) => setForm({...form, recurrenceEndDate: e.target.value})} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-1 space-y-3">
              <label className="block text-sm font-semibold text-cp-text mb-1.5">우선도 *</label>
              <select className="w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer transition-all"
                value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
                <option value="LOW" className="bg-cp-card">낮음</option>
                <option value="MEDIUM" className="bg-cp-card">보통</option>
                <option value="HIGH" className="bg-cp-card">위험</option>
                <option value="URGENT" className="bg-cp-card">긴급</option>
              </select>
            </div>
            {/* 메모 입력 칸 */}
            <div className="col-span-2 space-y-3">
              <label className="block text-sm font-semibold text-cp-text mb-1.5">메모 (선택)</label>
              <div className="relative text-left">
                <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-cp-muted" size={18} />
                <input type="text" placeholder="추가 정보 입력" className="w-full pl-10 pr-4 py-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
                  value={form.memo} onChange={(e) => setForm({...form, memo: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-cp-input border border-cp-border text-cp-muted rounded-sm font-semibold hover:bg-cp-bg hover:text-cp-text transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">취소</button>
            <button type="submit" 
              className={`flex-[2] py-3 rounded-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                isEditMode 
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 border border-amber-500 text-white hover:from-amber-500 hover:to-amber-600' 
                  : 'bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white hover:from-teal-500 hover:to-teal-600'
              }`}>
              {isEditMode ? '정보 수정하기' : '스케줄 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CareGroupAddScheduleModal;
