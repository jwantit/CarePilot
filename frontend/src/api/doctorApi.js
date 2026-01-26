import axios from "axios";
import { API_SERVER_HOST } from "./notificationApi";

const host = `${API_SERVER_HOST}/api/doctors`;

export const getAllDoctors = async (organizationId) => {
  const res = await axios.get(`${host}/organization/${organizationId}`);
  return res.data;
};

export const getDoctorsByFilter = async (organizationId, role, isActive, name) => {
  const params = {};
  if (role) params.role = role;
  if (isActive !== null && isActive !== undefined) params.isActive = isActive;
  if (name) params.name = name;
  
  const res = await axios.get(`${host}/organization/${organizationId}/filter`, { params });
  return res.data;
};

export const getDoctorById = async (doctorId) => {
  const res = await axios.get(`${host}/${doctorId}`);
  return res.data;
};

export const createDoctor = async (organizationId, doctor) => {
  const res = await axios.post(`${host}/organization/${organizationId}`, doctor);
  return res.data;
};

export const updateDoctor = async (doctorId, doctor) => {
  const res = await axios.put(`${host}/${doctorId}`, doctor);
  return res.data;
};

export const deleteDoctor = async (doctorId) => {
  const res = await axios.delete(`${host}/${doctorId}`);
  return res.data;
};

