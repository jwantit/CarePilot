import React, { useState, useEffect } from "react";
import { noticeApi } from "../../api/noticeApi";
import Pagination from "../../components/notice/Pagination";
import NoticeList from "../../components/notice/NoticeList";
import NoticeForm from "../../components/notice/NoticeForm";
import NoticeDetail from "../../components/notice/NoticeDetail";
import { useAuth } from "../../hooks/useAuth";
import useCustomMove from "../../hooks/useCustomMove";
import Breadcrumb from "../../components/common/Breadcrumb";
import { PlusCircle, X, Search, RotateCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

function NoticePage() {
  const { user } = useAuth();
  const currentUserId = user?.userId || null;
  const currentOrgId = user?.organizationId || null;
  const [searchParams] = useSearchParams();

  // useCustomMove 훅 사용
  const { moveToList, page, size } = useCustomMove(null, null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [noticeType, setNoticeType] = useState("NORMAL");

  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const [notices, setNotices] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const pageIndex = page - 1;

  const loadNotices = async (pageNum = 0, keyword = "") => {
    try {
      const response = await noticeApi.getNotices(pageNum, size, keyword);
      const { content, totalPages, number } = response.data;

      setNotices(Array.isArray(content) ? content : []);
      setTotalPages(totalPages);
      setCurrentPage(number);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      setNotices([]);
    }
  };

  const handleSearch = () => {
    setSearchKeyword(searchInput);
    moveToList({ page: 1, size });
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchKeyword("");
    moveToList({ page: 1, size });
  };

  const handlePageChange = (newPage) => {
    moveToList({ page: newPage + 1, size });
  };

  useEffect(() => {
    loadNotices(pageIndex, searchKeyword);
  }, [page, searchKeyword]);

  // 답글 작성 시 자동으로 "@유저이름 " 추가
  useEffect(() => {
    if (replyTo) {
      const parentUserName = replyTo.userName || replyTo.writerName || "익명";
      const mentionText = `@${parentUserName}`;
      // 이미 @유저이름이 포함되어 있지 않으면 추가 (공백 포함/미포함 모두 체크)
      const hasMention =
        commentContent.trim().startsWith(mentionText + " ") ||
        commentContent.trim().startsWith(mentionText);
      if (!hasMention) {
        setCommentContent(`${mentionText} `);
      }
    } else {
      // 답글이 취소되면 @유저이름 제거
      if (commentContent && commentContent.trim().startsWith("@")) {
        const lines = commentContent.split("\n");
        if (lines[0].trim().startsWith("@")) {
          setCommentContent(commentContent.replace(/^@[^\s]+\s*/, "").trim());
        }
      }
    }
  }, [replyTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) return alert("로그인이 필요합니다.");

    const noticeData = {
      title,
      content,
      isPinned,
      noticeType,
      organizationId: currentOrgId,
      deletedFileIds: editingId ? deletedFileIds : undefined, // 수정 시에만 삭제할 파일 ID 전송
    };

    const currentEditingId = editingId; // editingId를 변수에 저장 (null로 설정하기 전에)

    try {
      if (currentEditingId) {
        await noticeApi.updateNotice(
          currentEditingId,
          noticeData,
          currentUserId,
          selectedFiles,
        );
      } else {
        await noticeApi.createNotice(noticeData, currentUserId, selectedFiles);
      } // 상태 초기화 및 목록 새로고침

      setShowForm(false);
      setEditingId(null);
      setTitle("");
      setContent("");
      setIsPinned(false);
      setNoticeType("NORMAL");
      clearFiles(); // 파일 초기화
      loadNotices(pageIndex);

      // 수정한 게시물이 상세 화면에 열려있다면 업데이트
      if (
        currentEditingId &&
        selectedNotice &&
        selectedNotice.noticeId === currentEditingId
      ) {
        try {
          const response = await noticeApi.getNotice(currentEditingId);
          setSelectedNotice(response.data);
        } catch (error) {
          console.error("게시물 업데이트 실패:", error);
        }
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert("공지사항 저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = async (notice) => {
    setEditingId(notice.noticeId);
    setTitle(notice.title);
    setContent(notice.content);
    setIsPinned(notice.isPinned || false);

    // 기존 파일 목록 로드
    try {
      const response = await noticeApi.getNotice(notice.noticeId);
      setExistingFiles(response.data.files || []);
      setDeletedFileIds([]);
    } catch (error) {
      console.error("파일 목록 로드 실패:", error);
      setExistingFiles([]);
      setDeletedFileIds([]);
    }

    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files?.length) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    e.target.value = "";
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setExistingFiles([]);
    setDeletedFileIds([]);
  };

  const handleDeleteExistingFile = (fileId) => {
    setDeletedFileIds([...deletedFileIds, fileId]);
    setExistingFiles(existingFiles.filter((file) => file.fileId !== fileId));
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      // 삭제 시 권한 확인을 위해 userId 전달
      await noticeApi.deleteNotice(noticeId, currentUserId);
      loadNotices(pageIndex);
    } catch (error) {
      alert("삭제 권한이 없거나 오류가 발생했습니다.");
    }
  };

  const handleDetail = async (notice) => {
    try {
      // 서버에 상세 조회 요청 (백엔드에서 조회수가 +1)
      const response = await noticeApi.getNotice(notice.noticeId);
      setSelectedNotice(response.data);
      await loadComments(notice.noticeId);
      setIsDetailOpen(true);
    } catch (error) {
      alert("상세 정보를 가져오는데 실패했습니다.");
    }
  };

  const loadComments = async (noticeId) => {
    try {
      const response = await noticeApi.getComments(noticeId);
      setComments(response.data);
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const commentData = {
      content: commentContent,
      userId: currentUserId,
      parentCommentId: replyTo ? replyTo.commentId : null,
    };

    try {
      await noticeApi.createComment(selectedNotice.noticeId, commentData);
      setCommentContent("");
      setReplyTo(null);
      loadComments(selectedNotice.noticeId);
    } catch (error) {
      alert("댓글 등록에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={["공지사항"]} />
      
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-5 flex flex-wrap items-center gap-3 shadow-lg">
        {/* 검색 영역 */}
        <div className="relative flex-1 min-w-[300px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-cp-muted">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-cp-border bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-cp-muted shadow-md focus:shadow-lg"
            placeholder="공지사항 검색 (제목 / 내용)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <button
          onClick={handleSearch}
          className="bg-cp-input hover:bg-cp-bg text-teal-400 px-6 py-2.5 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="font-mono text-teal-400">&gt;</span> 검색
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-cp-input border border-cp-border text-cp-muted text-sm font-semibold hover:bg-cp-bg hover:border-cp-border hover:text-cp-text transition-all whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <RotateCcw size={14} />
          전체보기
        </button>

        <div className="w-px h-8 bg-cp-border mx-2 hidden md:block"></div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setTitle("");
            setContent("");
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-sm font-black text-sm transition-all shadow-md border text-center ${
            showForm 
              ? "bg-cp-bg text-cp-muted border-cp-border hover:bg-cp-card hover:text-cp-text" 
              : "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-500 hover:from-teal-500 hover:to-teal-600"
          }`}
        >
          {showForm ? <X size={18} /> : <PlusCircle size={18} />}
          {showForm ? "닫기" : "공지 등록"}
        </button>
      </div>

      {showForm && (
        <NoticeForm
          title={title}
          setTitle={setTitle}
          content={content}
          setContent={setContent}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          noticeType={noticeType}
          setNoticeType={setNoticeType}
          handleSubmit={handleSubmit}
          editingId={editingId}
          setShowForm={setShowForm}
          setEditingId={setEditingId}
          selectedFiles={selectedFiles}
          handleFileChange={handleFileChange}
          existingFiles={existingFiles}
          onDeleteExistingFile={handleDeleteExistingFile}
        />
      )}
            <NoticeList notices={notices} onDetail={handleDetail} />     {" "}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
           {" "}
      <NoticeDetail
        selectedNotice={selectedNotice}
        isDetailOpen={isDetailOpen}
        setIsDetailOpen={setIsDetailOpen}
        comments={comments}
        commentContent={commentContent}
        setCommentContent={setCommentContent}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        handleCommentSubmit={handleCommentSubmit}
        loadComments={loadComments}
        currentUserId={currentUserId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
         {" "}
    </div>
  );
}

export default NoticePage;
