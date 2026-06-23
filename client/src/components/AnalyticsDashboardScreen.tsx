import { useEffect, useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { SummaryCard } from './SummaryCard';
import { ChartCard } from './ChartCard';
import { BarChartWidget } from './analytics/BarChartWidget';
import { DoughnutChartWidget } from './analytics/DoughnutChartWidget';

// Chart colour assignments from design system
const PAYMENT_TYPE_COLORS = ['#001A48', '#3A608F', '#5176A6'];
const STATUS_COLORS = ['#D97706', '#3A608F', '#059669']; // Open=Amber, Triaged=Secondary, Closed=Emerald
const ISSUE_CATEGORY_COLORS = ['#3A608F']; // All bars use secondary
const PRIORITY_COLORS = ['#DC2626', '#D97706', '#059669']; // High=Crimson, Medium=Amber, Low=Emerald

export function AnalyticsDashboardScreen() {
  const { data, loading, error, retry } = useAnalytics();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div data-testid="analytics-loading">
        <h2 className="text-headline-md font-semibold text-on-surface mb-6">Dispute Analytics</h2>
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-3 w-16 bg-surface-container-high rounded" />
                  <div className="h-5 w-10 bg-surface-container-high rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Chart cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 animate-pulse">
              <div className="h-4 w-40 bg-surface-container-high rounded mb-4" />
              <div className="h-48 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div data-testid="analytics-error">
        <h2 className="text-headline-md font-semibold text-on-surface mb-6">Dispute Analytics</h2>
        <div className="bg-error-container rounded-lg border border-outline-variant p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4 block">error</span>
          <p className="text-body-lg text-on-surface mb-4">
            Analytics data could not be retrieved.
          </p>
          <button
            onClick={retry}
            className="px-6 py-2 bg-primary text-on-primary rounded font-bold text-label-md hover:bg-primary/90 transition-colors"
            data-testid="analytics-retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Data state
  if (!data) return null;

  // Expand issue category colors to match data length
  const issueCategoryColors = data.issueCategory.map(() => ISSUE_CATEGORY_COLORS[0]);

  return (
    <div data-testid="analytics-dashboard">
      <h2 className="text-headline-md font-semibold text-on-surface mb-6">Dispute Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total Disputes"
          value={data.summary.totalDisputes}
          icon="analytics"
          variant="default"
        />
        <SummaryCard
          label="Open Disputes"
          value={data.summary.openDisputes}
          icon="pending_actions"
          variant="warning"
        />
        <SummaryCard
          label="Resolved Disputes"
          value={data.summary.resolvedDisputes}
          icon="check_circle"
          variant="success"
        />
        <SummaryCard
          label="High Priority"
          value={data.summary.highPriorityDisputes}
          icon="priority_high"
          variant="danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Disputes by Payment Type">
          <BarChartWidget
            data={data.paymentType}
            colors={PAYMENT_TYPE_COLORS}
            reducedMotion={reducedMotion}
          />
        </ChartCard>

        <ChartCard title="Disputes by Issue Category">
          <BarChartWidget
            data={data.issueCategory}
            colors={issueCategoryColors}
            reducedMotion={reducedMotion}
          />
        </ChartCard>

        <ChartCard title="Disputes by Status">
          <DoughnutChartWidget
            data={data.status}
            colors={STATUS_COLORS}
            reducedMotion={reducedMotion}
          />
        </ChartCard>

        <ChartCard title="Disputes by Priority">
          <DoughnutChartWidget
            data={data.priority}
            colors={PRIORITY_COLORS}
            reducedMotion={reducedMotion}
          />
        </ChartCard>
      </div>
    </div>
  );
}
