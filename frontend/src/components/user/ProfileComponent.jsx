import React from 'react';
import { User, Mail, Phone, Building, Shield, Save, CreditCard } from 'lucide-react';

/** 전화번호를 010-XXXX-XXXX 형식으로 포맷 (숫자만 허용, 최대 11자리) */
const formatPhoneDisplay = (value) => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const ProfileComponent = ({ formData, handleChange, handleSave }) => {
  const inputClass = "w-full p-3 border border-cp-border rounded-sm bg-cp-input text-cp-text placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-sm text-sm";
  const disabledInputClass = "w-full p-3 border border-cp-border rounded-sm bg-cp-bg/50 text-cp-muted cursor-not-allowed text-sm font-medium";
  const labelClass = "flex items-center gap-2 text-sm font-bold text-cp-text mb-1.5 ml-1";

  return (
    <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="p-10 space-y-10">
        <div className="text-center space-y-2 mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20 mb-2">
            <User size={32} className="text-teal-400" />
          </div>
          <h1 className="text-2xl font-black text-cp-text tracking-tight">개인정보 수정</h1>
        </div>

        {/* 기본 정보 섹션 */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-cp-border/50">
            <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
            <h2 className="text-lg font-black text-cp-text uppercase tracking-tight">개인정보</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                <User size={16} className="text-teal-400/70" />
                이름
              </label>
              <input 
                name="name" 
                className={inputClass} 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="이름을 입력하세요"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Mail size={16} className="text-teal-400/70" />
                이메일
              </label>
              <input 
                name="email" 
                className={inputClass} 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Phone size={16} className="text-teal-400/70" />
                전화번호
              </label>
              <input
                name="phone"
                type="tel"
                maxLength={13}
                className={inputClass}
                value={formData.phone}
                onChange={(e) => handleChange({ target: { name: 'phone', value: formatPhoneDisplay(e.target.value) } })}
                placeholder="010-1234-5678"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Shield size={16} className="text-teal-400/70" />
                직책
              </label>
              <input className={disabledInputClass} value={formData.role} disabled />
            </div>
          </div>
        </div>

        {/* 조직 정보 섹션 */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-cp-border/50">
            <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
            <h2 className="text-lg font-black text-cp-text uppercase tracking-tight">소속 정보</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                <Building size={16} className="text-teal-400/70" />
                업체명
              </label>
              <input className={disabledInputClass} value={formData.organization} disabled />
            </div>
            <div>
              <label className={labelClass}>
                <CreditCard size={16} className="text-teal-400/70" />
                업체번호
              </label>
              <input className={disabledInputClass} value={formData.organizationNumber} disabled />
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="pt-6 border-t border-cp-border">
          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-black text-xl hover:from-teal-500 hover:to-teal-600 transition-all shadow-lg shadow-teal-900/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Save size={24} />
            수정 내용 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent;
