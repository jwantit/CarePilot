import React from 'react';
import ProfileComponent from '../../components/user/ProfileComponent';
import { useProfile } from '../../hooks/user/useProfile';
import Loading from '../../components/common/Loading';
import Breadcrumb from '../../components/common/Breadcrumb';

const ProfilePage = () => {
  const { formData, loading, handleChange, handleSave } = useProfile();

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb items={["개인 정보"]} />
      <h1 className="text-2xl font-bold text-slate-100">개인 정보</h1>
      <ProfileComponent 
        formData={formData} 
        handleChange={handleChange} 
        handleSave={handleSave} 
      />
    </div>
  );
};

export default ProfilePage;