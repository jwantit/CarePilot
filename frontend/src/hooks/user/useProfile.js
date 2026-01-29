import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../../api/user/userApi';
import { useAuth } from '../useAuth';
import toast from 'react-hot-toast';

export const useProfile = () => {
  const { logout } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', organization: '', organizationNumber: '', role: '' });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    getUserProfile()
      .then(data => {
        setFormData(data);
        setOriginalData(data);
      })
      .catch(() => toast.error("정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 저장 핸들러
  const handleSave = async () => {
    // 1. 이메일 형식 검증 추가
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("올바른 이메일 형식이 아닙니다.");
      return; // 검증 실패 시 함수 종료
    }

    const isCriticalChange = formData.name !== originalData.name || formData.email !== originalData.email;

    try {
      await updateUserProfile(formData);
      if (isCriticalChange) {
        toast.success("정보가 변경되어 다시 로그인해야 합니다.");
        setTimeout(() => logout(), 1500);
      } else {
        toast.success("저장되었습니다.");
        setOriginalData({ ...formData });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "저장에 실패했습니다.");
    }
  };

  return { formData, loading, handleChange, handleSave };
};