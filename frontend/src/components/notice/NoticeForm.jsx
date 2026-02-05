import React from "react";

const NoticeForm = ({
  title,
  setTitle,
  content,
  setContent,
  isPinned,
  setIsPinned,
  noticeType,
  setNoticeType,
  handleSubmit,
  editingId,
  setShowForm,
  setEditingId,
  handleFileChange, // props로 받기
  selectedFiles, // props로 받기
  existingFiles = [], // 기존 파일 목록
  onDeleteExistingFile, // 기존 파일 삭제 핸들러
}) => {
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsPinned(false);
    setNoticeType("NORMAL");
    // setSelectedFiles([]); // 더 이상 내부에서 관리하지 않음
  };

  // handleFileChange는 이제 props로 받으므로 여기서는 제거합니다.
  // const handleFileChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   setSelectedFiles(files);
  // };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-12 p-8 border rounded-none bg-gray-50 shadow-sm border-gray-200"
    >
      <h2 className="text-center font-bold text-lg mb-6 text-gray-700">
        {editingId ? "공지사항 수정하기" : "새 공지사항 쓰기"}
      </h2>

      <div className="flex items-center gap-4 mb-4 px-1">
        {/* 게시글 종류 선택 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">게시글 종류:</label>
          <select
            value={noticeType}
            onChange={(e) => {
              setNoticeType(e.target.value);
              // 공지나 매뉴얼 선택 시 자동으로 고정 체크
              if (e.target.value === "NOTICE" || e.target.value === "MANUAL") {
                setIsPinned(true);
              } else {
                setIsPinned(false);
              }
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="NORMAL">일반</option>
            <option value="NOTICE">공지</option>
            <option value="MANUAL">매뉴얼</option>
          </select>
        </div>

        {/* 고정 체크박스 (오른쪽으로 이동) */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="checkbox"
            id="isPinned"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            disabled={noticeType === "NOTICE" || noticeType === "MANUAL"} // 공지나 매뉴얼일 때는 비활성화
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
          />
          <label
            htmlFor="isPinned"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            고정
          </label>
        </div>
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
      {/* 기존 파일 목록 (수정 시에만 표시) */}
      {editingId && existingFiles && existingFiles.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-none border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            기존 첨부 파일
          </label>
          <ul className="space-y-2">
            {existingFiles.map((file) => (
              <li key={file.fileId} className="flex items-center justify-between text-sm text-gray-600 bg-white p-2 rounded border">
                <span className="flex items-center gap-2">
                  📎 {file.originalName}
                  <span className="text-xs text-gray-400">
                    ({(file.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteExistingFile(file.fileId)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50 transition"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 파일 첨부 UI */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {editingId ? "새 파일 첨부 (여러 개 선택 가능)" : "파일 첨부 (여러 개 선택 가능)"}
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFiles && selectedFiles.length > 0 && (
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center gap-2">
                📎 {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-center gap-4">
        <button
          type="submit"
          className="bg-teal-600 text-white px-10 py-2 rounded-md font-bold hover:bg-teal-700 transition"
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
