import { useState, useEffect } from "react";
import {
  getDoctorsByFilter,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  uploadDoctorCsv,
} from "../../api/doctorApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import BulkUploadModal from "../../components/common/BulkUploadModal";

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
        <h1 className="text-2xl font-bold text-slate-100">의료진 관리</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 text-slate-300 rounded-sm hover:from-slate-800 hover:to-slate-900 hover:border-slate-500 font-semibold shadow-md"
          >
            CSV/EXCEL 업로드
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/50 text-teal-400 rounded-sm hover:from-slate-800 hover:to-slate-900 hover:border-teal-500 font-semibold shadow-md"
          >
            의료진 등록
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              역할
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
            >
              <option value="">전체</option>
              <option value="ADMIN">관리자</option>
              <option value="DOCTOR">의사</option>
              <option value="NURSE">간호사</option>
              <option value="OPERATOR">운영자</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              상태
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
            >
              <option value="">전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              이름 검색
            </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              placeholder="이름으로 검색"
              className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-slate-800 border border-slate-700 rounded-none overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-500">로딩 중...</div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  전문과
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {doctors.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-slate-500"
                  >
                    등록된 의료진이 없습니다.
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.doctorId} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">
                      {doctor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {doctor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {doctor.specialty || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {getRoleLabel(doctor.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          doctor.isActive
                            ? "bg-teal-500/20 text-teal-400 border border-teal-500/50"
                            : "bg-slate-600/50 text-slate-400 border border-slate-500"
                        }`}
                      >
                        {getStatusLabel(doctor.isActive)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleOpenModal(doctor)}
                        className="cp-link-blue"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.doctorId)}
                        className="cp-link-red"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-slate-100">
              {editingDoctor ? "의료진 수정" : "의료진 등록"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  전문과
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  역할
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                >
                  <option value="ADMIN">관리자</option>
                  <option value="DOCTOR">의사</option>
                  <option value="NURSE">간호사</option>
                  <option value="OPERATOR">운영자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  상태
                </label>
                <select
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.value === "true",
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                >
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  메모
                </label>
                <textarea
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-600 rounded-sm text-slate-300 hover:bg-slate-700/50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/50 text-teal-400 rounded-sm hover:from-slate-800 hover:to-slate-900 hover:border-teal-500 font-semibold disabled:opacity-50"
                >
                  {loading ? "저장 중..." : "저장"}
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
            <label className="block text-sm font-bold text-slate-400 mb-3">
              등록 의료진 기본 상태 설정
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDefaultActive(true)}
                className={`flex-1 py-2.5 rounded-none font-medium border flex items-center justify-center gap-2 transition-all ${
                  defaultActive
                    ? "bg-[#008080] text-white border-[#008080]"
                    : "bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-500"
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
                    : "bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-500"
                }`}
              >
                비활성 등록
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              ※ 업로드되는 모든 의료진에게 해당 상태가 일괄 적용됩니다.
            </p>
          </div>
        }
      />
    </div>
  );
}

export default DoctorManagement;
