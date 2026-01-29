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


/**
 * 그룹 세부내용
 */
export const getCareGroupDetail = async (organizationId, careGroupId) => {
  const config = {
    params: { 
      organizationId: organizationId,
      careGroupId : careGroupId
    },
  };
  const res = await apiClient.get(`${host}/detail`, config);
  return res.data; 
};


/**
 * 그룹 삭제 
 */
export const deleteCareGroup = async (careGroupId) => {
  // @RequestParam이므로 URL 파라미터(query string)로 전달
  const res = await apiClient.delete(`${host}/delete`, {
    params: { careGroupId: careGroupId }
  });
  return res.data;
};



/**
 * 업데이트 그룹 
 */
export const updateCareGroup = async (data) => {
  const res = await apiClient.post(`${host}/update`, data);
  return res.data; 
};

/**
 * 그룹에 케대추가 
 */
export const addCareTargetGroup = async (data) => {
  const res = await apiClient.post(`${host}/target/update`, data);
  return res.data; 
};

/**
 * 스케줄 조회
 */
export const getCareGroupCallScheduleList = async (organizationId, careGroupId) => {
  const config = {
    params: { 
      organizationId: organizationId,
      careGroupId : careGroupId
    },
  };
  const res = await apiClient.get(`${host}/schedule/list`, config);
  return res.data; 
};


/**
 * 그룹 통화 스케줄 등록 / 그룹 통화 스케줄 수정
 */
export const addCareTargetGroupCallSchedule = async (data) => {
  const res = await apiClient.post(`${host}/schedule/add`, data);
  return res.data; 
};


/**
 * 그룹 통화 스케줄 삭제 
 */
export const deleteGroupSchedule = async (careGroupId,scheduleId) => {
  const res = await apiClient.delete(`${host}/schedule/delete`, {
    params: { 
      careGroupId: careGroupId,
      scheduleId: scheduleId 
    }
  });
  return res.data;
};
