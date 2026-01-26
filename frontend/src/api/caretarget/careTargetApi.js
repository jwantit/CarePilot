import apiClient from '../apiClient'; // 기본 export된 apiClient 사용
import { addTokenToRequest } from '../apiClient';

// apiClient의 baseURL이 이미 /api까지 포함하고 있으므로, 그 이후 경로만 설정합니다.
const host = `/caretarget`; 

/**
 * 케어 대상자 전체 조회
 */
export const getCareTargetAllList = async (organizationId, filterStatus, keyword) => {
  // 토큰이 필요한 요청이므로 config에 추가
  const config = addTokenToRequest({
    params: { 
      organizationId: organizationId,
      status: filterStatus === 'all' ? "" : filterStatus,
      keyword: keyword || ""
    },
  });

  const res = await apiClient.get(`${host}/care/list`, config);
  return res.data; 
};

/**
 * 대량 등록 (CSV)
 */
export const uploadCsvCareTarget = async (formData) => {
  const config = addTokenToRequest({
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const res = await apiClient.post(`${host}/csv`, formData, config);
  return res.data;
};

/**
 * 단일 등록
 */
export const uploadOneCareTarget = async (formData) => {
  const config = addTokenToRequest({
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const res = await apiClient.post(`${host}/care/insert`, formData, config);
  return res.data;
};

/**
 * 의료진 조회
 */
export const doctorList = async (organizationId) => {
  const config = addTokenToRequest({
    params: { 
      organizationId: organizationId 
    },
  });

  const res = await apiClient.get(`${host}/care/doctor`, config);
  return res.data;
};

/**
 * 케어대상자 디테일 조회
 */
export const getCareTargetDetail = async (organizationId, caretargetId) => {
  const config = addTokenToRequest({
    params: { 
      organizationId: organizationId,
      careTargetId: caretargetId
    },
  });

  const res = await apiClient.get(`${host}/care/detail`, config);
  return res.data;
};

/**
 * 케어대상자 정보 수정
 */
export const updateCareTargetDetail = async (organizationId, careTargetId, formData) => {
  const config = addTokenToRequest({
    params: { 
      organizationId: organizationId,
      careTargetId: careTargetId
    },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const res = await apiClient.patch(`${host}/care/detail/update`, formData, config);
  return res.data;
};