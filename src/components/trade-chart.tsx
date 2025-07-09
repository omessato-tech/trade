
"use client";

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip, Legend, TimeScale } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, Tooltip, Legend, TimeScale, CandlestickController, CandlestickElement, annotationPlugin);

interface EntryLine {
  price: number;
  type: 'buy' | 'sell';
  state: 'profit' | 'loss' | null;
}

interface TradeChartProps {
  data: any[];
  visibleRange?: number;
  entryLines: EntryLine[];
  currentPrice: number | null;
}

const TradeChart = React.forwardRef<ChartJS<'candlestick', any[], any>, TradeChartProps>(({ 
  data, 
  visibleRange, 
  entryLines,
  currentPrice
}, ref) => {

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
  
  const chartAnnotations: any = {};
  
  if (entryLines && entryLines.length > 0) {
    entryLines.forEach((line, index) => {
      let borderColor = '#FF8C00'; // Orange for neutral
      if (line.state === 'profit') borderColor = 'hsl(var(--primary))';
      if (line.state === 'loss') borderColor = 'hsl(var(--destructive))';

      chartAnnotations[`entryLine${index}`] = {
        type: 'line' as const,
        yMin: line.price,
        yMax: line.price,
        borderColor: borderColor,
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: `Entrada: ${line.price.toFixed(5)}`,
          display: true,
          position: index % 2 === 0 ? 'start' : 'end',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          font: {
            family: 'Inter, sans-serif'
          }
        }
      };
    });
  }

  if (currentPrice) {
    chartAnnotations.currentPriceLine = {
      type: 'line' as const,
      yMin: currentPrice,
      yMax: currentPrice,
      borderColor: 'rgba(255, 255, 255, 0.7)',
      borderWidth: 1.5,
      label: {
        content: currentPrice.toFixed(5),
        display: true,
        position: 'end',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: 'hsl(var(--background))',
        font: {
          family: 'Inter, sans-serif',
          size: 10
        },
        padding: 4,
        yAdjust: -12
      }
    };
  }


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
        annotations: chartAnnotations,
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
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
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
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
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

  return <Chart type='candlestick' ref={ref} data={chartData} options={options as any} />;
});

TradeChart.displayName = "TradeChart";

export default TradeChart;
