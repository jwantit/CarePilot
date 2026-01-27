import React from 'react';
import ProfileComponent from '../../components/user/ProfileComponent';
import { useProfile } from '../../hooks/user/useProfile';
import Loading from '../../components/common/Loading';

const ProfilePage = () => {
  const { formData, loading, handleChange, handleSave } = useProfile();

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">개인 정보</h1>
      <ProfileComponent 
        formData={formData} 
        handleChange={handleChange} 
        handleSave={handleSave} 
      />
    </div>
  );
};

export default ProfilePage;