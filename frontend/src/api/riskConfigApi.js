import { apiClient } from "./apiClient";

const host = `/risk-config`;

export const getRiskConfig = async (organizationId) => {
  const res = await apiClient.get(`${host}/${organizationId}`);
  return res.data;
};

export const updateRiskConfig = async (organizationId, config) => {
  const res = await apiClient.put(`${host}/${organizationId}`, config);
  return res.data;
};
