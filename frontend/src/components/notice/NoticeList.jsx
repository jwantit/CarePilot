import React from "react";

const NoticeList = ({ notices, onDetail }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    
    // 오늘 날짜인지 확인 (년, 월, 일만 비교)
    const isToday = 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    
    if (isToday) {
      // 오늘이면 시간만 표시
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } else {
      // 오늘이 아니면 일자만 표시
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}.`;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {notices && notices.length > 0 ? (
        <table className="w-full table-fixed">
          <colgroup><col className="w-16" /><col className="w-auto" /><col className="w-28" /><col className="w-32" /><col className="w-20" /></colgroup>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">종류</th>
              <th className="pl-1 pr-2 py-3 text-center text-sm font-semibold text-gray-700">제목</th>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">작성자</th>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">작성 시간</th>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">조회수</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => {
              return (
                <tr
                  key={notice.noticeId}
                  className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => onDetail(notice)}
                >
                  <td className="px-3 py-3 text-center text-sm text-gray-600">
                    {(() => {
                      const type = notice.noticeType || "NORMAL";
                      if (type === "NOTICE") {
                        return (
                          <span className="inline-block bg-red-500 text-white border border-red-600 text-xs px-2 py-0.5 rounded font-bold whitespace-nowrap">
                            공지
                          </span>
                        );
                      } else if (type === "MANUAL") {
                        return (
                          <span className="inline-block bg-green-500 text-white border border-green-600 text-xs px-2 py-0.5 rounded font-bold whitespace-nowrap">
                            매뉴얼
                          </span>
                        );
                      } else {
                        return (
                          <span className="inline-block bg-white border border-gray-300 text-gray-700 text-xs px-2 py-0.5 rounded font-bold whitespace-nowrap">
                            일반
                          </span>
                        );
                      }
                    })()}
                  </td>
                  <td className="pl-1 pr-2 py-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="hover:text-blue-600 truncate">{notice.title}</span>
                      {/* 파일 첨부 아이콘 */}
                      {notice.files && notice.files.length > 0 && (
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                      {/* 댓글 개수 */}
                      {notice.commentCount > 0 && (
                        <span className="text-red-500 text-xs font-medium flex-shrink-0">[{notice.commentCount}]</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600 truncate">
                    {notice.writerName || "익명"}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-500 whitespace-nowrap">
                    {notice.updatedAt && notice.updatedAt !== notice.createdAt 
                      ? formatDate(notice.updatedAt) 
                      : formatDate(notice.createdAt)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600">
                    {notice.viewCount || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-20 text-gray-500">
          게시글이 없습니다.
        </div>
      )}
    </div>
  );
};

export default NoticeList;