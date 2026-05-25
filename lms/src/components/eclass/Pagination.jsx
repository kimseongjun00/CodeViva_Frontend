import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(1, currentPage - delta);
  const right = Math.min(totalPages, currentPage + delta);

  for (let i = left; i <= right; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 border-t border-[#e2e2e2] bg-[#f8f8f8] px-4 py-2">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#d3d3d3] bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        «
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#d3d3d3] bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        ‹
      </button>

      {left > 1 && <span className="px-1 text-xs text-gray-400">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`flex h-7 w-7 items-center justify-center rounded-sm border text-xs font-semibold ${
            p === currentPage
              ? 'border-[#1a6d7e] bg-[#1a6d7e] text-white'
              : 'border-[#d3d3d3] bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      ))}

      {right < totalPages && <span className="px-1 text-xs text-gray-400">…</span>}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#d3d3d3] bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#d3d3d3] bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        »
      </button>
    </div>
  );
};

export default Pagination;
