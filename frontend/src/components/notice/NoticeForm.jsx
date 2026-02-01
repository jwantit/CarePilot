import React from "react";

const NoticeForm = ({
  title,
  setTitle,
  content,
  setContent,
  isPinned,
  setIsPinned,
  handleSubmit,
  editingId,
  setShowForm,
  setEditingId,
}) => {
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsPinned(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-12 p-8 border rounded-xl bg-gray-50 shadow-sm border-gray-200"
    >
      <h2 className="text-center font-bold text-lg mb-6 text-gray-700">
        {editingId ? "공지사항 수정하기" : "새 공지사항 쓰기"}
      </h2>

      <div className="flex items-center gap-2 mb-4 px-1">
        <input
          type="checkbox"
          id="isPinned"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor="isPinned"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          이 게시글을 상단에 고정합니다 (중요 공지)
        </label>
      </div>

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
          className="bg-gray-200 text-gray-700 px-10 py-2 rounded-md font-bold hover:bg-gray-300 transition"
        >
          취소
        </button>
      </div>
    </form>
  );
};

export default NoticeForm;