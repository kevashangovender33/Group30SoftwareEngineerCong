import { useTransactions } from '../hooks/useApi';
import type { Transaction, TransactionStatus } from '../types/index';

interface TransactionSelectProps {
  customerId: string;
  customerName: string;
  onSelect: (transaction: Transaction) => void;
  onBack: () => void;
}

function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadgeClasses(status: TransactionStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'ALREADY_REFUNDED':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentTypeIcon(type: string): string {
  switch (type) {
    case 'CARD':
      return 'credit_card';
    case 'EFT':
      return 'account_balance';
    case 'INTERNAL':
      return 'payments';
    default:
      return 'receipt';
  }
}

export function TransactionSelect({
  customerId,
  customerName,
  onSelect,
  onBack,
}: TransactionSelectProps) {
  const { data: transactions, loading, error } = useTransactions(customerId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="loading-state">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-body-md text-on-surface-variant">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container border border-error/20 rounded-lg p-4" data-testid="error-state">
        <p className="text-on-error-container text-body-md">{error}</p>
      </div>
    );
  }

  return (
    <div data-testid="transaction-select">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-headline-lg text-primary mb-2">
          Step 2: Select Transaction for <span className="font-black">{customerName}</span>
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Review the transaction ledger below and select the specific entry being disputed.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-surface-container-low border-l-4 border-secondary-container p-4 mb-8 flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary pt-1">info</span>
        <div>
          <p className="text-body-md font-bold text-primary">System Recommendation</p>
          <p className="text-body-md text-on-surface-variant">
            Displaying all transactions for this customer. High-value transactions (&gt; R5,000) are flagged for priority review during triage.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 mb-4 flex flex-col md:flex-row gap-4 items-center">
        <button
          data-testid="back-button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant hover:bg-surface-container transition-colors rounded text-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Customers
        </button>
        <div className="ml-auto text-on-surface-variant text-label-md">
          {transactions ? `${transactions.length} Transactions found` : ''}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-outline-variant rounded overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F3F4F6]">
            <tr>
              <th className="px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Amount (ZAR)</th>
              <th className="px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Payment Type</th>
              <th className="px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-data-tabular divide-y divide-outline-variant">
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  data-testid={`transaction-item-${transaction.id}`}
                  className="hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                  onClick={() => onSelect(transaction)}
                >
                  <td className="px-4 py-4 text-on-surface">{formatDate(transaction.transactionDate)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">{transaction.description}</span>
                      <span className="text-[11px] text-on-surface-variant">ID: {transaction.id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-on-surface">{formatZAR(transaction.amount)}</td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">{getPaymentTypeIcon(transaction.paymentType)}</span>
                      {transaction.paymentType}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${getStatusBadgeClasses(transaction.status)}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(transaction);
                      }}
                      className="bg-primary text-on-primary text-label-md px-4 py-2 rounded-lg hover:opacity-90 transition-opacity uppercase"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-body-md text-on-surface-variant">
                  No transactions found for this customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
