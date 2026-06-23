import type { DisputeListItem, SortField, SortOrder } from '../types/index';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import {
  formatDate,
  formatCurrency,
  formatPaymentType,
  formatIssueCategory,
  formatRuleCount,
} from '../utils/formatters';

interface DisputeTableProps {
  disputes: DisputeListItem[];
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

interface ColumnDef {
  key: string;
  label: string;
  sortField?: SortField;
}

const columns: ColumnDef[] = [
  { key: 'createdAt', label: 'Date', sortField: 'createdAt' },
  { key: 'customerName', label: 'Customer' },
  { key: 'transactionAmount', label: 'Amount' },
  { key: 'paymentType', label: 'Payment Type' },
  { key: 'issueCategory', label: 'Issue Category' },
  { key: 'recommendedAction', label: 'Action' },
  { key: 'priority', label: 'Priority', sortField: 'priority' },
  { key: 'status', label: 'Status', sortField: 'status' },
  { key: 'triggeredRuleCount', label: 'Rules' },
];

export function DisputeTable({ disputes, sortBy, sortOrder, onSort }: DisputeTableProps) {
  return (
    <div className="overflow-x-auto border border-outline-variant rounded-lg">
      <table data-testid="dispute-table" className="w-full text-left">
        <thead>
          <tr className="bg-gray-100 border-b border-outline-variant">
            {columns.map((col) => (
              <th
                key={col.key}
                data-testid={`table-header-${col.key}`}
                className={`px-4 py-3 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap ${
                  col.sortField ? 'cursor-pointer select-none hover:bg-surface-container-high transition-colors' : ''
                }`}
                onClick={col.sortField ? () => onSort(col.sortField!) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortField && (
                    <span
                      data-testid="sort-indicator"
                      className={`text-xs ${sortBy === col.sortField ? 'text-primary font-bold' : 'text-on-surface-variant opacity-40'}`}
                    >
                      {sortBy === col.sortField ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {disputes.map((dispute) => (
            <tr
              key={dispute.id}
              data-testid="dispute-row"
              className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-high transition-colors"
            >
              <td className="px-4 py-3 text-data-tabular text-on-surface whitespace-nowrap">
                {formatDate(dispute.createdAt)}
              </td>
              <td className="px-4 py-3 text-data-tabular text-on-surface">
                {dispute.customerName}
              </td>
              <td className="px-4 py-3 text-data-tabular text-on-surface whitespace-nowrap">
                {formatCurrency(dispute.transactionAmount)}
              </td>
              <td className="px-4 py-3 text-data-tabular text-on-surface whitespace-nowrap">
                {formatPaymentType(dispute.paymentType)}
              </td>
              <td className="px-4 py-3 text-data-tabular text-on-surface whitespace-nowrap">
                {formatIssueCategory(dispute.issueCategory)}
              </td>
              <td className="px-4 py-3 text-data-tabular text-on-surface">
                {dispute.recommendedAction}
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={dispute.priority} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={dispute.status} />
              </td>
              <td className="px-4 py-3 text-data-tabular text-on-surface whitespace-nowrap">
                {formatRuleCount(dispute.triggeredRuleCount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
