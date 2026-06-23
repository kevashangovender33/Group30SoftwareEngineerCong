import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboardScreen } from '../src/components/AnalyticsDashboardScreen';

// Mock the useAnalytics hook
vi.mock('../src/hooks/useAnalytics', () => ({
  useAnalytics: vi.fn(),
}));

// Mock chart components to avoid canvas issues
vi.mock('../src/components/analytics/BarChartWidget', () => ({
  BarChartWidget: ({ data }: any) => (
    <div data-testid="mock-bar-chart" data-count={data.length}>
      <canvas />
    </div>
  ),
}));

vi.mock('../src/components/analytics/DoughnutChartWidget', () => ({
  DoughnutChartWidget: ({ data }: any) => (
    <div data-testid="mock-doughnut-chart" data-count={data.length}>
      <canvas />
    </div>
  ),
}));

import { useAnalytics } from '../src/hooks/useAnalytics';

const mockUseAnalytics = vi.mocked(useAnalytics);

const mockAnalyticsData = {
  paymentType: [
    { label: 'Card', count: 5 },
    { label: 'EFT', count: 3 },
    { label: 'Internal Transfer', count: 2 },
  ],
  issueCategory: [
    { label: 'Duplicate Debit', count: 4 },
    { label: 'Failed Transfer', count: 3 },
  ],
  status: [
    { label: 'Open', count: 4 },
    { label: 'Triaged', count: 3 },
    { label: 'Closed', count: 3 },
  ],
  priority: [
    { label: 'High', count: 3 },
    { label: 'Medium', count: 4 },
    { label: 'Low', count: 3 },
  ],
  summary: {
    totalDisputes: 10,
    openDisputes: 4,
    resolvedDisputes: 3,
    highPriorityDisputes: 3,
  },
};

describe('AnalyticsDashboardScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock matchMedia for prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('should display loading state with skeleton', () => {
    mockUseAnalytics.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      retry: vi.fn(),
    });

    render(<AnalyticsDashboardScreen />);

    expect(screen.getByTestId('analytics-loading')).toBeInTheDocument();
    expect(screen.getByText('Dispute Analytics')).toBeInTheDocument();
  });

  it('should display error state with retry button', () => {
    mockUseAnalytics.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to fetch',
      retry: vi.fn(),
    });

    render(<AnalyticsDashboardScreen />);

    expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
    expect(screen.getByText('Analytics data could not be retrieved.')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-retry-button')).toBeInTheDocument();
  });

  it('should call retry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    mockUseAnalytics.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed',
      retry: mockRetry,
    });

    render(<AnalyticsDashboardScreen />);

    fireEvent.click(screen.getByTestId('analytics-retry-button'));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('should render all 4 chart cards with correct titles', () => {
    mockUseAnalytics.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<AnalyticsDashboardScreen />);

    expect(screen.getByText('Disputes by Payment Type')).toBeInTheDocument();
    expect(screen.getByText('Disputes by Issue Category')).toBeInTheDocument();
    expect(screen.getByText('Disputes by Status')).toBeInTheDocument();
    expect(screen.getByText('Disputes by Priority')).toBeInTheDocument();
  });

  it('should render all 4 summary cards with correct labels', () => {
    mockUseAnalytics.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<AnalyticsDashboardScreen />);

    expect(screen.getByText('Total Disputes')).toBeInTheDocument();
    expect(screen.getByText('Open Disputes')).toBeInTheDocument();
    expect(screen.getByText('Resolved Disputes')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('should render the page heading "Dispute Analytics"', () => {
    mockUseAnalytics.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<AnalyticsDashboardScreen />);

    expect(screen.getByText('Dispute Analytics')).toBeInTheDocument();
  });

  it('should render charts in fixed order: Payment Type, Issue Category, Status, Priority', () => {
    mockUseAnalytics.mockReturnValue({
      data: mockAnalyticsData,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<AnalyticsDashboardScreen />);

    const chartCards = screen.getAllByTestId(/^chart-card-/);
    expect(chartCards[0]).toHaveAttribute('data-testid', 'chart-card-disputes-by-payment-type');
    expect(chartCards[1]).toHaveAttribute('data-testid', 'chart-card-disputes-by-issue-category');
    expect(chartCards[2]).toHaveAttribute('data-testid', 'chart-card-disputes-by-status');
    expect(chartCards[3]).toHaveAttribute('data-testid', 'chart-card-disputes-by-priority');
  });
});
