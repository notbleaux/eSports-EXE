/** [Ver001.000] */
/**
 * Pagination Component
 * ====================
 * Navigate through paginated content.
 */

import React, { useMemo } from 'react';

export interface PaginationProps {
  total: number;
  pageSize?: number;
  currentPage?: number;
  onChange?: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  className?: string;
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      total,
      pageSize = 10,
      currentPage = 1,
      onChange,
      siblingCount = 1,
      boundaryCount = 1,
      className = '',
    },
    ref
  ) => {
    const totalPages = Math.ceil(total / pageSize);

    const pages = useMemo(() => {
      const range = (start: number, end: number) => {
        const length = end - start + 1;
        return Array.from({ length }, (_, i) => start + i);
      };

      const startPages = range(1, Math.min(boundaryCount, totalPages));
      const endPages = range(
        Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
        totalPages
      );

      const siblingsStart = Math.max(
        Math.min(currentPage - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1),
        boundaryCount + 2
      );

      const siblingsEnd = Math.min(
        Math.max(currentPage + siblingCount, boundaryCount + siblingCount * 2 + 2),
        endPages.length > 0 ? endPages[0] - 2 : totalPages - 1
      );

      const itemList: (number | string)[] = [];

      itemList.push(...startPages);

      if (siblingsStart > boundaryCount + 2) {
        itemList.push('start-ellipsis');
      } else if (boundaryCount + 1 < totalPages - boundaryCount) {
        itemList.push(boundaryCount + 1);
      }

      itemList.push(...range(siblingsStart, siblingsEnd));

      if (siblingsEnd < totalPages - boundaryCount - 1) {
        itemList.push('end-ellipsis');
      } else if (totalPages - boundaryCount > boundaryCount) {
        itemList.push(totalPages - boundaryCount);
      }

      itemList.push(...endPages);

      return itemList;
    }, [totalPages, currentPage, siblingCount, boundaryCount]);

    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onChange?.(page);
      }
    };

    const buttonStyles = `
      inline-flex items-center justify-center min-w-[2rem] h-8 px-2
      text-sm font-medium rounded-md transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    `;

    const activeStyles = 'bg-primary-600 text-white hover:bg-primary-700';
    const inactiveStyles = 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
    const disabledStyles = 'opacity-50 cursor-not-allowed';

    if (totalPages <= 1) return null;

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={`flex items-center gap-1 ${className}`}
      >
        {/* Previous */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${buttonStyles} ${currentPage === 1 ? disabledStyles : inactiveStyles}`}
          aria-label="Previous page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((page, index) => {
          if (page === 'start-ellipsis' || page === 'end-ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-gray-400 dark:text-gray-500"
              >
                …
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page as number)}
              aria-current={isActive ? 'page' : undefined}
              className={`${buttonStyles} ${isActive ? activeStyles : inactiveStyles}`}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${buttonStyles} ${currentPage === totalPages ? disabledStyles : inactiveStyles}`}
          aria-label="Next page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;
