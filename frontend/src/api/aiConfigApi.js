import { apiClient } from "./apiClient";

const host = `/ai-config`;

export const getAIConfig = async (organizationId, featureName) => {
  const res = await apiClient.get(`${host}/${organizationId}/${featureName}`);
  return res.data;
};

export const updateAIConfig = async (
  organizationId,
  featureName,
  isEnabled,
) => {
  const res = await apiClient.put(
    `${host}/${organizationId}/${featureName}`,
    null,
    {
      params: { isEnabled },
    },
  );
  return res.data;
};
