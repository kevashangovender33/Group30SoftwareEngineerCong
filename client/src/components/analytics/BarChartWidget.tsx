import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { AnalyticsBreakdown } from '../../types/index';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartWidgetProps {
  data: AnalyticsBreakdown[];
  colors?: string[];
  reducedMotion?: boolean;
}

const DEFAULT_COLORS = [
  '#001A48', // primary
  '#3A608F', // secondary
  '#5176A6', // slate blue
  '#059669', // emerald
  '#D97706', // amber
  '#DC2626', // crimson
];

export function BarChartWidget({ data, colors, reducedMotion = false }: BarChartWidgetProps) {
  const barColors = colors || DEFAULT_COLORS.slice(0, data.length);

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: barColors,
        borderRadius: 4,
        maxBarThickness: 60,
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
        display: false,
      },
      tooltip: {
        backgroundColor: '#121C28',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 8,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Inter', size: 12 },
          color: '#444651',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: { family: 'Inter', size: 12 },
          color: '#444651',
        },
        grid: {
          color: '#E5E7EB',
        },
      },
    },
  };

  return (
    <div data-testid="bar-chart-widget">
      <Bar data={chartData} options={options} />
    </div>
  );
}
