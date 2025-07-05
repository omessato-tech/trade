"use client";

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip, Legend, TimeScale } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, Tooltip, Legend, TimeScale, CandlestickController, CandlestickElement, annotationPlugin);

const TradeChart = ({ data, visibleRange, entryLine, profitState }: { 
  data: any[], 
  visibleRange?: number, 
  entryLine: { price: number, type: 'buy' | 'sell' } | null,
  profitState: 'profit' | 'loss' | null
}) => {

  const chartData = {
    datasets: [{
      label: 'Price',
      data: data,
      borderColor: 'rgba(0,0,0,0)',
    }]
  };
  
  const lastIndex = data.length - 1;
  const startIndex = Math.max(0, lastIndex - (visibleRange ? visibleRange - 1 : data.length - 1));
  const minTime = data.length > 0 ? data[startIndex].x : undefined;
  const maxTime = data.length > 0 ? data[lastIndex].x : undefined;

  const getLineColor = () => {
    if (!entryLine) return 'transparent';
    if (profitState === 'profit') return 'hsl(var(--primary))';
    if (profitState === 'loss') return 'hsl(var(--destructive))';
    // Fallback for initial render
    return entryLine.type === 'buy' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
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
      },
      annotation: {
        annotations: entryLine ? {
          entryLine: {
            type: 'line' as const,
            yMin: entryLine.price,
            yMax: entryLine.price,
            borderColor: getLineColor(),
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              content: entryLine.price.toFixed(5),
              display: true,
              position: 'end',
              backgroundColor: 'rgba(0,0,0,0.6)',
              font: {
                family: 'Inter, sans-serif'
              }
            }
          }
        } : {}
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
        },
        min: minTime,
        max: maxTime,
      },
      y: {
        grid: {
          color: 'hsla(var(--border), 0.5)',
          borderColor: 'hsla(var(--border), 0.5)'
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          callback: function(value: any) {
            return value.toFixed(4);
          },
          font: {
            family: 'Inter, sans-serif'
          }
        },
        position: 'right' as const
      }
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
