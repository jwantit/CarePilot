import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  // 현재 페이지 기준으로 전후 2페이지씩 표시
  const startPage = Math.max(0, currentPage - 2);
  const endPage = Math.min(totalPages - 1, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-12 mb-8">
      {/* 처음으로 */}
      <button
        type="button"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        className={`px-3 py-1.5 rounded border text-sm font-medium transition-all ${
          currentPage === 0
            ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
            : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
        }`}
      >
        처음
      </button>

      {/* 이전 페이지 버튼 */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={`px-3 py-1.5 rounded border text-sm font-medium transition-all ${
          currentPage === 0
            ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
            : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
        }`}
      >
        이전
      </button>

      {/* 페이지 번호 목록 */}
      {pageNumbers.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onPageChange(number)}
          className={`px-3 py-1.5 rounded border text-sm font-medium transition-all ${
            currentPage === number
              ? "bg-teal-600 text-white border-teal-500"
              : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
          }`}
        >
          {number + 1}
        </button>
      ))}

      {/* 다음 페이지 버튼 */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className={`px-3 py-1.5 rounded border text-sm font-medium transition-all ${
          currentPage === totalPages - 1
            ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
            : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
        }`}
      >
        다음
      </button>

      {/* 마지막으로 */}
      <button
        type="button"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages - 1}
        className={`px-3 py-1.5 rounded border text-sm font-medium transition-all ${
          currentPage === totalPages - 1
            ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
            : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
        }`}
      >
        마지막
      </button>
    </div>
  );
};

export default Pagination;