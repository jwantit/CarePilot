import React from 'react';
import { User as UserIcon, Camera, HeartPulse, Phone, Stethoscope, ShieldCheck, X } from 'lucide-react';
import { getFileUrl } from '../../../hooks/fileHelper';


const ProfileSection = ({ data, isEditing, onChange, onDoctorChange, onImageChange, onRemoveImage, previewUrl, fileInputRef, doctors, imgError, setImgError }) => {
  const originalImageUrl = data?.file ? getFileUrl(data.file) : null;

  return (
    <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-lg hover:shadow-xl transition-shadow w-full flex flex-col">
      {/* 프로필 헤더 섹션 */}
      <div className="p-8 pb-6 border-b border-cp-border/50">
        <div className="flex flex-col items-center">
          {/* 이미지 영역 */}
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-sm border-2 border-cp-border bg-cp-input flex items-center justify-center overflow-hidden shadow-md group">
              {(previewUrl || (originalImageUrl && !imgError)) ? (
                <img 
                  src={previewUrl || originalImageUrl} 
                  alt="프로필" 
                  className="w-full h-full object-cover" 
                  onError={() => setImgError(true)} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full bg-cp-input text-cp-muted">
                  <UserIcon size={56} strokeWidth={1.5} />
                </div>
              )}
              {isEditing && (
                <div 
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="text-white" size={28} />
                </div>
              )}
            </div>
            {isEditing && (previewUrl || originalImageUrl) && (
              <button onClick={onRemoveImage} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-sm flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                <X size={16} />
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onImageChange} />
          </div>

          {/* 이름 및 기본 정보 */}
          {isEditing ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <input name="name" value={data.name} onChange={onChange} className="text-center text-2xl font-black border-b-2 border-teal-400 outline-none bg-transparent w-full max-w-xs text-cp-text" />
              <div className="flex gap-2 mt-1">
                <input name="age" type="number" value={data.age} onChange={onChange} className="w-12 text-center text-sm font-bold border-b border-cp-border outline-none bg-transparent text-cp-text" />
                <select name="gender" value={data.gender} onChange={onChange} className="text-sm font-bold border-b border-cp-border outline-none bg-transparent text-cp-text">
                  <option value="남성" className="bg-cp-bg">남성</option><option value="여성" className="bg-cp-bg">여성</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-black text-cp-text tracking-tight mb-2">{data.name}</h2>
              <p className="px-3 py-1 bg-cp-input rounded-sm text-xs font-bold text-cp-muted shadow-sm border border-cp-border inline-block">{data.age}세 · {data.gender}</p>
            </div>
          )}
        </div>
      </div>

      {/* 상세 정보 섹션 */}
      <div className="p-6 space-y-4 flex-1">
        <DetailItem icon={<HeartPulse size={16}/>} label="주요 질환" color="rose">
          {isEditing ? <input name="disease" value={data.disease} onChange={onChange} className="w-full border-b border-cp-border py-1 font-bold text-sm outline-none bg-transparent text-cp-text focus:border-teal-400" /> : <p className="font-bold text-cp-text text-sm">{data.disease || "기록 없음"}</p>}
        </DetailItem>
        
        <DetailItem icon={<Phone size={16}/>} label="대상자 연락처" color="teal">
          {isEditing ? <input name="targetPhone" value={data.targetPhone} onChange={onChange} className="w-full border-b border-cp-border py-1 font-bold text-sm outline-none bg-transparent text-cp-text focus:border-teal-400" /> : <p className="font-bold text-cp-text text-sm">{data.targetPhone}</p>}
        </DetailItem>

        <DetailItem icon={<Stethoscope size={16}/>} label="담당 의료진" color="blue">
          {isEditing ? (
            <select className="w-full border-b border-cp-border py-1 font-bold text-sm outline-none bg-transparent text-cp-text focus:border-teal-400" value={data.careTargetDoctorResponseDTO?.doctorId || ""} onChange={onDoctorChange}>
              <option value="" disabled className="bg-cp-bg">의료진 선택</option>
              {doctors.map((doc) => <option key={doc.doctorId} value={doc.doctorId} className="bg-cp-bg">{doc.doctorName} ({doc.doctorSpecialty})</option>)}
            </select>
          ) : (
            <p className="font-bold text-cp-text text-sm">{data.careTargetDoctorResponseDTO?.doctorName} | {data.careTargetDoctorResponseDTO?.doctorSpecialty}</p>
          )}
        </DetailItem>

        <div className="flex items-start gap-3 p-4 bg-cp-input rounded-sm border border-cp-border shadow-sm mt-5">
          <div className="p-2 rounded-sm bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/50 shadow-sm flex-shrink-0"><ShieldCheck size={16}/></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-cp-muted font-black uppercase mb-2 tracking-widest">보호자 정보 (비상 연락처)</p>
            {isEditing ? (
              <div className="space-y-2">
                <input name="guardianName" value={data.guardianName || ""} onChange={onChange} placeholder="이름" className="w-full border-b border-cp-border py-1 font-bold text-sm outline-none bg-transparent text-cp-text focus:border-teal-400 placeholder:text-cp-muted" />
                <input name="guardianPhone" value={data.guardianPhone || ""} onChange={onChange} placeholder="연락처" className="w-full border-b border-cp-border py-1 font-bold text-sm outline-none bg-transparent text-cp-text focus:border-teal-400 placeholder:text-cp-muted" />
                <input name="guardianRelationship" value={data.guardianRelationship || ""} onChange={onChange} placeholder="관계" className="w-full border-b border-cp-border py-1 font-bold text-sm outline-none bg-transparent text-cp-text focus:border-teal-400 placeholder:text-cp-muted" />
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-cp-text text-sm">{data.guardianName || "성함 미기재"} ({data.guardianRelationship || "관계 미기재"})</p>
                <p className="text-xs font-medium text-cp-muted">{data.guardianPhone || "연락처 미기재"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 내부 공통 아이템 컴포넌트
const DetailItem = ({ icon, label, children, color }) => {
  const colorMap = {
    rose: 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50',
    teal: 'bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50',
    blue: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/50'
  };
  
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-sm ${colorMap[color] || colorMap.teal} shadow-sm flex-shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-cp-muted font-black uppercase mb-1 tracking-widest">{label}</p>
        {children}
      </div>
    </div>
  );
};

export default ProfileSection;
