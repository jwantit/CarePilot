import React, { useState, useRef, useEffect } from 'react';
import { X, User, ShieldCheck, PlusCircle, CheckCircle2, XCircle, FileImage, UploadCloud } from 'lucide-react';
import { doctorList } from '../../api/caretarget/careTargetApi';

function CareTargetInsertModal({ isOpen, onClose, organizationId, onInsert, isUploading }) {
  const [doctors, setDoctors] = useState([]);
  const fileInputRef = useRef(null);

  // 초기값 설정 (gender를 '남성'으로 설정)
  const initialFormState = {
    name: '',
    age: '',
    gender: '남성', // 'MALE' -> '남성'으로 변경
    disease: '',
    careStatus: true,
    targetPhone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: '',
    doctorId: '',
    organizationId: organizationId,
    image: null
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...initialFormState, organizationId: organizationId }));
      const fetchDoctors = async () => {
        try {
          const data = await doctorList(organizationId);
          setDoctors(data || []);
        } catch (error) {
          console.error("의료진 로드 실패:", error);
        }
      };
      fetchDoctors();
    } else {
      setFormData(initialFormState);
    }
  }, [isOpen, organizationId]);

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const cpLen = phoneNumber.length;
    if (cpLen < 4) return phoneNumber;
    if (cpLen < 8) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'targetPhone' || name === 'guardianPhone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    
    if (formData.image) {
      data.append('files', formData.image); 
    }
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'image') return; 
      if (key === 'doctorId' && (value === '' || value === null)) return;
      
      // 전송 시점에 '남성'/'여성' 값이 그대로 포함됨
      if (value !== null && value !== undefined) {
        data.append(key, value);
      }
    });
    
    onInsert(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PlusCircle size={24} className="text-[#008080]" />
            신규 Care대상자 등록
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          
          {/* 사진 업로드 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Care대상자 프로필 사진</label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-[#008080] transition-all cursor-pointer group"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:text-[#008080]">
                {formData.image ? <FileImage size={24} /> : <UploadCloud size={24} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {formData.image ? formData.image.name : "사진 파일을 선택해주세요 (jpg, png...)"}
                </p>
                <p className="text-xs text-gray-400">
                  {formData.image ? `${(formData.image.size / 1024).toFixed(1)} KB` : "클릭하여 파일 탐색기 열기"}
                </p>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 flex items-center gap-2 mb-1 pb-1 border-b text-[#008080] font-bold text-sm">
              <User size={16} /> 기본 정보 및 상태
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">성함</label>
                <input name="name" value={formData.name} required onChange={handleChange} placeholder="환자 성함" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">나이</label>
                <input name="age" type="number" value={formData.age} required onChange={handleChange} placeholder="나이 입력" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">활성 상태</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, careStatus: true }))} className={`flex-1 py-2.5 rounded-lg font-medium border flex items-center justify-center gap-2 transition-all ${formData.careStatus ? 'bg-[#008080] text-white border-[#008080]' : 'bg-white text-gray-500 border-gray-200'}`}><CheckCircle2 size={16} /> 활성</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, careStatus: false }))} className={`flex-1 py-2.5 rounded-lg font-medium border flex items-center justify-center gap-2 transition-all ${!formData.careStatus ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-300'}`}><XCircle size={16} /> 비활성</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">성별</label>
                <div className="flex gap-2">
                  {/* 한글 문자열로 상태 업데이트 */}
                  {['남성', '여성'].map((g) => (
                    <button 
                      key={g} 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, gender: g }))} 
                      className={`flex-1 py-2.5 rounded-lg font-medium border transition-all ${formData.gender === g ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-500 border-gray-300'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 나머지 필드 (동일) */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">질환명</label>
              <input name="disease" value={formData.disease} onChange={handleChange} placeholder="예: 고혈압, 경증 치매" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none" />
            </div>

            <div className="col-span-2 flex items-center gap-2 mt-4 mb-1 pb-1 border-b text-[#008080] font-bold text-sm">
              <ShieldCheck size={16} /> 비상 연락망 및 담당자
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">보호자 성함</label>
                <input name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="보호자 성함" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">보호자 관계</label>
                <input name="guardianRelationship" value={formData.guardianRelationship} onChange={handleChange} placeholder="예: 자녀, 배우자" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Care 대상자 연락처</label>
                <input name="targetPhone" value={formData.targetPhone} onChange={handleChange} maxLength={13} placeholder="010-0000-0000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">보호자 연락처</label>
                <input name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} maxLength={13} placeholder="010-0000-0000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none" />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">담당 의료진 (선택)</label>
              <select name="doctorId" value={formData.doctorId} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#008080] outline-none cursor-pointer">
                <option value="">의료진 미지정</option>
                {doctors.map((doc) => (
                  <option key={doc.doctorId} value={doc.doctorId}>{doc.doctorName} ({doc.doctorSpecialty})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-10">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">취소</button>
            <button type="submit" disabled={isUploading} className="flex-1 py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-[#006666] disabled:bg-gray-300">
              {isUploading ? "등록 중..." : "환자 등록 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CareTargetInsertModal;