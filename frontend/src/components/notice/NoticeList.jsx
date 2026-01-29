import React from "react";

const NoticeList = ({ notices, onEdit, onDelete, onDetail }) => {
  return (
    <div className="grid gap-6">
      {notices.length > 0 ? (
        notices.map((notice) => (
          <div
            key={notice.noticeId}
            className="p-6 border rounded-lg flex justify-between items-center bg-white shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => onDetail(notice)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {notice.isPinned && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">
                    중요
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-800">
                  {notice.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-2 truncate">{notice.content}</p>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>조회수: {notice.viewCount}</span>
                {notice.writerName && <span>작성자: {notice.writerName}</span>}
              </div>
            </div>

            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onEdit(notice)}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                수정
              </button>
              <button
                onClick={() => onDelete(notice.noticeId)}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 text-gray-500 border rounded-lg bg-gray-50">
          등록된 공지사항이 없습니다.
        </div>
      )}
    </div>
  );
};

export default NoticeList;