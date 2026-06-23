import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoughnutChartWidget } from '../src/components/analytics/DoughnutChartWidget';

// Mock react-chartjs-2 to avoid canvas rendering issues in jsdom
vi.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, options }: any) => (
    <div data-testid="mock-doughnut-chart" data-labels={JSON.stringify(data.labels)} data-animation-duration={options.animation.duration}>
      <canvas />
    </div>
  ),
}));

describe('DoughnutChartWidget', () => {
  const mockData = [
    { label: 'Open', count: 4 },
    { label: 'Triaged', count: 3 },
    { label: 'Closed', count: 3 },
  ];

  it('should render a canvas element', () => {
    render(<DoughnutChartWidget data={mockData} />);

    const chart = screen.getByTestId('doughnut-chart-widget');
    expect(chart.querySelector('canvas')).toBeInTheDocument();
  });

  it('should pass correct data labels to Chart.js', () => {
    render(<DoughnutChartWidget data={mockData} />);

    const chart = screen.getByTestId('mock-doughnut-chart');
    const labels = JSON.parse(chart.getAttribute('data-labels')!);
    expect(labels).toEqual(['Open', 'Triaged', 'Closed']);
  });

  it('should set animation duration to 0 when reducedMotion is true', () => {
    render(<DoughnutChartWidget data={mockData} reducedMotion={true} />);

    const chart = screen.getByTestId('mock-doughnut-chart');
    expect(chart.getAttribute('data-animation-duration')).toBe('0');
  });

  it('should set animation duration to 800 by default', () => {
    render(<DoughnutChartWidget data={mockData} />);

    const chart = screen.getByTestId('mock-doughnut-chart');
    expect(chart.getAttribute('data-animation-duration')).toBe('800');
  });

  it('should accept custom colors', () => {
    render(<DoughnutChartWidget data={mockData} colors={['#FF0000', '#00FF00', '#0000FF']} />);

    expect(screen.getByTestId('doughnut-chart-widget')).toBeInTheDocument();
  });
});
