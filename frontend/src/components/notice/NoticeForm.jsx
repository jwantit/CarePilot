import React from "react";

const NoticeForm = ({ 
  title, 
  setTitle, 
  content, 
  setContent, 
  handleSubmit, 
  editingId, 
  setShowForm, 
  setEditingId 
}) => {

const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-12 p-8 border rounded-xl bg-gray-50 shadow-sm border-gray-200"
    >
      <h2 className="text-center font-bold text-lg mb-6 text-gray-700">
        {editingId ? "공지사항 수정하기" : "새 공지사항 쓰기"}
      </h2>
      <input
        className="w-full p-3 mb-4 border rounded-md outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="w-full p-3 mb-4 border rounded-md h-32 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="flex justify-center gap-4">
        <button
          type="submit"
          className="bg-blue-500 text-white px-10 py-2 rounded-md font-bold hover:bg-blue-600 transition"
        >
          {editingId ? "수정 완료" : "등록하기"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md font-bold hover:bg-gray-400 transition">취소</button>
      </div>
    </form>
  );
};

export default NoticeForm;