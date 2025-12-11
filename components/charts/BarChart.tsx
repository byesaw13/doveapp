'use client';

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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
  title?: string;
  yAxisLabel?: string;
  horizontal?: boolean;
}

export function BarChart({
  labels,
  datasets,
  title,
  yAxisLabel,
  horizontal = false,
}: BarChartProps) {
  const data = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor:
        dataset.backgroundColor ||
        [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ][index % 5],
      borderColor:
        dataset.borderColor ||
        [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)',
        ][index % 5],
      borderWidth: 1,
      borderRadius: 6,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null || context.parsed.x !== null) {
              const value = horizontal ? context.parsed.x : context.parsed.y;
              // Format as currency if value is large
              if (value > 1000) {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(value);
              } else {
                label += value.toFixed(1);
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: !!yAxisLabel && !horizontal,
          text: yAxisLabel,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          callback: function (value: any) {
            if (!horizontal && value >= 1000) {
              return '$' + (value / 1000).toFixed(0) + 'K';
            }
            return value;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        beginAtZero: horizontal,
        title: {
          display: !!yAxisLabel && horizontal,
          text: yAxisLabel,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          callback: function (value: any) {
            if (horizontal && value >= 1000) {
              return '$' + (value / 1000).toFixed(0) + 'K';
            }
            return value;
          },
          font: {
            size: 11,
          },
        },
        grid: {
          display: horizontal,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
