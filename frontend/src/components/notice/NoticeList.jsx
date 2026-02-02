import React from "react";
import { getFileUrl } from "../../hooks/fileHelper";

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

  const getThumbnailImage = (notice) => {
    if (!notice.files || notice.files.length === 0) return null;
    
    // 이미지 파일들 필터링 (가장 먼저 올라간 이미지 = 배열의 첫 번째 이미지)
    const imageFiles = notice.files.filter(file => 
      file.contentType && file.contentType.startsWith("image/")
    );
    
    if (imageFiles.length === 0) return null;
    
    // 첫 번째 이미지 파일 선택
    const firstImageFile = imageFiles[0];
    
    // 썸네일 URL이 있으면 사용, 없으면 원본 이미지 storagePath 사용
    if (firstImageFile.thumbnailUrl) {
      // thumbnailUrl이 상대 경로인 경우 전체 URL로 변환
      if (firstImageFile.thumbnailUrl.startsWith('http')) {
        return firstImageFile.thumbnailUrl;
      } else {
        // 상대 경로인 경우 (예: /api/notices/files/1/thumbnail)
        return `http://localhost:8080${firstImageFile.thumbnailUrl}`;
      }
    } else if (firstImageFile.storagePath) {
      // 썸네일이 없으면 원본 이미지를 작은 크기로 표시
      return getFileUrl(firstImageFile.storagePath);
    }
    
    return null;
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {notices && notices.length > 0 ? (
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-16" /> {/* 번호 */}
            <col className="w-auto" /> {/* 제목 */}
            <col className="w-28" /> {/* 작성자 */}
            <col className="w-32" /> {/* 작성 시간 */}
            <col className="w-20" /> {/* 조회수 */}
          </colgroup>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">번호</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">제목</th>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">작성자</th>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">작성 시간</th>
              <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">조회수</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => {
              const thumbnailUrl = getThumbnailImage(notice);
              
              return (
                <tr
                  key={notice.noticeId}
                  className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => onDetail(notice)}
                >
                  <td className="px-3 py-3 text-center text-sm text-gray-600">
                    {notice.isPinned ? (
                      <span className="inline-block bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded font-bold whitespace-nowrap">
                        공지
                      </span>
                    ) : (
                      <span className="inline-block">{notice.noticeId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center gap-3">
                      {thumbnailUrl ? (
                        <>
                          <img
                            src={thumbnailUrl}
                            alt="썸네일"
                            className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <span className="hover:text-blue-600 truncate flex-1">{notice.title}</span>
                        </>
                      ) : (
                        <span className="hover:text-blue-600 truncate ml-2">{notice.title}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600 truncate">
                    {notice.writerName || "익명"}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(notice.createdAt)}
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