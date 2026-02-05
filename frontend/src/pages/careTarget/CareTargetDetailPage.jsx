import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { getCareTargetDetail, doctorList, updateCareTargetDetail } from '../../api/caretarget/careTargetApi';
import ProfileSection from '../../components/caretarget/caretargetdetail/ProfileSection';
import { AiAnalysisBox, RiskTrendChart } from '../../components/caretarget/caretargetdetail/RiskTrendChart';
import CallHistoryTable from '../../components/caretarget/caretargetdetail/CallHistoryTable';
import PrescriptionHistoryTable from '../../components/caretarget/caretargetdetail/PrescriptionHistoryTable';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';

function CareTargetDetailPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const role = user?.role; // ADMIN, MANAGER, USER 값 확인

  // 케어 대상자 id
  const { targetId } = useParams();
  // 목록으로 이동하기 위함
  const navigate = useNavigate();

  // 인풋 창 직접접근
  const fileInputRef = useRef(null);

  // 조회 모드인지 수정모드 인지 
  const [isEditing, setIsEditing] = useState(false);
  // 데이터 로딩
  const [loading, setLoading] = useState(true);

  // 서버에서 가져온 데이터 상태
  const [data, setData] = useState(null);

  const [imgError, setImgError] = useState(false);
  const [doctors, setDoctors] = useState([]);

  // 프로필 이미지 수정 관련 상태
  const [newFile, setNewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPhotoDeleted, setIsPhotoDeleted] = useState(false);

  // 상세정보, 의료진 목록조회
  const fetchData = async () => {
    try {
      setLoading(true);
      const [result, doctorListData] = await Promise.all([
        getCareTargetDetail(organizationId, targetId),
        doctorList(organizationId)
      ]);
      setData(result);
      setDoctors(doctorListData);
      setImgError(false);
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId && organizationId) fetchData();
  }, [targetId, organizationId]);

  // 프로필 이미지 수정 함수
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setImgError(false);
      setIsPhotoDeleted(false);
    }
  };

  // 수정 데이터 저장 API 호출
  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      const fields = ["name", "age", "gender", "disease", "targetPhone", "guardianName", "guardianPhone", "guardianRelationship"];
      fields.forEach(field => formData.append(field, data[field] || (field === "age" ? 0 : "")));
      
      if (data.careTargetDoctorResponseDTO?.doctorId) {
        formData.append("doctorId", data.careTargetDoctorResponseDTO.doctorId);
      }
        
      formData.append("isDelete", isPhotoDeleted);

      if (newFile) {
        formData.append("file", newFile);
      } else if (data.file === null && !previewUrl) {
        formData.append("file", new Blob([], { type: 'application/octet-stream' })); 
      }

      await updateCareTargetDetail(organizationId, targetId, formData);
      alert("정보가 성공적으로 수정되었습니다.");
      setIsEditing(false);
      setNewFile(null); 
      setPreviewUrl(null);
      fetchData();
    } catch (error) { 
      console.error(error);
      alert("수정 중 오류가 발생했습니다."); 
    }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <Loader2 className="animate-spin border-4 border-slate-700 border-t-teal-400 rounded-full" size={48} />
        <p className="text-slate-400 text-sm font-mono">로딩 중...</p>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-slate-800 border border-slate-700">
        <div className="w-20 h-20 bg-slate-900 border-2 border-slate-700 rounded flex items-center justify-center mb-5">
          <span className="text-3xl text-slate-600">[ ]</span>
        </div>
        <p className="text-slate-300 font-mono font-semibold text-base mb-2">// No patient data found</p>
        <p className="text-slate-500 text-sm font-mono">// 대상자 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={["케어 대상자", data?.name || "상세"]} />
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 px-5 py-3 mb-6 shadow-lg hover:shadow-xl transition-shadow rounded-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/care-target')} 
            className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 px-5 py-2.5 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
          >
            <ChevronLeft size={18} />
            목록으로
          </button>
          
          {/* 권한 제어: ADMIN 또는 MANAGER만 수정 버튼 및 저장/취소 버튼을 볼 수 있음 */}
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <>
              {isEditing ? (
                <>
                  <button 
                    onClick={() => { setIsEditing(false); fetchData(); setPreviewUrl(null); setNewFile(null); }} 
                    className="px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-slate-600 text-slate-300 rounded-sm text-sm font-semibold hover:border-slate-500 hover:text-slate-100 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="px-5 py-2.5 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 border border-teal-500 text-white rounded-sm text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    저장하기
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-orange-400 border border-orange-500/50 hover:border-orange-500 rounded-sm text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  정보 수정
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch mb-8">
        <div className="col-span-12 lg:col-span-4 flex">
          <ProfileSection 
            data={data} 
            isEditing={isEditing} 
            doctors={doctors}
            onChange={(e) => setData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
            onDoctorChange={(e) => {
              const doc = doctors.find(d => d.doctorId === parseInt(e.target.value));
              if (doc) setData(prev => ({ ...prev, careTargetDoctorResponseDTO: { ...doc } }));
            }}
            onImageChange={handleImageChange}
            onRemoveImage={() => { 
              setNewFile(null); 
              setPreviewUrl(null); 
              setData(prev => ({ ...prev, file: null })); 
              setIsPhotoDeleted(true);
            }}
            previewUrl={previewUrl} 
            fileInputRef={fileInputRef} 
            imgError={imgError} 
            setImgError={setImgError}
          />
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <RiskTrendChart trendList={data.riskTrendDTOS || []} />
          <AiAnalysisBox aiMemo={data.aiMemo} />
        </div>
      </div>
      <CallHistoryTable history={data.callHistoryDTOS || []} />
      <PrescriptionHistoryTable list={data.prescriptionHistoryDTOS || []} />
    </div>
  );
}

export default CareTargetDetailPage;