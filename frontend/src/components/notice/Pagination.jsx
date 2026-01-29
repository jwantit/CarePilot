import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 0) return null;

    return (
        <div className="flex justify-center items-center mt-10 gap-2">
            <button
                disabled={currentPage === 0}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-4 py-2 border rounded-md disabled:opacity-30 hover:bg-gray-100 transition"
            >
                이전
            </button>
            {[...Array(totalPages).keys()].map((pageNum) => (
                <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-10 h-10 rounded-md transition ${
                        currentPage === pageNum
                        ? "bg-blue-500 text-white font-bold"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    {pageNum + 1}
                </button>
            ))}
            <button
                disabled={currentPage === totalPages - 1}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-4 py-2 border rounded-md disabled:opacity-30 hover:bg-gray-100 transition"
            >
                다음
            </button>
        </div>
    );
};

export default Pagination;