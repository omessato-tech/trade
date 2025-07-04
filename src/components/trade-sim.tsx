"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

const generateRandomCandle = (lastCandle: any) => {
    const now = new Date();
    const open = lastCandle ? lastCandle.c : 1000 + (Math.random() - 0.5) * 10;
    const close = open + (Math.random() - 0.5) * 15;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
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
    for(let i=0; i < 50; i++) {
        const candle = generateRandomCandle(lastCandle);
        candle.x = new Date().getTime() - (50-i) * 60000;
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
        const newData = [...prevData.slice(1), newCandle];

        setMarketData(prevMarketData => ({
            high: Math.max(prevMarketData.high, newCandle.h),
            low: Math.min(prevMarketData.low, newCandle.l),
            volume: prevMarketData.volume + Math.random() * 100,
        }));

        return newData;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(updateData, 5000);
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
            setNotification('GAIN! Operação bem-sucedida. +R$50,00');
            setLastResult('gain');
            gainSoundRef.current?.play().catch(e => console.error("Error playing gain sound:", e));
        } else {
            setNotification('LOSS! Operação malsucedida. -R$50,00');
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
    }, 2500);
  };
  
  const timeframes = ['15m', '1H', '4H', '1D'];

  return (
    <div className="w-full max-w-6xl mx-auto bg-background text-foreground font-body animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 p-4 bg-card rounded-lg border border-border">
        <h1 className="text-xl font-bold tracking-tighter whitespace-nowrap">TRADE SIMULATOR</h1>
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
                    R$ {balance.toFixed(2).replace('.', ',')}
                </span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-muted-foreground">24h High</span>
                <span className="font-semibold">{marketData.high.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-muted-foreground">24h Low</span>
                <span className="font-semibold">{marketData.low.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-muted-foreground">Volume (BNB)</span>
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
        </div>
        <div className="h-64 md:h-96 w-full">
            {chartData.length > 0 ? <TradeChart data={chartData} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Carregando gráfico...</div>}
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
