import React from 'react';
import { User as UserIcon, Camera, HeartPulse, Phone, Stethoscope, ShieldCheck, X } from 'lucide-react';
import { getFileUrl } from '../../../hooks/fileHelper';


const ProfileSection = ({ data, isEditing, onChange, onDoctorChange, onImageChange, onRemoveImage, previewUrl, fileInputRef, doctors, imgError, setImgError }) => {
  const originalImageUrl = data?.file ? getFileUrl(data.file) : null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm w-full flex flex-col overflow-hidden">
      <div className="relative p-10 text-center bg-gradient-to-b from-[#008080]/10 via-[#008080]/5 to-transparent border-b border-slate-50 flex flex-col items-center">
        {/* 이미지 영역 */}
        <div className="relative mb-6">
          <div className="w-44 h-44 rounded-[2.5rem] border-8 border-white bg-slate-50 flex items-center justify-center overflow-hidden shadow-xl group">
            {(previewUrl || (originalImageUrl && !imgError)) ? (
              <img 
                src={previewUrl || originalImageUrl} 
                alt="프로필" 
                className="w-full h-full object-cover" 
                onError={() => setImgError(true)} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 text-slate-300">
                <UserIcon size={72} strokeWidth={1.5} />
              </div>
            )}
            {isEditing && (
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="text-white" size={32} />
              </div>
            )}
          </div>
          {isEditing && (previewUrl || originalImageUrl) && (
            <button onClick={onRemoveImage} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors">
              <X size={18} />
            </button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onImageChange} />
        </div>

        {isEditing ? (
          <div className="flex flex-col items-center gap-2">
            <input name="name" value={data.name} onChange={onChange} className="text-center text-3xl font-black border-b-2 border-[#008080] outline-none bg-transparent w-40" />
            <div className="flex gap-2 mt-1">
              <input name="age" type="number" value={data.age} onChange={onChange} className="w-12 text-center text-sm font-bold border-b border-slate-300 outline-none" />
              <select name="gender" value={data.gender} onChange={onChange} className="text-sm font-bold border-b border-slate-300 outline-none bg-transparent">
                <option value="남성">남성</option><option value="여성">여성</option>
              </select>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{data.name}</h2>
            <p className="mt-3 px-4 py-1.5 bg-white rounded-full text-[11px] font-black text-slate-400 shadow-sm border border-slate-50">{data.age}세 · {data.gender}</p>
          </>
        )}
      </div>

      <div className="p-8 space-y-6 flex-1">
        {/* 인적 사항 상세 리스트 */}
        <div className="space-y-6">
          <DetailItem icon={<HeartPulse size={18}/>} label="주요 질환" color="rose">
            {isEditing ? <input name="disease" value={data.disease} onChange={onChange} className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080]" /> : <p className="font-bold text-slate-700 text-[15px]">{data.disease || "기록 없음"}</p>}
          </DetailItem>
          
          <DetailItem icon={<Phone size={18}/>} label="대상자 연락처" color="teal">
            {isEditing ? <input name="targetPhone" value={data.targetPhone} onChange={onChange} className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080]" /> : <p className="font-bold text-slate-700 text-[15px]">{data.targetPhone}</p>}
          </DetailItem>

          <DetailItem icon={<Stethoscope size={18}/>} label="담당 의료진" color="blue">
            {isEditing ? (
              <select className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent" value={data.careTargetDoctorResponseDTO?.doctorId || ""} onChange={onDoctorChange}>
                <option value="" disabled>의료진 선택</option>
                {doctors.map((doc) => <option key={doc.doctorId} value={doc.doctorId}>{doc.doctorName} ({doc.doctorSpecialty})</option>)}
              </select>
            ) : (
              <p className="font-bold text-slate-700 text-[15px]">{data.careTargetDoctorResponseDTO?.doctorName} | {data.careTargetDoctorResponseDTO?.doctorSpecialty}</p>
            )}
          </DetailItem>

          <div className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-500 shadow-sm"><ShieldCheck size={18}/></div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">보호자 정보 (비상 연락처)</p>
              {isEditing ? (
                <div className="space-y-3">
                  <input name="guardianName" value={data.guardianName || ""} onChange={onChange} placeholder="이름" className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent" />
                  <input name="guardianPhone" value={data.guardianPhone || ""} onChange={onChange} placeholder="연락처" className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent" />
                  <input name="guardianRelationship" value={data.guardianRelationship || ""} onChange={onChange} placeholder="관계" className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent" />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-[14px]">{data.guardianName || "성함 미기재"} ({data.guardianRelationship || "관계 미기재"})</p>
                  <p className="text-sm font-medium text-slate-500">{data.guardianPhone || "연락처 미기재"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 내부 공통 아이템 컴포넌트
const DetailItem = ({ icon, label, children, color }) => (
  <div className="flex items-start gap-4">
    <div className={`p-2.5 rounded-2xl bg-${color}-50 text-${color}-500 shadow-sm`}>{icon}</div>
    <div className="flex-1">
      <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">{label}</p>
      {children}
    </div>
  </div>
);

export default ProfileSection;