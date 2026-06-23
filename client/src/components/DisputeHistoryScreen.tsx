import { useState, useCallback } from 'react';
import type { DisputeFilters, SortField, SortOrder } from '../types/index';
import { DEFAULT_DISPUTE_HISTORY_STATE } from '../types/index';
import { useDisputeHistory } from '../hooks/useDisputeHistory';
import { FilterPanel } from './FilterPanel';
import { DisputeTable } from './DisputeTable';
import { PaginationControls } from './PaginationControls';

interface DisputeHistoryScreenProps {
  customerId?: string;
  customerName?: string;
  onBack?: () => void;
  onProceed?: () => void;
}

export function DisputeHistoryScreen({
  customerId,
  customerName,
  onBack,
  onProceed,
}: DisputeHistoryScreenProps) {
  const [filters, setFilters] = useState<DisputeFilters>(
    DEFAULT_DISPUTE_HISTORY_STATE.filters
  );
  const [sortBy, setSortBy] = useState<SortField>(
    DEFAULT_DISPUTE_HISTORY_STATE.sortBy
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    DEFAULT_DISPUTE_HISTORY_STATE.sortOrder
  );
  const [currentPage, setCurrentPage] = useState(
    DEFAULT_DISPUTE_HISTORY_STATE.currentPage
  );

  const { data, loading, error, refetch } = useDisputeHistory({
    filters,
    sortBy,
    sortOrder,
    page: currentPage,
    pageSize: DEFAULT_DISPUTE_HISTORY_STATE.pageSize,
    customerId,
  });

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== ''
  ).length;

  const handleFiltersChange = useCallback((newFilters: DisputeFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_DISPUTE_HISTORY_STATE.filters);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortBy) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(field);
        setSortOrder('asc');
      }
      setCurrentPage(1);
    },
    [sortBy]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const isCustomerMode = !!customerId;

  const emptyMessage = isCustomerMode
    ? `No disputes found for ${customerName || 'this customer'}.`
    : 'No disputes found.';

  return (
    <div data-testid="dispute-history-screen" className="max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      {/* Header */}
      {isCustomerMode ? (
        <div className="mb-6">
          <h2 className="text-headline-md text-on-surface font-semibold mb-4">
            {customerName || 'Customer'} — Dispute History
          </h2>
          <div className="flex items-center gap-3">
            <button
              data-testid="back-button"
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-body-md font-medium text-secondary border border-outline-variant rounded hover:bg-surface-container-high transition-colors"
            >
              Back to Customer Selection
            </button>
            <button
              data-testid="proceed-button"
              type="button"
              onClick={onProceed}
              className="px-4 py-2 text-body-md font-medium text-on-primary bg-primary rounded hover:opacity-90 transition-opacity"
            >
              Proceed to Capture
            </button>
          </div>
        </div>
      ) : (
        <h1 className="text-headline-lg text-on-surface font-bold mb-6">
          Dispute History
        </h1>
      )}

      {/* Loading State */}
      {loading && (
        <div
          data-testid="loading-indicator"
          className="flex items-center justify-center py-16"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-body-md text-on-surface-variant">
              Loading disputes...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          data-testid="error-message"
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <span className="material-symbols-outlined text-error text-[48px]">
            error
          </span>
          <p className="text-body-lg text-on-surface text-center">{error}</p>
          <button
            data-testid="retry-button"
            type="button"
            onClick={refetch}
            className="px-4 py-2 text-body-md font-medium text-on-primary bg-primary rounded hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data && data.disputes.length === 0 && (
        <div>
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
            activeFilterCount={activeFilterCount}
            disabled={false}
          />
          <div
            data-testid="empty-message"
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[48px]">
              search_off
            </span>
            <p className="text-body-lg text-on-surface-variant text-center">
              {emptyMessage}
            </p>
          </div>
        </div>
      )}

      {/* Data State */}
      {!loading && !error && data && data.disputes.length > 0 && (
        <div>
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
            activeFilterCount={activeFilterCount}
            disabled={false}
          />
          <DisputeTable
            disputes={data.disputes}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <PaginationControls
            currentPage={data.page}
            totalPages={data.totalPages}
            totalCount={data.totalCount}
            onPageChange={handlePageChange}
            disabled={false}
          />
        </div>
      )}

      {/* Disabled overlays for filter/pagination during loading (when data already exists) */}
      {loading && data && (
        <div>
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
            activeFilterCount={activeFilterCount}
            disabled={true}
          />
          <DisputeTable
            disputes={data.disputes}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <PaginationControls
            currentPage={data.page}
            totalPages={data.totalPages}
            totalCount={data.totalCount}
            onPageChange={handlePageChange}
            disabled={true}
          />
        </div>
      )}
    </div>
  );
}
