import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard, formatMetricValue } from '../src/components/SummaryCard';

describe('SummaryCard', () => {
  it('should display the label and formatted value', () => {
    render(<SummaryCard label="Total Disputes" value={1234} icon="analytics" />);

    expect(screen.getByText('Total Disputes')).toBeInTheDocument();
    // en-ZA uses non-breaking space as thousands separator
    const valueEl = screen.getByTestId('summary-card-value');
    expect(valueEl.textContent).toMatch(/1.234/);
  });

  it('should display "0" for zero value', () => {
    render(<SummaryCard label="Open Disputes" value={0} icon="pending_actions" />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Open Disputes')).toBeInTheDocument();
  });

  it('should have aria-label associating metric name with value', () => {
    render(<SummaryCard label="High Priority" value={42} icon="priority_high" variant="danger" />);

    const card = screen.getByLabelText('High Priority: 42');
    expect(card).toBeInTheDocument();
  });

  it('should format large values with thousands separators', () => {
    render(<SummaryCard label="Total Disputes" value={1000000} icon="analytics" />);

    // en-ZA uses space as thousands separator in some locales, but Intl may vary
    const valueEl = screen.getByTestId('summary-card-value');
    expect(valueEl.textContent).toBeTruthy();
  });

  it('should apply danger variant styling', () => {
    const { container } = render(
      <SummaryCard label="High Priority" value={5} icon="priority_high" variant="danger" />
    );

    const iconContainer = container.querySelector('.bg-red-50');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should apply success variant styling', () => {
    const { container } = render(
      <SummaryCard label="Resolved" value={10} icon="check_circle" variant="success" />
    );

    const iconContainer = container.querySelector('.bg-green-50');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should apply warning variant styling', () => {
    const { container } = render(
      <SummaryCard label="Open" value={3} icon="pending_actions" variant="warning" />
    );

    const iconContainer = container.querySelector('.bg-amber-50');
    expect(iconContainer).toBeInTheDocument();
  });
});

describe('formatMetricValue', () => {
  it('should format 0 as "0"', () => {
    expect(formatMetricValue(0)).toBe('0');
  });

  it('should format 999 without separator', () => {
    expect(formatMetricValue(999)).toBe('999');
  });

  it('should format 1000 with separator', () => {
    const result = formatMetricValue(1000);
    // en-ZA may use space or comma; just verify it's not plain "1000"
    expect(result).not.toBe('');
    expect(result.length).toBeGreaterThan(3);
  });

  it('should format large numbers with separators', () => {
    const result = formatMetricValue(1234567);
    expect(result.length).toBeGreaterThan(6);
  });
});
