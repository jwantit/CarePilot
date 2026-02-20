import React from 'react';
import ProfileComponent from '../../components/user/ProfileComponent';
import { useProfile } from '../../hooks/user/useProfile';
import Loading from '../../components/common/Loading';
import Breadcrumb from '../../components/common/Breadcrumb';

const ProfilePage = () => {
  const { formData, loading, handleChange, handleSave } = useProfile();

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-6">
      <div className="w-full max-w-2xl">
        <Breadcrumb items={["개인정보 수정"]} />
        <ProfileComponent 
          formData={formData} 
          handleChange={handleChange} 
          handleSave={handleSave} 
        />
      </div>
    </div>
  );
};

export default ProfilePage;