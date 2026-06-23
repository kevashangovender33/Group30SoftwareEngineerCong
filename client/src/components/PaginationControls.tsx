interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}

/**
 * Computes the range of page buttons to display.
 * Shows at most 5 page numbers, centered around currentPage.
 * Adjusts to always show up to 5 pages when totalPages >= 5.
 */
export function computePageRange(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 0) return [];

  let firstPage = Math.max(1, currentPage - 2);
  let lastPage = Math.min(totalPages, firstPage + 4);

  // Adjust firstPage if we're near the end to always show up to 5 pages
  if (lastPage - firstPage < 4 && totalPages >= 5) {
    firstPage = Math.max(1, lastPage - 4);
  }

  const pages: number[] = [];
  for (let i = firstPage; i <= lastPage; i++) {
    pages.push(i);
  }
  return pages;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  disabled,
}: PaginationControlsProps) {
  const pages = computePageRange(currentPage, totalPages);
  const isPreviousDisabled = currentPage === 1 || disabled;
  const isNextDisabled = currentPage === totalPages || disabled;

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <p
        data-testid="pagination-info"
        className="text-sm text-on-surface-variant"
      >
        Page {currentPage} of {totalPages} — {totalCount} {totalCount === 1 ? 'dispute' : 'disputes'} total
      </p>

      <div className="flex items-center gap-1">
        <button
          data-testid="pagination-previous"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isPreviousDisabled}
          className="px-3 py-1.5 text-sm font-medium rounded border border-outline-variant text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
          aria-label="Previous page"
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            data-testid={`pagination-page-${page}`}
            onClick={() => onPageChange(page)}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              page === currentPage
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant text-on-surface hover:bg-surface-container-high'
            } disabled:cursor-not-allowed`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          data-testid="pagination-next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isNextDisabled}
          className="px-3 py-1.5 text-sm font-medium rounded border border-outline-variant text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
