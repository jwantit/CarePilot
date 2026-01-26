import axios from "axios";
import { API_SERVER_HOST } from "./notificationApi";

const host = `${API_SERVER_HOST}/api/ai-config`;

export const getAIConfig = async (organizationId, featureName) => {
  const res = await axios.get(`${host}/${organizationId}/${featureName}`);
  return res.data;
};

export const updateAIConfig = async (organizationId, featureName, isEnabled) => {
  const res = await axios.put(`${host}/${organizationId}/${featureName}`, null, {
    params: { isEnabled },
  });
  return res.data;
};

