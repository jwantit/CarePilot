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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="relative px-8 pt-12 pb-10 text-slate-800 bg-transparent">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button>
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-slate-100 rounded-2xl">
              {isEditMode ? <RefreshCcw size={28} className="text-amber-500" /> : <Calendar size={28} className="text-teal-600" />}
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">{isEditMode ? '스케줄 정보 수정' : '새 스케줄 등록'}</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 opacity-80">Update & Registration</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-7 text-left">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase ml-1">스케줄 유형 *</label>
            <div className="flex p-1.5 bg-slate-100 rounded-[22px] gap-1">
              {[{ v: 'ONE_TIME', l: '일회성', i: <Clock size={16}/> }, { v: 'RECURRING', l: '반복 설정', i: <RefreshCcw size={16}/> }].map((t) => (
                <button key={t.v} type="button" onClick={() => setForm({...form, type: t.v})}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] font-bold text-sm transition-all ${form.type === t.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {t.i} {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase ml-1">예약 시작 일시 *</label>
            <input type="datetime-local" required className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-700 focus:border-teal-500 outline-none"
              value={form.scheduledTime} onChange={(e) => setForm({...form, scheduledTime: e.target.value})} />
          </div>

          {form.type === 'RECURRING' && (
            <div className={`grid grid-cols-2 gap-4 p-6 rounded-[28px] border-2 ${isEditMode ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100'}`}>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">반복 주기 *</label>
                <select className="w-full p-3 bg-white border-none rounded-xl text-sm font-bold text-slate-700 shadow-sm"
                  value={form.recurrence} onChange={(e) => setForm({...form, recurrence: e.target.value})}>
                  <option value="DAILY">매일 (DAILY)</option>
                  <option value="WEEKLY">매주 (WEEKLY)</option>
                  <option value="MONTHLY">매월 (MONTHLY)</option>
                </select>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">종료일 (선택)</label>
                <input type="datetime-local" className="w-full p-3 bg-white border-none rounded-xl text-[12px] font-bold text-slate-700 shadow-sm"
                  value={form.recurrenceEndDate} onChange={(e) => setForm({...form, recurrenceEndDate: e.target.value})} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-1 space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase ml-1">우선도 *</label>
              <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-700 focus:border-teal-500 outline-none"
                value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
                <option value="LOW">낮음</option>
                <option value="MEDIUM">보통</option>
                <option value="HIGH">높음</option>
                <option value="URGENT">긴급</option>
              </select>
            </div>
            {/* 메모 입력 칸 복구 */}
            <div className="col-span-2 space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase ml-1">메모 (선택)</label>
              <div className="relative text-left">
                <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="추가 정보 입력" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-medium focus:border-teal-500 outline-none"
                  value={form.memo} onChange={(e) => setForm({...form, memo: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-[22px] font-black text-sm">취소</button>
            <button type="submit" 
              className={`flex-[2] py-4 rounded-[22px] font-black text-sm shadow-lg ${isEditMode ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-teal-600 text-white shadow-teal-100'}`}>
              {isEditMode ? '정보 수정하기' : '스케줄 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CareGroupAddScheduleModal;