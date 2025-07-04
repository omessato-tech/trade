"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ZoomIn, ZoomOut } from 'lucide-react';

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
  const [activeTimeframe, setActiveTimeframe] = useState('15m');
  const [zoomLevel, setZoomLevel] = useState(50);

  const gainSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedBalance = sessionStorage.getItem('tradeSimBalance');
    setBalance(savedBalance ? parseFloat(savedBalance) : 1000);

    gainSoundRef.current = new Audio('/sounds/gain.mp3');
    lossSoundRef.current = new Audio('/sounds/loss.mp3');
    gainSoundRef.current.volume = 0.3;
    lossSoundRef.current.volume = 0.3;

    let initialData: any[] = [];
    let lastCandle: any = null;
    for(let i=0; i < 200; i++) { // More initial data for zoom
        const candle = generateRandomCandle(lastCandle);
        candle.x = new Date().getTime() - (200-i) * 60000;
        initialData.push(candle);
        lastCandle = candle;
    }
    setChartData(initialData);
    setMarketData({
        high: Math.max(...initialData.map(d => d.h)),
        low: Math.min(...initialData.map(d => d.l)),
        volume: 327229.98
    });

  }, []);

  useEffect(() => {
    sessionStorage.setItem('tradeSimBalance', balance.toString());
    if (lastResult) {
        const timer = setTimeout(() => setLastResult(null), 1000);
        return () => clearTimeout(timer);
    }
  }, [balance, lastResult]);

  const updateData = useCallback(() => {
    setChartData(prevData => {
        const lastCandle = prevData.length > 0 ? prevData[prevData.length - 1] : null;
        const newCandle = generateRandomCandle(lastCandle);
        
        const newData = [...prevData, newCandle];
        if (newData.length > 500) { // Keep more data for zoom
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

  useEffect(() => {
    const interval = setInterval(updateData, 250); // Faster updates for fluidity
    return () => clearInterval(interval);
  }, [updateData]);

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
    }, 1500); // Shorter analysis time for responsiveness
  };
  
  const timeframes = ['15m', '1H', '4H', '1D'];

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.max(15, prev - 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.min(chartData.length, prev + 5));
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-background text-foreground font-body animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-baseline gap-4">
            <h1 className="text-xl font-bold tracking-tighter whitespace-nowrap">TRADE SIMULATOR</h1>
            <span className="text-lg font-medium text-muted-foreground">USD/EUR</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs w-full sm:w-auto">
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
            {timeframes.map(tf => (
                <Button 
                    key={tf}
                    variant={activeTimeframe === tf ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTimeframe(tf)}
                    className="text-xs h-7"
                >
                    {tf}
                </Button>
            ))}
            <div className="flex items-center gap-1 ml-auto">
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
        <div className="grid grid-cols-2 gap-4">
            <Button 
                id="buy-button"
                size="lg"
                className="h-14 text-lg font-bold bg-primary/90 hover:bg-primary text-primary-foreground transform transition-transform disabled:scale-100"
                onClick={() => handleTrade('buy')}
                disabled={isTrading || balance < 50}
            >
                <ArrowUp className="mr-2 h-6 w-6" /> COMPRAR
            </Button>
            <Button 
                id="sell-button"
                size="lg"
                className="h-14 text-lg font-bold bg-destructive/90 hover:bg-destructive text-destructive-foreground transform transition-transform disabled:scale-100"
                onClick={() => handleTrade('sell')}
                disabled={isTrading || balance < 50}
            >
                <ArrowDown className="mr-2 h-6 w-6" /> VENDER
            </Button>
        </div>
      </footer>
    </div>
  );
}
