import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getCareTargetDetail, doctorList, updateCareTargetDetail } from '../../api/caretarget/careTargetApi';
import ProfileSection from '../../components/caretarget/caretargetdetail/ProfileSection';
import { AiAnalysisBox, RiskTrendChart } from '../../components/caretarget/caretargetdetail/RiskTrendChart';
import CallHistoryTable from '../../components/caretarget/caretargetdetail/CallHistoryTable';
import { useAuth } from '../../hooks/useAuth';


function CareTargetDetailPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  //케어 대상자 id
  const { targetId } = useParams();
  //목록으로 이동하기 위함
  const navigate = useNavigate();
  

//인풋 창 직접접근
  const fileInputRef = useRef(null);

  //조회 모드인지 수정모드 인지 
  const [isEditing, setIsEditing] = useState(false);
  //데이터 로딩딩
  const [loading, setLoading] = useState(true);

  //$$$$$서버에서 가져옴 데이터$$$$$-------------------------------------------------
  const [data, setData] = useState(null);

  // file;
  // name;
  // age;
  // gender;
  // disease;
  // targetPhone;
  // careTargetDoctorResponseDTO;
  // guardianName;
  // guardianPhone;
  // guardianRelationship;
  // aiMemo;
  // riskTrendDTOS; //배열 위험추이 차트 score, date 
  // callHistoryDTOS; //배열 전화 히스토리 doctorId , doctorName, doctorSpecialty
  //--------------------------------------------------------------------------------


  const [imgError, setImgError] = useState(false);
  const [doctors, setDoctors] = useState([]);

  //프로필 이미지 수정시 담기----
  const [newFile, setNewFile] = useState(null);
  //프론트에서 선택(추가한) 이미지 미리보기 previewUrl
  const [previewUrl, setPreviewUrl] = useState(null);
  //이미지 삭제 여부
  const [isPhotoDeleted, setIsPhotoDeleted] = useState(false);


  //상세정보 , 의료진 목록조회------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const [result, doctorListData] = await Promise.all([
        //전체데이터
        getCareTargetDetail(organizationId, targetId),
        //의료진 리스트
        doctorList(organizationId)
      ]);
      //전체데이터 set
      setData(result);
      //의료진 목록 set
      setDoctors(doctorListData);
      // 데이터 새로 불러올 때 에러 상태 초기화
      setImgError(false);
    } catch (error) { console.error("데이터 조회 실패:", error); }
    finally { setLoading(false); }
  };
  //-----------------------------------------------------

  //fetchData 트리거 organizationId,  organizationId 변동시
  useEffect(() => { if (targetId && organizationId) fetchData(); }, [targetId, organizationId]);




  //프로필 수정 추가 함수-----------------------------------------
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      //이미지 미리보기 주소 set
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setImgError(false); // 새 이미지 선택 시 에러 상태 해제
      setIsPhotoDeleted(false);
    }
  };
  //----------------------------------------------------------



  //수정된데이터 api호출까지--------------------------------------------------------
  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      const fields = ["name", "age", "gender", "disease", "targetPhone", "guardianName", "guardianPhone", "guardianRelationship"];
      fields.forEach(field => formData.append(field, data[field] || (field === "age" ? 0 : "")));
      
      if (data.careTargetDoctorResponseDTO?.doctorId) {
        formData.append("doctorId", data.careTargetDoctorResponseDTO.doctorId);
      }
        
      //삭제 플래그 
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
  //-----------------------------------------------------------------------

  if (loading) return <div className="p-20 text-center font-bold text-[#008080]">데이터를 불러오는 중입니다...</div>;
  if (!data) return <div className="p-20 text-center font-bold text-slate-400">대상자 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="p-8 bg-[#F8FAFB] min-h-screen font-sans text-slate-900">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/care-target')} className="flex items-center text-slate-400 hover:text-[#008080] font-bold text-sm transition-colors">
            <ChevronLeft size={20} /> 목록으로
          </button>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">대상자 상세 정보</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); fetchData(); setPreviewUrl(null); setNewFile(null); }} className="px-5 py-2 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-500">취소</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#008080] rounded-xl text-sm font-bold text-white shadow-lg">저장하기</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-6 py-2 border border-[#008080] rounded-xl bg-white text-sm font-bold text-[#008080] hover:bg-[#008080] hover:text-white transition-all shadow-sm">정보 수정</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-stretch mb-8">
        <div className="col-span-12 lg:col-span-4 flex">
          <ProfileSection 
            data={data} isEditing={isEditing} doctors={doctors}
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
            previewUrl={previewUrl} fileInputRef={fileInputRef} imgError={imgError} setImgError={setImgError}
          />
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <RiskTrendChart trendList={data.riskTrendDTOS || []} />
          <AiAnalysisBox aiMemo={data.aiMemo} />
        </div>
      </div>
      <CallHistoryTable history={data.callHistoryDTOS || []} />
    </div>
  );
}

export default CareTargetDetailPage;