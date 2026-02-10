import { useState, useEffect } from "react";
import {
  getDoctorsByFilter,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  uploadDoctorCsv,
} from "../../api/setting/doctorApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import BulkUploadModal from "../../components/common/BulkUploadModal";
import {
  X,
  User,
  ShieldCheck,
  Mail,
  Phone,
  Stethoscope,
  Briefcase,
  FileText,
  PlusCircle,
  RotateCcw,
} from "lucide-react";

const inputClass =
  "w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
const labelClass = "block text-sm font-semibold text-cp-text mb-1.5";
const selectClass =
  "w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer transition-all";

function DoctorManagement() {
  const auth = useSelector((state) => state.auth);
  const organizationId = auth.user?.organizationId;
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    isActive: "",
    name: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultActive, setDefaultActive] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    role: "DOCTOR",
    isActive: true,
    memo: "",
  });

  useEffect(() => {
    loadDoctors();
  }, [filters]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const role = filters.role === "" ? null : filters.role;
      const isActive =
        filters.isActive === "" ? null : filters.isActive === "true";
      const name = filters.name.trim() === "" ? null : filters.name;

      const data = await getDoctorsByFilter(
        organizationId,
        role,
        isActive,
        name,
      );
      setDoctors(data);
    } catch (error) {
      console.error("의료진 목록 조회 실패:", error);
      toast.error("의료진 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      role: "",
      isActive: "",
      name: "",
    });
  };

  const handleOpenModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        specialty: doctor.specialty || "",
        role: doctor.role || "DOCTOR",
        isActive: doctor.isActive !== undefined ? doctor.isActive : true,
        memo: doctor.memo || "",
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialty: "",
        role: "DOCTOR",
        isActive: true,
        memo: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialty: "",
      role: "DOCTOR",
      isActive: true,
      memo: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingDoctor) {
        await updateDoctor(editingDoctor.doctorId, formData);
        toast.success("의료진 정보가 수정되었습니다.");
      } else {
        await createDoctor(organizationId, formData);
        toast.success("의료진이 등록되었습니다.");
      }
      handleCloseModal();
      loadDoctors();
    } catch (error) {
      console.error("의료진 저장 실패:", error);
      toast.error(
        editingDoctor
          ? "의료진 수정에 실패했습니다."
          : "의료진 등록에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoctors = async () => {
    if (!organizationId) {
      toast.error("조직 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("organizationId", organizationId);
    formData.append("isActive", defaultActive);

    setIsUploading(true);
    try {
      await uploadDoctorCsv(formData);
      toast.success("의료진 업로드가 완료되었습니다.");
      setIsUploadModalOpen(false);
      setSelectedFiles([]);
      loadDoctors();
    } catch (error) {
      console.error("의료진 업로드 실패:", error);
      toast.error("업로드 중 오류가 발생했습니다. 파일 내용을 확인해주세요.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoctor(doctorId);
      toast.success("의료진이 삭제되었습니다.");
      loadDoctors();
    } catch (error) {
      console.error("의료진 삭제 실패:", error);
      toast.error("의료진 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      ADMIN: "관리자",
      DOCTOR: "의사",
      NURSE: "간호사",
      OPERATOR: "운영자",
    };
    return roleMap[role] || role;
  };

  const getStatusLabel = (isActive) => {
    return isActive ? "활성" : "비활성";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-cp-text">의료진 관리</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-cp-input border border-cp-border text-cp-muted rounded-sm hover:bg-cp-bg hover:text-cp-text font-semibold shadow-md"
          >
            CSV/EXCEL 업로드
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-cp-input border border-teal-500/50 text-teal-400 rounded-sm hover:bg-cp-bg hover:border-teal-500 font-semibold shadow-md"
          >
            의료진 등록
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-none shadow-lg p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-semibold text-cp-muted mb-2">
              역할
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="h-9 px-3 w-full border border-cp-border rounded-none bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer"
            >
              <option value="">전체</option>
              <option value="ADMIN" className="bg-cp-card">
                관리자
              </option>
              <option value="DOCTOR" className="bg-cp-card">
                의사
              </option>
              <option value="NURSE" className="bg-cp-card">
                간호사
              </option>
              <option value="OPERATOR" className="bg-cp-card">
                운영자
              </option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-semibold text-cp-muted mb-2">
              상태
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              className="h-9 px-3 w-full border border-cp-border rounded-none bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer"
            >
              <option value="">전체</option>
              <option value="true" className="bg-cp-card">
                활성
              </option>
              <option value="false" className="bg-cp-card">
                비활성
              </option>
            </select>
          </div>

          <div className="flex-[2] min-w-[200px]">
            <label className="block text-sm font-semibold text-cp-muted mb-2">
              이름 검색
            </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              placeholder="이름으로 검색"
              className="w-full h-9 px-4 border border-cp-border rounded-none bg-cp-input text-cp-text text-sm placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="h-9 flex items-center gap-1.5 px-4 bg-cp-input border border-cp-border text-cp-muted text-sm font-semibold hover:bg-cp-bg hover:border-cp-border hover:text-cp-text transition-all whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <RotateCcw size={14} />
            전체보기
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-cp-card border border-cp-border rounded-sm overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-cp-muted">로딩 중...</div>
          </div>
        ) : (
          <div className="w-full">
            {/* 헤더 - CareTarget 스타일 동일 적용 (6열) */}
            <div className="grid grid-cols-6 bg-cp-header border-b-2 border-teal-500/30 py-3.5 px-4 text-sm font-semibold text-white dark:text-cp-text text-center items-center min-h-[48px]">
              <div className="text-white dark:text-teal-400">이름</div>
              <div className="text-white dark:text-teal-400">이메일</div>
              <div className="text-white dark:text-teal-400">전문과</div>
              <div className="text-white dark:text-teal-400">역할</div>
              <div className="text-white dark:text-teal-400">상태</div>
              <div className="text-white dark:text-teal-400">관리</div>
            </div>

            {/* 데이터 행 */}
            <div className="">
              {doctors.length === 0 ? (
                <div className="py-20 text-center text-cp-muted bg-cp-card/30">
                  등록된 의료진이 없습니다.
                </div>
              ) : (
                doctors.map((doctor) => (
                  <div
                    key={doctor.doctorId}
                    onClick={() => handleOpenModal(doctor)}
                    className="grid grid-cols-6 py-3 px-4 text-sm text-center items-center min-h-[60px] bg-cp-card/30 hover:bg-cp-bg/50 transition border-b border-cp-border cursor-pointer group"
                  >
                    <div className="flex items-center justify-center h-full px-2 overflow-hidden">
                      <span className="text-cp-text text-base truncate">
                        {doctor.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-center h-full px-2 overflow-hidden">
                      <span className="text-cp-text text-base truncate">
                        {doctor.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-center h-full">
                      <span className="text-cp-text text-base">
                        {doctor.specialty || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center h-full">
                      <span className="text-cp-text text-base">
                        {getRoleLabel(doctor.role)}
                      </span>
                    </div>
                    <div className="flex items-center justify-center h-full">
                      <span
                        className={`px-4 py-1.5 text-sm font-bold border rounded-sm shadow-sm ${
                          doctor.isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50"
                            : "bg-cp-bg text-cp-text border border-cp-border dark:bg-cp-bg/50 dark:text-cp-muted dark:border-cp-border"
                        }`}
                      >
                        {getStatusLabel(doctor.isActive)}
                      </span>
                    </div>
                    <div className="flex items-center justify-center h-full gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(doctor);
                        }}
                        className="cp-link-blue"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doctor.doctorId);
                        }}
                        className="cp-link-red"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl w-full max-w-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-5 border-b border-cp-border bg-gradient-to-r from-cp-card to-cp-bg shrink-0">
              <h3 className="text-xl font-bold text-cp-text flex items-center gap-2">
                {editingDoctor ? (
                  <FileText size={24} className="text-teal-400" />
                ) : (
                  <PlusCircle size={24} className="text-teal-400" />
                )}
                {editingDoctor ? "의료진 정보 수정" : "신규 의료진 등록"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto max-h-[80vh] modal-scrollbar"
            >
              <div className="grid grid-cols-2 gap-5">
                {/* 섹션 1: 의료진 기본 정보 */}
                <div className="col-span-2 flex items-center gap-2 mb-1 pb-1 border-b border-cp-border text-teal-400 font-bold text-sm">
                  <User size={16} /> 의료진 기본 정보
                </div>

                <div>
                  <label className={labelClass}>이름</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="이름을 입력하세요"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>전문과</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) =>
                        setFormData({ ...formData, specialty: e.target.value })
                      }
                      placeholder="예: 내과, 신경과"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>이메일</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder="example@email.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>전화번호</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="010-0000-0000"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* 섹션 2: 권한 및 상태 정보 */}
                <div className="col-span-2 flex items-center gap-2 mt-4 mb-1 pb-1 border-b border-cp-border text-teal-400 font-bold text-sm">
                  <Briefcase size={16} /> 권한 및 상태 설정
                </div>

                <div>
                  <label className={labelClass}>역할</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                    className={selectClass}
                  >
                    <option value="ADMIN" className="bg-cp-card">
                      관리자
                    </option>
                    <option value="DOCTOR" className="bg-cp-card">
                      의사
                    </option>
                    <option value="NURSE" className="bg-cp-card">
                      간호사
                    </option>
                    <option value="OPERATOR" className="bg-cp-card">
                      운영자
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>활성 상태</label>
                  <div className="flex gap-2">
                    {[
                      { label: "활성", value: true },
                      { label: "비활성", value: false },
                    ].map((status) => (
                      <button
                        key={status.label}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isActive: status.value })
                        }
                        className={`flex-1 py-2.5 rounded-sm font-medium border transition-all shadow-md ${
                          formData.isActive === status.value
                            ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-500 hover:from-teal-500 hover:to-teal-600"
                            : "bg-cp-input text-cp-muted border-cp-border hover:bg-cp-bg"
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>메모</label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) =>
                      setFormData({ ...formData, memo: e.target.value })
                    }
                    rows="3"
                    placeholder="추가 정보를 입력하세요 (선택 사항)"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-cp-input border border-cp-border text-cp-muted rounded-sm font-semibold hover:bg-cp-bg hover:text-cp-text transition-all shadow-md"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {loading
                    ? "저장 중..."
                    : editingDoctor
                      ? "저장 완료"
                      : "의료진 등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkUploadModal
        isOpen={isUploadModalOpen}
        title="의료진 대량 등록"
        description="CSV/Excel 파일로 의료진을 일괄 등록합니다."
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedFiles([]);
        }}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onUpload={handleUploadDoctors}
        isUploading={isUploading}
        optionSlot={
          <div className="mb-6">
            <label className="block text-sm font-bold text-cp-muted mb-3">
              등록 의료진 기본 상태 설정
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDefaultActive(true)}
                className={`flex-1 py-2.5 rounded-none font-medium border flex items-center justify-center gap-2 transition-all ${
                  defaultActive
                    ? "bg-[#008080] text-white border-[#008080]"
                    : "bg-cp-input text-cp-muted border-cp-border hover:bg-cp-bg"
                }`}
              >
                활성 등록
              </button>
              <button
                type="button"
                onClick={() => setDefaultActive(false)}
                className={`flex-1 py-2.5 rounded-none font-medium border flex items-center justify-center gap-2 transition-all ${
                  !defaultActive
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-cp-input text-cp-muted border-cp-border hover:bg-cp-bg"
                }`}
              >
                비활성 등록
              </button>
            </div>
            <p className="mt-2 text-[11px] text-cp-muted">
              ※ 업로드되는 모든 의료진에게 해당 상태가 일괄 적용됩니다.
            </p>
          </div>
        }
      />
    </div>
  );
}

export default DoctorManagement;
