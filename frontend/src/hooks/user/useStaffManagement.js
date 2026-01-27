import { useState, useEffect } from 'react';
import { getStaffList, updateStaffStatus, updateStaffRole } from '../../api/user/userApi';
import { toast } from 'react-hot-toast';

export const useStaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaffList();
      setStaffList(data);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "직원 목록을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await updateStaffStatus(userId, newStatus);
      toast.success("상태가 변경되었습니다.");
      fetchStaff(); // 목록 새로고침
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "상태 변경에 실패했습니다.";
      toast.error(errorMessage);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateStaffRole(userId, newRole);
      toast.success("권한이 변경되었습니다.");
      fetchStaff();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "권한 변경에 실패했습니다.";
      toast.error(errorMessage);
    }
  };

  return { staffList, loading, handleStatusUpdate, handleRoleUpdate, refresh: fetchStaff };
};