import { useState, useEffect } from 'react';
import { getDoctorsByFilter, createDoctor, updateDoctor, deleteDoctor } from '../../api/doctorApi';
import toast from 'react-hot-toast';

function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    name: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    role: 'DOCTOR',
    isActive: true,
    memo: '',
  });

  // 테스트용 organizationId (실제로는 인증에서 가져와야 함)
  const organizationId = 1;

  useEffect(() => {
    loadDoctors();
  }, [filters]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const role = filters.role === '' ? null : filters.role;
      const isActive = filters.isActive === '' ? null : filters.isActive === 'true';
      const name = filters.name.trim() === '' ? null : filters.name;
      
      const data = await getDoctorsByFilter(organizationId, role, isActive, name);
      setDoctors(data);
    } catch (error) {
      console.error('의료진 목록 조회 실패:', error);
      toast.error('의료진 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        specialty: doctor.specialty || '',
        role: doctor.role || 'DOCTOR',
        isActive: doctor.isActive !== undefined ? doctor.isActive : true,
        memo: doctor.memo || '',
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        role: 'DOCTOR',
        isActive: true,
        memo: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      role: 'DOCTOR',
      isActive: true,
      memo: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingDoctor) {
        await updateDoctor(editingDoctor.doctorId, formData);
        toast.success('의료진 정보가 수정되었습니다.');
      } else {
        await createDoctor(organizationId, formData);
        toast.success('의료진이 등록되었습니다.');
      }
      handleCloseModal();
      loadDoctors();
    } catch (error) {
      console.error('의료진 저장 실패:', error);
      toast.error(editingDoctor ? '의료진 수정에 실패했습니다.' : '의료진 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoctor(doctorId);
      toast.success('의료진이 삭제되었습니다.');
      loadDoctors();
    } catch (error) {
      console.error('의료진 삭제 실패:', error);
      toast.error('의료진 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      'ADMIN': '관리자',
      'DOCTOR': '의사',
      'NURSE': '간호사',
      'OPERATOR': '운영자',
    };
    return roleMap[role] || role;
  };

  const getStatusLabel = (isActive) => {
    return isActive ? '활성' : '비활성';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">의료진 관리</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 font-semibold"
        >
          의료진 등록
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">역할</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">전체</option>
              <option value="ADMIN">관리자</option>
              <option value="DOCTOR">의사</option>
              <option value="NURSE">간호사</option>
              <option value="OPERATOR">운영자</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이름 검색</label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              placeholder="이름으로 검색"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  전문과
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    등록된 의료진이 없습니다.
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.doctorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {doctor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.specialty || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRoleLabel(doctor.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doctor.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusLabel(doctor.isActive)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenModal(doctor)}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.doctorId)}
                        className="text-red-600 hover:text-red-900"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingDoctor ? '의료진 수정' : '의료진 등록'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전문과</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ADMIN">관리자</option>
                  <option value="DOCTOR">의사</option>
                  <option value="NURSE">간호사</option>
                  <option value="OPERATOR">운영자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorManagement;

