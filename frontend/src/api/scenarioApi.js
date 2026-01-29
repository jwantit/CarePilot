import { apiClient } from "./apiClient";

const host = `/scenarios`;

export const getAllScenarios = async (organizationId) => {
  const res = await apiClient.get(`${host}/organization/${organizationId}`);
  return res.data;
};

export const getScenariosByFilter = async (
  organizationId,
  status,
  riskLevel,
  category,
) => {
  const params = {};
  if (status && status !== "전체") params.status = status;
  if (riskLevel && riskLevel !== "전체") params.riskLevel = riskLevel;
  if (category && category !== "전체") params.category = category;

  const res = await apiClient.get(
    `${host}/organization/${organizationId}/filter`,
    {
      params,
    },
  );
  return res.data;
};

export const getScenarioById = async (scenarioId) => {
  const res = await apiClient.get(`${host}/${scenarioId}`);
  return res.data;
};

export const createScenario = async (organizationId, scenario) => {
  const res = await apiClient.post(
    `${host}/organization/${organizationId}`,
    scenario,
  );
  return res.data;
};

export const updateScenario = async (scenarioId, scenario) => {
  const res = await apiClient.put(`${host}/${scenarioId}`, scenario);
  return res.data;
};

export const deleteScenario = async (scenarioId) => {
  const res = await apiClient.delete(`${host}/${scenarioId}`);
  return res.data;
};

export const updateScenarioEnabledStatus = async (scenarioId, enabled) => {
  const res = await apiClient.put(`${host}/${scenarioId}/enabled`, null, {
    params: { enabled },
  });
  return res.data;
};
