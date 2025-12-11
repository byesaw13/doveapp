'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  title?: string;
  colors?: string[];
}

export function DoughnutChart({
  labels,
  data: chartData,
  title,
  colors,
}: DoughnutChartProps) {
  const defaultColors = [
    'rgba(16, 185, 129, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(234, 179, 8, 0.8)',
  ];

  const borderColors = [
    'rgb(16, 185, 129)',
    'rgb(59, 130, 246)',
    'rgb(168, 85, 247)',
    'rgb(251, 146, 60)',
    'rgb(239, 68, 68)',
    'rgb(234, 179, 8)',
  ];

  const data = {
    labels,
    datasets: [
      {
        data: chartData,
        backgroundColor: colors || defaultColors,
        borderColor: colors
          ? colors.map((c) => c.replace('0.8', '1'))
          : borderColors,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
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
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);

            let formattedValue;
            if (value > 1000) {
              formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(value);
            } else {
              formattedValue = value.toFixed(0);
            }

            return `${label}: ${formattedValue} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
