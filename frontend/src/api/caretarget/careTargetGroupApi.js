import apiClient from '../apiClient'; 

const host = `/caregroup`; 

/**
 * 그룹 생성
 */
export const createCareGroup = async (data) => {
  const res = await apiClient.post(`${host}/insert`, data);
  return res.data; 
};

/**
 * 그룹 리스트 조회
 */
export const getCareGroupList = async (organizationId) => {
  const config = {
    params: { 
      organizationId: organizationId,
    },
  };
  const res = await apiClient.get(`${host}/list`, config);
  return res.data; 
};

/**
 * 대상자 목록 조회
 */
export const getCareTargetList = async (organizationId) => {
  const config = {
    params: { 
      organizationId: organizationId,
    },
  };
  const res = await apiClient.get(`${host}/target/list`, config);
  return res.data; 
};

/**
 * 시나리오 목록 조회
 */
export const getScenarioList = async (organizationId) => {
  const config = {
    params: { 
      organizationId: organizationId,
    },
  };
  const res = await apiClient.get(`${host}/scenario/list`, config);
  return res.data; 
};