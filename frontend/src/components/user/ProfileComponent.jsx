import React from 'react';

const ProfileComponent = ({ formData, handleChange, handleSave }) => {
  const inputClass = "mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">이름</label>
        <input name="name" className={inputClass} value={formData.name} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">이메일</label>
        <input name="email" className={inputClass} value={formData.email} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">전화번호</label>
        <input name="phone" className={inputClass} value={formData.phone} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">업체명</label>
        <input className={`${inputClass} bg-gray-50`} value={formData.organization} disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">업체번호</label>
        <input className={`${inputClass} bg-gray-50`} value={formData.organizationNumber} disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">직책</label>
        <input className={`${inputClass} bg-gray-50`} value={formData.role} disabled />
      </div>
      <button 
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition duration-200"
      >
        저장
      </button>
    </div>
  );
};

export default ProfileComponent;