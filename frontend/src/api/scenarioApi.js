import axios from "axios";
import { API_SERVER_HOST } from "./notificationApi";

const host = `${API_SERVER_HOST}/api/scenarios`;

export const getAllScenarios = async (organizationId) => {
  const res = await axios.get(`${host}/organization/${organizationId}`);
  return res.data;
};

export const getScenariosByFilter = async (organizationId, status, riskLevel, category) => {
  const params = {};
  if (status && status !== '전체') params.status = status;
  if (riskLevel && riskLevel !== '전체') params.riskLevel = riskLevel;
  if (category && category !== '전체') params.category = category;
  
  const res = await axios.get(`${host}/organization/${organizationId}/filter`, { params });
  return res.data;
};

export const getScenarioById = async (scenarioId) => {
  const res = await axios.get(`${host}/${scenarioId}`);
  return res.data;
};

export const createScenario = async (organizationId, scenario) => {
  const res = await axios.post(`${host}/organization/${organizationId}`, scenario);
  return res.data;
};

export const updateScenario = async (scenarioId, scenario) => {
  const res = await axios.put(`${host}/${scenarioId}`, scenario);
  return res.data;
};

export const deleteScenario = async (scenarioId) => {
  const res = await axios.delete(`${host}/${scenarioId}`);
  return res.data;
};

export const updateScenarioEnabledStatus = async (scenarioId, enabled) => {
  const res = await axios.put(`${host}/${scenarioId}/enabled`, null, {
    params: { enabled },
  });
  return res.data;
};

