import { useState } from 'react';
import type { DisputeFilters } from '../types/index';

interface FilterPanelProps {
  filters: DisputeFilters;
  onFiltersChange: (filters: DisputeFilters) => void;
  onClear: () => void;
  activeFilterCount: number;
  disabled: boolean;
}

const PAYMENT_TYPE_OPTIONS = [
  { value: '', label: 'All Payment Types' },
  { value: 'CARD', label: 'Card' },
  { value: 'EFT', label: 'EFT' },
  { value: 'INTERNAL', label: 'Internal Transfer' },
];

const ISSUE_CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'DUPLICATE_DEBIT', label: 'Duplicate Debit' },
  { value: 'FAILED_TRANSFER', label: 'Failed Transfer' },
  { value: 'MISSING_PAYMENT', label: 'Missing Payment' },
  { value: 'UNAUTHORISED', label: 'Unauthorised' },
  { value: 'INCORRECT_AMOUNT', label: 'Incorrect Amount' },
  { value: 'CARD_DISPUTE', label: 'Card Dispute' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'TRIAGED', label: 'Triaged' },
  { value: 'CLOSED', label: 'Closed' },
];

export function FilterPanel({
  filters,
  onFiltersChange,
  onClear,
  activeFilterCount,
  disabled,
}: FilterPanelProps) {
  const [dateError, setDateError] = useState<string>('');

  const handleFilterChange = (field: keyof DisputeFilters, value: string) => {
    const updatedFilters = { ...filters, [field]: value };

    // Validate date range when either date changes
    if (field === 'startDate' || field === 'endDate') {
      const start = field === 'startDate' ? value : filters.startDate;
      const end = field === 'endDate' ? value : filters.endDate;

      if (start && end && start > end) {
        setDateError('Start date must be before or equal to end date');
        return;
      }
      setDateError('');
    }

    onFiltersChange(updatedFilters);
  };

  const selectClasses =
    'w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary';

  const inputClasses =
    'w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary';

  return (
    <div
      data-testid="filter-panel"
      className={`bg-surface-container-lowest border border-outline-variant rounded-lg p-4 mb-6 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">filter_list</span>
          <span className="text-body-md font-semibold text-on-surface">Filters</span>
          {activeFilterCount > 0 && (
            <span
              data-testid="filter-count"
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-bold"
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          data-testid="filter-clear"
          type="button"
          onClick={onClear}
          className="text-body-md text-secondary hover:text-primary font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Name Search */}
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="filter-customer-name" className="block text-label-md text-on-surface-variant mb-1">
            Customer Name
          </label>
          <input
            id="filter-customer-name"
            data-testid="filter-customer-name"
            type="text"
            placeholder="Search by customer name..."
            maxLength={100}
            value={filters.customerName}
            onChange={(e) => handleFilterChange('customerName', e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Payment Type */}
        <div>
          <label htmlFor="filter-payment-type" className="block text-label-md text-on-surface-variant mb-1">
            Payment Type
          </label>
          <select
            id="filter-payment-type"
            data-testid="filter-payment-type"
            value={filters.paymentType}
            onChange={(e) => handleFilterChange('paymentType', e.target.value)}
            className={selectClasses}
          >
            {PAYMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Category */}
        <div>
          <label htmlFor="filter-issue-category" className="block text-label-md text-on-surface-variant mb-1">
            Issue Category
          </label>
          <select
            id="filter-issue-category"
            data-testid="filter-issue-category"
            value={filters.issueCategory}
            onChange={(e) => handleFilterChange('issueCategory', e.target.value)}
            className={selectClasses}
          >
            {ISSUE_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="filter-priority" className="block text-label-md text-on-surface-variant mb-1">
            Priority
          </label>
          <select
            id="filter-priority"
            data-testid="filter-priority"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className={selectClasses}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="filter-status" className="block text-label-md text-on-surface-variant mb-1">
            Status
          </label>
          <select
            id="filter-status"
            data-testid="filter-status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={selectClasses}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="filter-start-date" className="block text-label-md text-on-surface-variant mb-1">
            Start Date
          </label>
          <input
            id="filter-start-date"
            data-testid="filter-start-date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="filter-end-date" className="block text-label-md text-on-surface-variant mb-1">
            End Date
          </label>
          <input
            id="filter-end-date"
            data-testid="filter-end-date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Date validation error */}
      {dateError && (
        <p data-testid="filter-date-error" className="mt-2 text-body-md text-error font-medium">
          {dateError}
        </p>
      )}
    </div>
  );
}
