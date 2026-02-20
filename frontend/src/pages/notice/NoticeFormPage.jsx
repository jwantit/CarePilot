import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { noticeApi } from "../../api/notice/noticeApi";
import NoticeForm from "../../components/notice/NoticeForm";
import { useAuth } from "../../hooks/useAuth";
import Breadcrumb from "../../components/common/Breadcrumb";

function NoticeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.userId || null;
  const currentOrgId = user?.organizationId || null;

  const isEditMode = !!id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [noticeType, setNoticeType] = useState("NORMAL");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditMode) {
      const loadNotice = async () => {
        try {
          const response = await noticeApi.getNotice(id);
          const notice = response.data;
          setTitle(notice.title);
          setContent(notice.content);
          setIsPinned(notice.isPinned || false);
          setNoticeType(notice.noticeType || "NORMAL");
          setExistingFiles(notice.files || []);
          setDeletedFileIds([]);
        } catch (error) {
          console.error("게시물 로드 실패:", error);
          alert("게시물을 불러오는데 실패했습니다.");
          navigate("/notice");
        }
      };
      loadNotice();
    }
  }, [id, isEditMode, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) return alert("로그인이 필요합니다.");

    const noticeData = {
      title,
      content,
      isPinned,
      noticeType,
      organizationId: currentOrgId,
      deletedFileIds: isEditMode ? deletedFileIds : undefined,
    };

    try {
      if (isEditMode) {
        await noticeApi.updateNotice(
          id,
          noticeData,
          currentUserId,
          selectedFiles,
        );
      } else {
        await noticeApi.createNotice(noticeData, currentUserId, selectedFiles);
      }

      // 완료 후 목록 페이지로 이동
      navigate("/notice");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("공지사항 저장 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    navigate("/notice");
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "공지사항", path: "/notice" }, isEditMode ? "수정" : "작성"]} />
      
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
        editingId={isEditMode ? id : null}
        setShowForm={handleCancel}
        setEditingId={() => {}}
        selectedFiles={selectedFiles}
        handleFileChange={handleFileChange}
        existingFiles={existingFiles}
        onDeleteExistingFile={handleDeleteExistingFile}
      />
    </div>
  );
}

export default NoticeFormPage;
