import { useState, type FormEvent } from 'react';
import { useCreateDispute } from '../hooks/useApi';
import type {
  Customer,
  Transaction,
  ReferenceData,
  IssueCategory,
  DisputeResponse,
} from '../types/index';

const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  DUPLICATE_DEBIT: 'Duplicate Debit',
  FAILED_TRANSFER: 'Failed Transfer',
  MISSING_PAYMENT: 'Missing Payment',
  UNAUTHORISED: 'Unauthorised Transaction',
  INCORRECT_AMOUNT: 'Incorrect Amount',
  CARD_DISPUTE: 'Card Dispute',
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CARD: 'Card Payment',
  EFT: 'EFT Payment',
  INTERNAL: 'Internal Transfer',
};

interface DisputeCaptureFormProps {
  customer: Customer;
  transaction: Transaction;
  referenceData: ReferenceData | null;
  onSubmit: (result: DisputeResponse) => void;
  onBack: () => void;
}

export function DisputeCaptureForm({
  customer,
  transaction,
  referenceData: _referenceData,
  onSubmit,
  onBack,
}: DisputeCaptureFormProps) {
  const [issueCategory, setIssueCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, loading, error: apiError } = useCreateDispute();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!issueCategory) {
      setValidationError('Issue category is required');
      return;
    }

    setValidationError(null);

    try {
      const result = await mutate({
        transactionId: transaction.id,
        paymentType: transaction.paymentType,
        issueCategory,
      });
      onSubmit(result);
    } catch {
      // Error is handled by the hook's error state
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const issueCategories = Object.keys(ISSUE_CATEGORY_LABELS) as IssueCategory[];

  return (
    <div>
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-headline-lg text-primary mb-2">Step 3: Capture Dispute Details</h1>
        <p className="text-body-md text-on-surface-variant">
          Provide the necessary details regarding the customer&apos;s claim to initiate the automated triage analysis.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Type (Read-only) */}
              <div>
                <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Payment Type
                </label>
                <div className="relative">
                  <input
                    data-testid="payment-type-select"
                    type="text"
                    readOnly
                    value={PAYMENT_TYPE_LABELS[transaction.paymentType] ?? transaction.paymentType}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-body-md px-4 py-2.5 rounded cursor-not-allowed"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant opacity-50">lock</span>
                </div>
              </div>

              {/* Issue Category */}
              <div>
                <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Issue Category <span className="text-error">*</span>
                </label>
                <select
                  data-testid="issue-category-select"
                  value={issueCategory}
                  onChange={(e) => {
                    setIssueCategory(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full border border-outline-variant text-on-surface text-body-md px-4 py-2.5 rounded focus:ring-0 focus:border-primary transition-all"
                >
                  <option disabled value="">Select a category...</option>
                  {issueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {ISSUE_CATEGORY_LABELS[cat] ?? cat}
                    </option>
                  ))}
                </select>
                {validationError && (
                  <p data-testid="issue-category-error" className="text-error text-body-md mt-1">
                    {validationError}
                  </p>
                )}
                {apiError && (
                  <p data-testid="api-error" className="text-error text-body-md mt-2">
                    {apiError}
                  </p>
                )}
              </div>

              {/* Dispute Notes */}
              <div>
                <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Dispute Notes <span className="text-on-surface-variant opacity-60">(Optional)</span>
                </label>
                <textarea
                  data-testid="description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe the investigation details or customer statement..."
                  className="w-full border border-outline-variant text-on-surface text-body-md px-4 py-2.5 rounded focus:ring-0 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  data-testid="back-button"
                  onClick={onBack}
                  className="flex items-center gap-2 text-secondary text-label-md px-4 py-2 hover:bg-surface-container transition-colors rounded"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Back to Transactions
                </button>
                <button
                  type="submit"
                  data-testid="submit-dispute-button"
                  disabled={loading}
                  className="bg-primary text-on-primary font-bold px-8 py-3 rounded hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && (
                    <span data-testid="loading-indicator">
                      <svg
                        className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                  Run Triage Engine
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Transaction Summary & Context */}
        <div className="lg:col-span-4 space-y-6">
          {/* Transaction Summary Card */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg border-l-4 border-l-primary">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-md text-primary">Selected Transaction</h2>
              <span className="material-symbols-outlined text-primary">receipt_long</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-outline-variant">
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase">Description</p>
                  <p className="text-body-lg font-bold text-on-surface">{transaction.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase">Date</p>
                  <p className="text-data-tabular text-on-surface">{formatDate(transaction.transactionDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-label-md text-on-surface-variant uppercase">Amount</p>
                  <p className="text-data-tabular text-on-surface font-bold text-lg">{formatAmount(transaction.amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-outline-variant">
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase">Customer</p>
                  <p className="text-data-tabular text-on-surface">{customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-label-md text-on-surface-variant uppercase">Status</p>
                  <p className="text-data-tabular text-on-surface">{transaction.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pre-Triage Context */}
          <div className="bg-secondary-container p-5 rounded-lg border border-secondary text-on-secondary-container">
            <div className="flex gap-3">
              <span className="material-symbols-outlined">info</span>
              <div>
                <p className="text-label-md font-bold mb-1">Pre-Triage Context</p>
                <p className="text-body-md leading-relaxed">
                  Ensure the category matches the customer&apos;s specific claim before running the triage engine.
                </p>
              </div>
            </div>
          </div>

          {/* Investigator Guidelines */}
          <div className="bg-surface-container-highest p-6 rounded-lg">
            <h3 className="text-label-md text-on-surface-variant uppercase mb-4">Investigator Guidelines</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                <span className="text-body-md">Ensure the category matches the customer&apos;s specific claim.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                <span className="text-body-md">Document any police report numbers if &quot;Unauthorised&quot; is selected.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                <span className="text-body-md">The Triage Engine will process the dispute automatically.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
