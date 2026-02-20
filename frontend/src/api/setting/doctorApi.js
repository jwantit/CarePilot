import { apiClient } from '../apiClient';

const host = `/doctors`;

export const getAllDoctors = async (organizationId) => {
  const res = await apiClient.get(`${host}/organization/${organizationId}`);
  return res.data;
};

export const getDoctorsByFilter = async (
  organizationId,
  role,
  isActive,
  name,
) => {
  const params = {};
  if (role) params.role = role;
  if (isActive !== null && isActive !== undefined) params.isActive = isActive;
  if (name) params.name = name;

  const res = await apiClient.get(
    `${host}/organization/${organizationId}/filter`,
    {
      params,
    },
  );
  return res.data;
};

export const getDoctorById = async (doctorId) => {
  const res = await apiClient.get(`${host}/${doctorId}`);
  return res.data;
};

export const createDoctor = async (organizationId, doctor) => {
  const res = await apiClient.post(
    `${host}/organization/${organizationId}`,
    doctor,
  );
  return res.data;
};

export const updateDoctor = async (doctorId, doctor) => {
  const res = await apiClient.put(`${host}/${doctorId}`, doctor);
  return res.data;
};

export const deleteDoctor = async (doctorId) => {
  const res = await apiClient.delete(`${host}/${doctorId}`);
  return res.data;
};

/**
 * ?�료�??�???�록 (CSV/EXCEL)
 * formData: files(List), organizationId, isActive(기본 ?�태)
 */
export const uploadDoctorCsv = async (formData) => {
  const res = await apiClient.post(
    `${host}/organization/${formData.get("organizationId")}/csv`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
};
