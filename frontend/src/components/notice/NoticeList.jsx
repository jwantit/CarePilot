import React from "react";
import { FileText, MessageSquare, Pin } from "lucide-react";

const NoticeList = ({ notices, onDetail }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();

    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (isToday) {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    }
  };

  return (
    <div className="bg-cp-card border border-cp-border rounded-sm overflow-hidden shadow-lg">
      {notices && notices.length > 0 ? (
        <table className="w-full text-left">
          <thead className="bg-cp-header text-white dark:text-cp-muted uppercase text-sm border-b-2 border-teal-500/30">
            <tr>
              <th className="px-4 py-3 text-white dark:text-teal-400 w-20 text-center">종류</th>
              <th className="px-4 py-3 text-white dark:text-teal-400">제목</th>
              <th className="px-4 py-3 text-white dark:text-teal-400 w-32 text-center">
                작성자
              </th>
              <th className="px-4 py-3 text-white dark:text-teal-400 w-32 text-center">
                작성 시간
              </th>
              <th className="px-4 py-3 text-white dark:text-teal-400 w-24 text-center">
                조회수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cp-border">
            {notices.map((notice) => {
              const isPinned = notice.isPinned;
              return (
                <tr
                  key={notice.noticeId}
                  className="hover:bg-cp-bg/50 transition cursor-pointer bg-cp-card/30 group"
                  onClick={() => onDetail(notice)}
                >
                  <td className="px-4 py-5 text-center">
                    {(() => {
                      const type = notice.noticeType || "NORMAL";
                      if (type === "NOTICE") {
                        return (
                          <span className="inline-block bg-red-500/20 text-red-400 border border-red-500/50 text-xs px-2.5 py-1 rounded-sm font-black whitespace-nowrap uppercase">
                            공지
                          </span>
                        );
                      } else if (type === "MANUAL") {
                        return (
                          <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs px-2.5 py-1 rounded-sm font-black whitespace-nowrap uppercase">
                            매뉴얼
                          </span>
                        );
                      } else {
                        return (
                          <span className="inline-block bg-cp-bg text-cp-text border border-cp-border text-xs px-2.5 py-1 rounded-sm font-bold whitespace-nowrap uppercase">
                            일반
                          </span>
                        );
                      }
                    })()}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      {isPinned && (
                        <Pin
                          size={16}
                          className="text-teal-400 fill-teal-400/20 rotate-45 shrink-0"
                        />
                      )}
                      <span className="text-cp-text text-base truncate max-w-lg group-hover:text-teal-400 transition-colors">
                        {notice.title}
                      </span>
                      {notice.files && notice.files.length > 0 && (
                        <FileText
                          size={16}
                          className="text-cp-muted shrink-0"
                        />
                      )}
                      {notice.commentCount > 0 && (
                        <div className="flex items-center gap-1.5 text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-sm border border-teal-500/20">
                          <MessageSquare size={14} />
                          <span className="text-xs font-mono">
                            {notice.commentCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center text-base text-cp-text truncate">
                    {notice.writerName || "익명"}
                  </td>
                  <td className="px-4 py-5 text-center text-sm text-slate-400 whitespace-nowrap font-mono tracking-tighter">
                    {notice.updatedAt && notice.updatedAt !== notice.createdAt
                      ? formatDate(notice.updatedAt)
                      : formatDate(notice.createdAt)}
                  </td>
                  <td className="px-4 py-5 text-center text-base text-cp-muted font-mono font-bold">
                    {notice.viewCount || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-20 text-cp-muted bg-cp-card/30">
          게시글이 없습니다.
        </div>
      )}
    </div>
  );
};

export default NoticeList;
