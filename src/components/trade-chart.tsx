"use client";

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip, Legend, TimeScale } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, Tooltip, Legend, TimeScale, CandlestickController, CandlestickElement);

const TradeChart = ({ data }: { data: any[] }) => {

  const chartData = {
    datasets: [{
      label: 'Price',
      data: data,
      borderColor: 'rgba(0,0,0,0)',
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        bodyFont: {
          family: 'Inter, sans-serif'
        },
        titleFont: {
          family: 'Inter, sans-serif'
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute' as const,
          tooltipFormat: 'PPpp',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        adapters: {
          date: {
            locale: enUS
          }
        },
        grid: {
          color: 'hsla(var(--border), 0.5)',
          borderColor: 'hsla(var(--border), 0.5)'
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
          font: {
            family: 'Inter, sans-serif'
          }
        }
      },
      y: {
        grid: {
          color: 'hsla(var(--border), 0.5)',
          borderColor: 'hsla(var(--border), 0.5)'
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          callback: function(value: any) {
            return 'R$ ' + value.toFixed(2);
          },
          font: {
            family: 'Inter, sans-serif'
          }
        },
        position: 'right' as const
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
    },
    color: {
      up: 'hsl(var(--primary))',
      down: 'hsl(var(--destructive))',
      unchanged: '#999',
    }
  };

  return <Chart type='candlestick' data={chartData} options={options as any} />;
};

export default TradeChart;
