import { useDisputeDetail } from '../hooks/useApi';
import { PriorityBadge } from './PriorityBadge';
import { AgeBadge } from './AgeBadge';
import type { RecommendationCode } from '../types';

interface TriageResultScreenProps {
  disputeId: string;
  onNewDispute: () => void;
}

type BannerStyle = {
  bg: string;
  border: string;
  headingText: string;
  bodyText: string;
  iconBg: string;
};

function getBannerStyle(code: RecommendationCode): BannerStyle {
  switch (code) {
    case 'ESCALATE_FRAUD':
    case 'ESCALATE_SENIOR':
      return {
        bg: 'bg-red-50',
        border: 'border-l-8 border-red-600',
        headingText: 'text-red-900',
        bodyText: 'text-red-700',
        iconBg: 'bg-red-600',
      };
    case 'MONITOR_24H':
    case 'INVESTIGATE':
    case 'REFER_PAYMENTS':
      return {
        bg: 'bg-amber-50',
        border: 'border-l-8 border-amber-600',
        headingText: 'text-amber-900',
        bodyText: 'text-amber-700',
        iconBg: 'bg-amber-600',
      };
    case 'IMMEDIATE_REVERSAL':
    case 'CLOSE_RESOLVED':
      return {
        bg: 'bg-emerald-50',
        border: 'border-l-8 border-emerald-600',
        headingText: 'text-emerald-900',
        bodyText: 'text-emerald-700',
        iconBg: 'bg-emerald-600',
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-l-8 border-gray-600',
        headingText: 'text-gray-900',
        bodyText: 'text-gray-700',
        iconBg: 'bg-gray-600',
      };
  }
}

