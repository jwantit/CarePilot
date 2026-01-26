import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Phone, User as UserIcon, Camera, HeartPulse, Clock, Stethoscope, ShieldCheck, X 
} from 'lucide-react';

// --- Chart.js 관련 임포트 (원본 유지) ---
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { getCareTargetDetail, doctorList, updateCareTargetDetail } from '../../api/caretarget/careTargetApi';
import { getFileUrl } from '../../components/common/fileHelper';
import { useSelector } from 'react-redux';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function CareTargetDetailPage() {
  const { targetId } = useParams();

  const user = useSelector((state) => state.auth.user);
  const organizationId = user?.organizationId;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [imgError, setImgError] = useState(false);
  
  // --- 이미지 관련 상태 ---
  const [doctors, setDoctors] = useState([]);
  const [newFile, setNewFile] = useState(null); // 새로 업로드할 파일
  const [previewUrl, setPreviewUrl] = useState(null); // 미리보기 URL

  useEffect(() => { setImgError(false); }, [data]);

  // 원본 이미지 URL 가져오기
  const originalImageUrl = getFileUrl(data?.file);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [result, doctorListData] = await Promise.all([
          getCareTargetDetail(organizationId, targetId),
          doctorList(organizationId)
        ]);
        setData(result);
        setDoctors(doctorListData);
      } catch (error) { 
        console.error("데이터 조회 실패:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    if (targetId && organizationId) fetchData();
  }, [targetId, organizationId]);

  // --- 이미지 핸들러 ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewFile(null);
    setPreviewUrl(null);
    // 기존 이미지를 지우기 위해 데이터 객체 내의 file 정보를 임시로 null 처리
    setData(prev => ({ ...prev, file: null }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (e) => {
    const selectedDoctorId = parseInt(e.target.value);
    const selectedDoctor = doctors.find(doc => doc.doctorId === selectedDoctorId);
    if (selectedDoctor) {
      setData(prev => ({
        ...prev,
        careTargetDoctorResponseDTO: {
          ...prev.careTargetDoctorResponseDTO,
          doctorId: selectedDoctor.doctorId,
          doctorName: selectedDoctor.doctorName,
          doctorSpecialty: selectedDoctor.doctorSpecialty
        }
      }));
    }
  };

//수정 저장장---------------------------------------------------------------------------------
const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
  
      // 1. DTO 필드와 1:1 매칭되도록 append (백엔드 @ModelAttribute용)
      formData.append("name", data.name);
      formData.append("age", data.age || 0);
      formData.append("gender", data.gender);
      formData.append("disease", data.disease);
      formData.append("targetPhone", data.targetPhone);
      formData.append("guardianName", data.guardianName);
      formData.append("guardianPhone", data.guardianPhone);
      formData.append("guardianRelationship", data.guardianRelationship);
      
      // doctorId가 있는 경우에만 추가 (Long 타입 대응)
      if (data.careTargetDoctorResponseDTO?.doctorId) {
        formData.append("doctorId", data.careTargetDoctorResponseDTO.doctorId);
      }
  
      // 2. 파일 처리 (@RequestPart(value = "file")용)
      if (newFile) {
        formData.append("file", newFile);
      } 
      // ※ 팁: 이미지 삭제 여부를 백엔드에서 file == null로 판단하기 어렵다면, 
      // DTO에 boolean isDeleteImage 필드를 추가해서 같이 보내는 것도 좋은 방법입니다.
  
      // 3. API 호출
      // URL이 /care/detail/update로 바뀌었으니 확인하세요!
      await updateCareTargetDetail(organizationId, targetId, formData);
  
      alert("정보가 성공적으로 수정되었습니다.");
      setIsEditing(false);
      setNewFile(null); 
      setPreviewUrl(null);
  
      // 데이터 새로고침
      const updatedResult = await getCareTargetDetail(organizationId, targetId);
      setData(updatedResult);
  
    } catch (error) {
      console.error("저장 실패:", error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
//----------------------------------------------------------------------------------------

  // --- 차트 설정 (원본 유지) -------------------------------------------------------
  const trendList = data?.riskTrendDTOS || [];
  const chartData = {
    labels: trendList.length > 0 ? trendList.map(item => item.date) : ['데이터 없음'],
    datasets: [{
      label: '위험도 지수',
      data: trendList.length > 0 ? trendList.map(item => item.score) : [0],
      fill: true,
      borderColor: '#008080',
      backgroundColor: 'rgba(0, 128, 128, 0.03)',
      tension: 0.45,
      pointRadius: 3,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#008080',
      pointBorderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } },
      x: { ticks: { autoSkip: true, maxTicksLimit: 7 } }
    }
  };
  //---------------------------------------------------------------------------

  if (loading) return <div className="p-20 text-center font-bold text-[#008080]">데이터를 불러오는 중입니다...</div>;
  if (!data) return <div className="p-20 text-center font-bold text-slate-400">대상자 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="p-8 bg-[#F8FAFB] min-h-screen font-sans text-slate-900">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/care-target')} className="flex items-center text-slate-400 hover:text-[#008080] font-bold text-sm transition-colors">
            <ChevronLeft size={20} /> 목록으로
          </button>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">대상자 상세 정보</h1>
        </div>
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              {/* 취소 버튼: 이미지 상태와 원본 데이터를 복구하기 위해 fetchData를 다시 호출하거나 수동으로 리셋 */}
              <button 
                onClick={async () => { 
                  setIsEditing(false); 
                  setPreviewUrl(null); 
                  setNewFile(null);
                  // 취소 시 변경된 텍스트와 이미지 삭제 상태를 서버 데이터로 복구하기 위해 다시 로드
                  const result = await getCareTargetDetail(organizationId, targetId);
                  setData(result);
                }} 
                className="px-5 py-2 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-500"
              >
                취소
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#008080] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#008080]/20">저장하기</button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-6 py-2 border border-[#008080] rounded-xl bg-white text-sm font-bold text-[#008080] hover:bg-[#008080] hover:text-white transition-all shadow-sm">정보 수정</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-stretch mb-8">
        {/* [왼쪽]: 인적 사항 및 이미지 등록 */}
        <div className="col-span-12 lg:col-span-4 flex">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm w-full flex flex-col overflow-hidden">
            <div className="relative p-10 text-center bg-gradient-to-b from-[#008080]/10 via-[#008080]/5 to-transparent border-b border-slate-50 flex flex-col items-center">
              
              {/* 이미지 영역 */}
              <div className="relative mb-6">
                <div className="w-44 h-44 rounded-[2.5rem] border-8 border-white bg-slate-50 flex items-center justify-center overflow-hidden shadow-xl group">
                  { (previewUrl || (originalImageUrl && !imgError)) ? (
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
                  <button 
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </div>

              {isEditing ? (
                <div className="flex flex-col items-center gap-2">
                  <input name="name" value={data.name} onChange={handleChange} className="text-center text-3xl font-black border-b-2 border-[#008080] outline-none bg-transparent w-40" />
                  <div className="flex gap-2 mt-1">
                    <input name="age" type="number" value={data.age} onChange={handleChange} className="w-12 text-center text-sm font-bold border-b border-slate-300 outline-none" />
                    <select name="gender" value={data.gender} onChange={handleChange} className="text-sm font-bold border-b border-slate-300 outline-none bg-transparent">
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
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-500 shadow-sm"><HeartPulse size={18}/></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">주요 질환</p>
                    {isEditing ? <input name="disease" value={data.disease} onChange={handleChange} className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080]" /> : <p className="font-bold text-slate-700 text-[15px]">{data.disease || "기록 없음"}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-2xl bg-[#008080]/5 text-[#008080] shadow-sm"><Phone size={18}/></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">대상자 연락처</p>
                    {isEditing ? <input name="targetPhone" value={data.targetPhone} onChange={handleChange} className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080]" /> : <p className="font-bold text-slate-700 text-[15px]">{data.targetPhone}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-500 shadow-sm"><Stethoscope size={18}/></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">담당 의료진</p>
                    {isEditing ? (
                      <select 
                        className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent"
                        value={data.careTargetDoctorResponseDTO?.doctorId || ""}
                        onChange={handleDoctorChange}
                      >
                        <option value="" disabled>의료진 선택</option>
                        {doctors.map((doc) => (
                          <option key={doc.doctorId} value={doc.doctorId}>{doc.doctorName} ({doc.doctorSpecialty})</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-bold text-slate-700 text-[15px]">{data.careTargetDoctorResponseDTO?.doctorName} | {data.careTargetDoctorResponseDTO?.doctorSpecialty}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-500 shadow-sm"><ShieldCheck size={18}/></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">보호자 정보 (비상 연락처)</p>
                    <div className="space-y-3">
                      {isEditing ? (
                        <>
                          <input name="guardianName" value={data.guardianName || ""} onChange={handleChange} placeholder="이름" className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent" />
                          <input name="guardianPhone" value={data.guardianPhone || ""} onChange={handleChange} placeholder="연락처" className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent" />
                          <input name="guardianRelationship" value={data.guardianRelationship || ""} onChange={handleChange} placeholder="관계" className="w-full border-b border-slate-200 py-1 font-bold text-sm outline-none focus:border-[#008080] bg-transparent" />
                        </>
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
          </div>
        </div>

        {/* [오른쪽]: 추이 및 분석 */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-black text-slate-800 text-sm tracking-widest uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div> 위험도 추이
              </h3>
            </div>
            <div className="flex-1 min-h-[280px]">
              {trendList.length > 0 ? <Line data={chartData} options={chartOptions} /> : <div className="w-full h-full bg-slate-50/50 rounded-3xl flex items-center justify-center text-slate-300 text-xs font-bold">데이터가 없습니다.</div>}
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
            <h3 className="font-black text-[#008080] text-sm tracking-widest uppercase mb-6 flex items-center gap-2"><div className="w-5 h-[2px] bg-[#008080]"></div> AI 분석 요약</h3>
            <div className="p-8 bg-[#008080]/5 rounded-[2rem] border border-[#008080]/10">
              <p className="text-[15px] text-[#006666] font-bold italic leading-relaxed">"{data.aiMemo || "리포트가 없습니다."}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* [하단]: 통화 이력 */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50"><Clock size={20} className="text-[#008080]"/></div>
            통화 이력
          </h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-left table-fixed border-separate border-spacing-0">
            <thead className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-10 py-4 w-[20%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">상담 일시</th>
                <th className="px-6 py-4 w-[15%] text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">유형</th>
                <th className="px-6 py-4 w-[50%] text-[11px] font-bold text-slate-400 uppercase tracking-widest">상담 요약</th>
                <th className="px-10 py-4 w-[15%] text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">진행 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data.callHistoryDTOS || []).map((log, idx) => {
                const typeMap = {
                  'REGULAR_MONITORING': { text: '정기 모니터링', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  'EMERGENCY': { text: '긴급 통화', color: 'bg-red-50 text-red-600 border-red-100' },
                  'MEDICATION_CHECK': { text: '약물 확인', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  'SYMPTOM_CHECK': { text: '증상 체크', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                  'FOLLOW_UP': { text: '후속 조치', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                  'OTHER': { text: '기타 상담', color: 'bg-slate-50 text-slate-500 border-slate-100' }
                };
                const typeInfo = typeMap[log.callType] || typeMap['OTHER'];
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-5 text-xs font-bold text-slate-600 tabular-nums">{log.startTime || "-"}</td>
                    <td className="px-6 py-5 text-center"><span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border ${typeInfo.color}`}>{typeInfo.text}</span></td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500 truncate group-hover:text-slate-900">{log.summary || "내역 없음"}</td>
                    <td className="px-10 py-5 text-center"><span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${log.status === 'SUCCESS' ? 'bg-[#008080]/10 text-[#008080] border border-[#008080]/20' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>{log.status === 'SUCCESS' ? '완료' : '실패'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CareTargetDetailPage;