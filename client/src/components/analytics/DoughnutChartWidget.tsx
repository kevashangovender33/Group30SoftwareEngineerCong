import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { AnalyticsBreakdown } from '../../types/index';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartWidgetProps {
  data: AnalyticsBreakdown[];
  colors?: string[];
  reducedMotion?: boolean;
}

const DEFAULT_COLORS = [
  '#DC2626', // crimson
  '#D97706', // amber
  '#059669', // emerald
];

export function DoughnutChartWidget({ data, colors, reducedMotion = false }: DoughnutChartWidgetProps) {
  const segmentColors = colors || DEFAULT_COLORS.slice(0, data.length);

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: segmentColors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: reducedMotion ? 0 : 800,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Inter', size: 12 },
          color: '#444651',
        },
      },
      tooltip: {
        backgroundColor: '#121C28',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 8,
        cornerRadius: 4,
      },
    },
    cutout: '55%',
  };

  return (
    <div data-testid="doughnut-chart-widget">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
