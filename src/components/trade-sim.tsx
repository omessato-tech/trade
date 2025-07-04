"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ZoomIn, ZoomOut } from 'lucide-react';

const timeframes = ['1s', '5s', '30s', '1m', '5m', '15m', '1H', '4H', '1D'];
const timeframeDurations: { [key: string]: number } = {
  '1s': 1000,
  '5s': 5000,
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '1H': 3600000,
  '4H': 14400000,
  '1D': 86400000,
};

const generateRandomCandle = (lastCandle: any) => {
    const now = new Date();
    // Prices for USD/EUR
    const open = lastCandle ? lastCandle.c : 1.0850 + (Math.random() - 0.5) * 0.001;
    const close = open + (Math.random() - 0.5) * 0.0015;
    const high = Math.max(open, close) + Math.random() * 0.0005;
    const low = Math.min(open, close) - Math.random() * 0.0005;
    return { x: now.getTime(), o: open, h: high, l: low, c: close };
};

export default function TradeSim() {
  const [balance, setBalance] = useState(1000);
  const [isTrading, setIsTrading] = useState(false);
  const [notification, setNotification] = useState<string | null>('Aguardando sua operação...');
  const [lastResult, setLastResult] = useState<'gain' | 'loss' | null>(null);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [marketData, setMarketData] = useState({ high: 0, low: Infinity, volume: 0 });
  const [activeTimeframe, setActiveTimeframe] = useState('1m');
  const [zoomLevel, setZoomLevel] = useState(50);

  const gainSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);

  // Setup balance and sounds on mount
  useEffect(() => {
    const savedBalance = sessionStorage.getItem('tradeSimBalance');
    setBalance(savedBalance ? parseFloat(savedBalance) : 1000);

    gainSoundRef.current = new Audio('/sounds/gain.mp3');
    lossSoundRef.current = new Audio('/sounds/loss.mp3');
    gainSoundRef.current.volume = 0.3;
    lossSoundRef.current.volume = 0.3;
  }, []);

  // Regenerate chart history when timeframe changes
  useEffect(() => {
    let initialData: any[] = [];
    let lastCandle: any = null;
    const duration = timeframeDurations[activeTimeframe];
    for(let i=0; i < 200; i++) { // Generate initial data for zoom
        const candle = generateRandomCandle(lastCandle);
        candle.x = new Date().getTime() - (200-i) * duration;
        initialData.push(candle);
        lastCandle = candle;
    }
    setChartData(initialData);

    if (initialData.length > 0) {
        setMarketData(prevMarketData => ({
            high: Math.max(...initialData.map(d => d.h)),
            low: Math.min(...initialData.map(d => d.l)),
            volume: prevMarketData.volume || 327229.98
        }));
    }
  }, [activeTimeframe]);

  useEffect(() => {
    sessionStorage.setItem('tradeSimBalance', balance.toString());
    if (lastResult) {
        const timer = setTimeout(() => setLastResult(null), 1000);
        return () => clearTimeout(timer);
    }
  }, [balance, lastResult]);

  const updateData = useCallback(() => {
    setChartData(prevData => {
        if (prevData.length === 0) return [];
        const lastCandle = prevData[prevData.length - 1];
        const newCandle = generateRandomCandle(lastCandle);
        
        const newData = [...prevData, newCandle];
        if (newData.length > 500) { // Keep a maximum of 500 candles
            newData.shift();
        }

        const high = Math.max(...newData.map(d => d.h));
        const low = Math.min(...newData.map(d => d.l));

        setMarketData(prevMarketData => ({
            high: high,
            low: low,
            volume: prevMarketData.volume + Math.random() * 100,
        }));

        return newData;
    });
  }, []);

  // Update chart data on an interval based on the active timeframe
  useEffect(() => {
    const duration = timeframeDurations[activeTimeframe];
    const interval = setInterval(updateData, duration);
    return () => clearInterval(interval);
  }, [activeTimeframe, updateData]);

  const handleTrade = (type: 'buy' | 'sell') => {
    if (isTrading || balance < 50) {
      if(balance < 50) setNotification('Saldo insuficiente para operar.');
      return;
    }
    
    setIsTrading(true);
    setLastResult(null);
    setNotification(`Sinal de ${type === 'buy' ? 'COMPRA' : 'VENDA'}! Analisando...`);
    
    setTimeout(() => {
        const isWin = Math.random() > 0.45;
        const newBalance = isWin ? balance + 50 : balance - 50;
        setBalance(newBalance);
        
        if (isWin) {
            setNotification('GAIN! Operação bem-sucedida. +$50.00');
            setLastResult('gain');
            gainSoundRef.current?.play().catch(e => console.error("Error playing gain sound:", e));
        } else {
            setNotification('LOSS! Operação malsucedida. -$50.00');
            setLastResult('loss');
            lossSoundRef.current?.play().catch(e => console.error("Error playing loss sound:", e));
        }

        setTimeout(() => {
          if (newBalance >= 50) {
            setNotification('Aguardando sua operação...');
          } else {
            setNotification('Fim de jogo! Recarregue para tentar novamente.');
          }
          setIsTrading(false);
        }, 2000);
    }, 1500);
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.max(15, prev - 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.min(chartData.length, prev + 5));
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-background text-foreground font-body animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-4 p-2 sm:p-4 bg-card rounded-lg border border-border">
        <div className="flex items-baseline gap-4">
            <h1 className="text-lg sm:text-xl font-bold tracking-tighter whitespace-nowrap">TRADE SIMULATOR</h1>
            <span className="text-base sm:text-lg font-medium text-muted-foreground">USD/EUR</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-2 text-xs w-full sm:w-auto">
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-muted-foreground">Saldo</span>
                <span id="balance-value" className={cn(
                    'text-base font-semibold transition-colors duration-300',
                    {
                        'text-primary': lastResult === 'gain',
                        'text-destructive': lastResult === 'loss',
                    }
                )}>
                    $ {balance.toFixed(2)}
                </span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-muted-foreground">24h High</span>
                <span className="font-semibold">{marketData.high.toFixed(4)}</span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-muted-foreground">24h Low</span>
                <span className="font-semibold">{marketData.low.toFixed(4)}</span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-muted-foreground">Volume (USD)</span>
                <span className="font-semibold">{marketData.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>
      </header>

      <main className="bg-card p-1 sm:p-2 rounded-lg border border-border">
        <div className="flex items-center gap-2 p-2">
            <div className="flex-1 overflow-x-auto whitespace-nowrap no-scrollbar py-1">
                {timeframes.map(tf => (
                    <Button 
                        key={tf}
                        variant={activeTimeframe === tf ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTimeframe(tf)}
                        className="text-xs h-7 px-2 sm:px-3 mr-1"
                    >
                        {tf}
                    </Button>
                ))}
            </div>
            <div className="flex items-center gap-1 ml-auto pl-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={zoomLevel <= 15}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoomLevel >= chartData.length}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <div className="h-64 md:h-96 w-full">
            {chartData.length > 0 ? <TradeChart data={chartData} visibleRange={zoomLevel} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Carregando gráfico...</div>}
        </div>
      </main>

      <footer className="mt-4 flex flex-col gap-4">
        <div id="notifications" className="text-center text-muted-foreground text-sm h-6 font-semibold flex-grow">
            {notification}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Button 
                id="buy-button"
                size="lg"
                className="h-12 sm:h-14 text-base sm:text-lg font-bold bg-primary/90 hover:bg-primary text-primary-foreground transform transition-transform disabled:scale-100"
                onClick={() => handleTrade('buy')}
                disabled={isTrading || balance < 50}
            >
                <ArrowUp className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> COMPRAR
            </Button>
            <Button 
                id="sell-button"
                size="lg"
                className="h-12 sm:h-14 text-base sm:text-lg font-bold bg-destructive/90 hover:bg-destructive text-destructive-foreground transform transition-transform disabled:scale-100"
                onClick={() => handleTrade('sell')}
                disabled={isTrading || balance < 50}
            >
                <ArrowDown className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> VENDER
            </Button>
        </div>
      </footer>
    </div>
  );
}
