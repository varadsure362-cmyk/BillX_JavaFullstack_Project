import React from 'react';

export const DataTable = ({
  columns = [],
  rows = [],
  pagination = null,
  onPageChange = null,
  loading = false,
  emptyMessage = 'No items found.',
}) => {
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { totalPages, pageNumber } = pagination;
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(0, pageNumber - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm text-gray-700 dark:text-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              // Loading Skeleton rows
              Array.from({ length: pagination?.pageSize || 5 }).map((_, rIdx) => (
                <tr key={`skeleton-row-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/5"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-gray-50/55 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs sm:text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-200">
              {(pagination.pageNumber * pagination.pageSize) + 1}
            </span> to <span className="font-semibold text-gray-700 dark:text-gray-200">
              {Math.min(pagination.totalElements, (pagination.pageNumber + 1) * pagination.pageSize)}
            </span> of <span className="font-semibold text-gray-700 dark:text-gray-200">
              {pagination.totalElements}
            </span> items
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onPageChange(pagination.pageNumber - 1)}
              disabled={pagination.pageNumber === 0}
              type="button"
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 transition-colors"
            >
              Previous
            </button>
            
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                type="button"
                className={`w-8 h-8 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center transition-all ${
                  page === pagination.pageNumber
                    ? 'bg-brand-green text-white'
                    : 'border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {page + 1}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(pagination.pageNumber + 1)}
              disabled={pagination.pageNumber === pagination.totalPages - 1}
              type="button"
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
