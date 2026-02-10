import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { noticeApi } from "../../api/notice/noticeApi";
import Pagination from "../../components/notice/Pagination";
import NoticeList from "../../components/notice/NoticeList";
import useCustomMove from "../../hooks/useCustomMove";
import Breadcrumb from "../../components/common/Breadcrumb";
import { PlusCircle, Search, RotateCcw } from "lucide-react";

function NoticeListPage() {
  const navigate = useNavigate();
  const { moveToList, page, size } = useCustomMove(null, null);

  const [notices, setNotices] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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

  const handleDetail = (notice) => {
    navigate(`/notice/${notice.noticeId}`);
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
          onClick={() => navigate('/notice/create')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-sm font-black text-sm transition-all shadow-md border text-center bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-500 hover:from-teal-500 hover:to-teal-600"
        >
          <PlusCircle size={18} />
          공지 등록
        </button>
      </div>

      <NoticeList notices={notices} onDetail={handleDetail} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default NoticeListPage;
