"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const TradeChart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>([]);
  const animationFrameId = useRef<number>();
  const lastUpdateTime = useRef<number>(0);
  const isMobile = useIsMobile();

  const initializeData = useCallback((length: number) => {
    let currentPrice = 100;
    const data = [];
    for (let i = 0; i < length; i++) {
        currentPrice += (Math.random() - 0.5) * 2;
        data.push(currentPrice);
    }
    dataRef.current = data;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const data = dataRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.length < 2) return;
    
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const padding = 30;
    const chartWidth = canvas.width;
    const chartHeight = canvas.height - padding * 2;
    const stepX = chartWidth / (data.length - 1);
    
    const getY = (value: number) => canvas.height - padding - ((value - minVal) / range) * chartHeight;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const gridLines = 5;
    for(let i = 0; i <= gridLines; i++) {
        const y = padding + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        const value = maxVal - (range / gridLines) * i;
        if(i < gridLines) {
           ctx.fillText(value.toFixed(2), chartWidth - 50, y + 12);
        }
    }

    // Draw path
    ctx.beginPath();
    ctx.moveTo(0, getY(data[0]));
    for (let i = 1; i < data.length; i++) {
        ctx.lineTo(i * stepX, getY(data[i]));
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4A90E2'; // A neutral blue
    ctx.shadowColor = 'rgba(74, 144, 226, 0.5)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    // Draw last segment with color
    const lastPoint = data[data.length - 1];
    const secondLastPoint = data[data.length - 2];
    const lastY = getY(lastPoint);
    const lastX = (data.length - 1) * stepX;
    
    ctx.beginPath();
    ctx.moveTo((data.length - 2) * stepX, getY(secondLastPoint));
    ctx.lineTo(lastX, lastY);
    ctx.strokeStyle = lastPoint >= secondLastPoint ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
    ctx.stroke();

    // Draw glowing circle at the end
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowColor = 'transparent';

  }, []);

  const renderLoop = useCallback((timestamp: number) => {
    if (timestamp - lastUpdateTime.current > 2000) {
        lastUpdateTime.current = timestamp;

        const newData = [...dataRef.current];
        const lastPrice = newData[newData.length - 1] || 100;
        const newPrice = lastPrice + (Math.random() - 0.5) * 2;
        newData.push(newPrice);
        if (newData.length > 50) {
            newData.shift();
        }
        dataRef.current = newData;

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            draw(ctx, canvas);
          }
        }
    }
    animationFrameId.current = requestAnimationFrame(renderLoop);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // This function will be called to set up and redraw the canvas
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      draw(ctx, canvas);
    };
    
    initializeData(isMobile ? 20 : 50);
    setupCanvas();

    lastUpdateTime.current = performance.now();
    animationFrameId.current = requestAnimationFrame(renderLoop);

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });

    resizeObserver.observe(canvas);

    return () => {
      if(animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
    };
  }, [initializeData, draw, renderLoop, isMobile]);


  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default TradeChart;
