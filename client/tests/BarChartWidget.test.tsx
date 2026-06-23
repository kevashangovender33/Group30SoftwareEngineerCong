import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChartWidget } from '../src/components/analytics/BarChartWidget';

// Mock react-chartjs-2 to avoid canvas rendering issues in jsdom
vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="mock-bar-chart" data-labels={JSON.stringify(data.labels)} data-animation-duration={options.animation.duration}>
      <canvas />
    </div>
  ),
}));

describe('BarChartWidget', () => {
  const mockData = [
    { label: 'Card', count: 5 },
    { label: 'EFT', count: 3 },
    { label: 'Internal Transfer', count: 2 },
  ];

  it('should render a canvas element', () => {
    render(<BarChartWidget data={mockData} />);

    const chart = screen.getByTestId('bar-chart-widget');
    expect(chart.querySelector('canvas')).toBeInTheDocument();
  });

  it('should pass correct data labels to Chart.js', () => {
    render(<BarChartWidget data={mockData} />);

    const chart = screen.getByTestId('mock-bar-chart');
    const labels = JSON.parse(chart.getAttribute('data-labels')!);
    expect(labels).toEqual(['Card', 'EFT', 'Internal Transfer']);
  });

  it('should set animation duration to 0 when reducedMotion is true', () => {
    render(<BarChartWidget data={mockData} reducedMotion={true} />);

    const chart = screen.getByTestId('mock-bar-chart');
    expect(chart.getAttribute('data-animation-duration')).toBe('0');
  });

  it('should set animation duration to 800 by default', () => {
    render(<BarChartWidget data={mockData} />);

    const chart = screen.getByTestId('mock-bar-chart');
    expect(chart.getAttribute('data-animation-duration')).toBe('800');
  });

  it('should accept custom colors', () => {
    render(<BarChartWidget data={mockData} colors={['#FF0000', '#00FF00', '#0000FF']} />);

    expect(screen.getByTestId('bar-chart-widget')).toBeInTheDocument();
  });
});
