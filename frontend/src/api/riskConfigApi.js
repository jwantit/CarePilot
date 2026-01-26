import axios from "axios";
import { API_SERVER_HOST } from "./notificationApi";

const host = `${API_SERVER_HOST}/api/risk-config`;

export const getRiskConfig = async (organizationId) => {
  const res = await axios.get(`${host}/${organizationId}`);
  return res.data;
};

export const updateRiskConfig = async (organizationId, config) => {
  const res = await axios.put(`${host}/${organizationId}`, config);
  return res.data;
};

