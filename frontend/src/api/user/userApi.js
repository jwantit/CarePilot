import { apiClient } from "../apiClient";

const host = `/users`;

//현재 로그인한 사용자의 프로필 조회
//GET /api/users/profile
export const getUserProfile = async () => {
  const res = await apiClient.get(`${host}/profile`);
  return res.data;
};

//프로필 정보 수정 (이름, 이메일, 전화번호)
//PUT /api/users/profile
export const updateUserProfile = async (userData) => {
  const res = await apiClient.put(`${host}/profile`, userData);
  return res.data;
};

// [직원 관리] 직원 목록 조회
export const getStaffList = async () => {
  const res = await apiClient.get(`${host}/staff`);
  return res.data;
};

// [직원 관리] 직원 상태 변경 (승인/거부/중지)
export const updateStaffStatus = async (userId, status) => {
  const res = await apiClient.patch(`${host}/staff/${userId}/status`, { status });
  return res.data;
};

// [직원 관리] 직원 권한 변경 (USER/MANAGER)
export const updateStaffRole = async (userId, role) => {
  const res = await apiClient.patch(`${host}/staff/${userId}/role`, { role });
  return res.data;
};