function getBannerIcon(code: RecommendationCode): string {
  switch (code) {
    case 'ESCALATE_FRAUD':
    case 'ESCALATE_SENIOR':
      return 'warning';
    case 'MONITOR_24H':
      return 'schedule';
    case 'INVESTIGATE':
    case 'REFER_PAYMENTS':
      return 'search';
    case 'IMMEDIATE_REVERSAL':
    case 'CLOSE_RESOLVED':
      return 'verified';
    default:
      return 'info';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatIssueCategory(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function TriageResultScreen({ disputeId, onNewDispute }: TriageResultScreenProps) {
  const { data: dispute, loading, error } = useDisputeDetail(disputeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-body-md text-on-surface-variant">Loading triage result...</p>
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
          <p className="text-error font-medium text-body-lg">
            {error || 'Failed to load dispute details'}
          </p>
          <button
            onClick={onNewDispute}
            className="mt-4 bg-primary text-on-primary rounded-lg font-bold px-6 py-3 text-body-md"
          >
            Log New Dispute
          </button>
        </div>
      </div>
    );
  }

  const bannerStyle = getBannerStyle(dispute.recommendationCode);
  const bannerIcon = getBannerIcon(dispute.recommendationCode);

  return (
    <section className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full">
      {/* Status Badges Row */}
      <div className="flex gap-4 flex-wrap">
        <PriorityBadge priority={dispute.priority} />
        <AgeBadge ageIndicator={dispute.ageIndicator} />
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded text-label-md font-bold bg-surface-container-high text-on-surface-variant uppercase">
          <span className="material-symbols-outlined text-[16px]">fingerprint</span>
          {dispute.referenceNumber}
        </span>
      </div>

      {/* Recommendation Banner */}
      <div
        data-testid="recommendation-display"
        className={`${bannerStyle.bg} ${bannerStyle.border} p-8 rounded-lg flex items-center justify-between shadow-sm`}
      >
        <div className="flex items-center gap-6">
          <div className={`${bannerStyle.iconBg} text-white p-4 rounded-full flex-shrink-0`}>
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{bannerIcon}</span>
          </div>
          <div>
            <h2 className={`text-headline-lg font-black uppercase tracking-tight ${bannerStyle.headingText}`}>
              Recommended Action: {dispute.recommendation}
            </h2>
            <p className={`text-body-lg mt-1 ${bannerStyle.bodyText}`}>
              Institutional risk assessment complete. Code: {dispute.recommendationCode}
            </p>
          </div>
        </div>
      </div>

      {/* Rules Transparency & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Rules Transparency */}
        <div className="lg:col-span-1 bg-white border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant">
            <h3 className="text-headline-md uppercase text-primary">Rules Transparency</h3>
          </div>
          <div className="p-6 flex flex-col gap-6">
            {/* Triggered Rules */}
            <div data-testid="rules-list" className="flex flex-col gap-4">
              {dispute.rulesTriggered.map((rule) => (
                <div
                  key={rule.ruleId}
                  className="flex items-start gap-3 p-4 bg-surface-container-low rounded border border-outline-variant/50"
                >
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <div>
                    <p className="font-bold text-on-surface text-sm">Rule: {rule.ruleName}</p>
                    <ul className="mt-1 text-xs text-on-surface-variant">
                      {Object.entries(rule.conditions).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Matching Factors */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-outline-variant pb-2">
                Decision Factors
              </h4>
              <div className="flex justify-between items-center py-1">
                <span className="text-on-surface-variant text-sm">Payment Method</span>
                <span className="font-bold text-sm text-primary">{dispute.paymentType}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-on-surface-variant text-sm">Issue Category</span>
                <span className="font-bold text-sm text-primary">{formatIssueCategory(dispute.issueCategory)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-on-surface-variant text-sm">Transaction Status</span>
                <span className="font-bold text-sm text-primary">{dispute.transaction.status}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-on-surface-variant text-sm">Amount</span>
                <span className="font-bold text-sm text-primary">{formatCurrency(dispute.transaction.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
          {/* Transaction Card */}
          <div className="bg-white border border-outline-variant rounded-lg shadow-sm flex flex-col">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-headline-md uppercase text-primary">Transaction Details</h3>
              <span className="material-symbols-outlined text-primary/40">receipt_long</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Amount</label>
                <span className="text-3xl font-black text-primary">{formatCurrency(dispute.transaction.amount)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Date</label>
                  <span className="text-sm font-semibold text-primary">{formatDate(dispute.transaction.transactionDate)}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Status</label>
                  <span className="text-sm font-semibold text-primary">{dispute.transaction.status}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Description</label>
                  <span className="text-sm font-semibold text-primary">{dispute.transaction.description}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Payment Type</label>
                  <span className="text-sm font-semibold text-primary">{dispute.paymentType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dispute / Customer Card */}
          <div className="bg-white border border-outline-variant rounded-lg shadow-sm flex flex-col">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-headline-md uppercase text-primary">Dispute Summary</h3>
              <span className="material-symbols-outlined text-primary/40">description</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Reference</label>
                <span className="text-headline-md font-bold text-primary">{dispute.referenceNumber}</span>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Customer</label>
                  <span className="text-sm font-semibold text-primary">{dispute.customer.name}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Account</label>
                  <span className="text-sm font-semibold text-primary">{dispute.customer.accountNumber}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Issue Category</label>
                  <span className="text-sm font-semibold text-primary">{formatIssueCategory(dispute.issueCategory)}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Created</label>
                  <span className="text-sm font-semibold text-primary">{formatDate(dispute.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-8 bg-surface-container-lowest border border-outline-variant rounded-lg flex items-center justify-between shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Next Recommended Step</span>
          <span className="text-sm font-medium text-on-surface">
            Return to start to handle the next case in the queue.
          </span>
        </div>
        <button
          data-testid="new-dispute-button"
          onClick={onNewDispute}
          className="bg-secondary text-white font-bold px-8 py-3 rounded-lg text-body-md hover:bg-primary transition-colors flex items-center gap-2 shadow-md"
        >
          <span className="material-symbols-outlined">restart_alt</span>
          Log New Dispute
        </button>
      </div>
    </section>
  );
}
