"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { 
    Menu, Plus, Briefcase, CalendarDays, Megaphone, PlayCircle, MessageCircle, MoreHorizontal, 
    Info, Bell, CandlestickChart, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

const timeframes = ['1s', '1m', '5m', '1D', '1W', '1M'];
const timeframeDurations: { [key: string]: number } = {
  '1s': 1000,
  '1m': 60000,
  '5m': 300000,
  '1D': 86400000,
  '1W': 604800000,
  '1M': 2592000000,
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
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState('1m');
  const [tradeAmount, setTradeAmount] = useState(4);
  const [leverage, setLeverage] = useState(300);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastTradeResult, setLastTradeResult] = useState<{ amount: number; type: 'gain' | 'loss' } | null>(null);
  const gainSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);

  const [tradeDetails, setTradeDetails] = useState<{ type: 'buy' | 'sell'; entryPrice: number; } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const chartDataRef = useRef<any[]>();
  chartDataRef.current = chartData;

  const resolveTrade = useCallback(() => {
    const currentChartData = chartDataRef.current;
    if (!tradeDetails || !currentChartData || currentChartData.length === 0) return;

    const finalPrice = currentChartData[currentChartData.length - 1].c;
    const { type, entryPrice } = tradeDetails;

    let isWin = false;
    if (type === 'buy') {
      isWin = finalPrice > entryPrice;
    } else { // sell
      isWin = finalPrice < entryPrice;
    }

    const winAmount = tradeAmount * 0.9;
    const lossAmount = -tradeAmount;
    const resultAmount = isWin ? winAmount : lossAmount;
    
    setLastTradeResult({
        amount: Math.abs(resultAmount),
        type: isWin ? 'gain' : 'loss'
    });
    setTimeout(() => {
        setLastTradeResult(null);
    }, 2000);

    if (isWin) {
        gainSoundRef.current?.play().catch(error => console.error("Audio play failed", error));
    } else {
        lossSoundRef.current?.play().catch(error => console.error("Audio play failed", error));
    }

    setBalance(prevBalance => prevBalance + resultAmount);
    setTradeDetails(null);
    setCountdown(null);
  }, [tradeDetails, tradeAmount]);


  useEffect(() => {
    gainSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/g8kuyoj92dse42x809px8/money-soundfx.mp3?rlkey=yrvyfsscwyuvvwkhz1db8pnsc&st=fwvi92jq&dl=1');
    lossSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/422avpg6mmh10gxzlgmtq/app-error.mp3?rlkey=eecjn7ft9w71oerkjvbpjnkl0&st=hngh4cba&dl=1');
  }, []);

  // Initial chart data generation
  useEffect(() => {
    let initialData: any[] = [];
    let lastCandle: any = null;
    for(let i=0; i < 200; i++) {
        const candle = generateRandomCandle(lastCandle);
        candle.x = new Date().getTime() - (200-i) * 1000; // Generate based on seconds for consistency
        initialData.push(candle);
        lastCandle = candle;
    }
    setChartData(initialData);
  }, []);

  const updateData = useCallback(() => {
    setChartData(prevData => {
        if (prevData.length === 0) return [];
        const lastCandle = prevData[prevData.length - 1];
        const newCandle = generateRandomCandle(lastCandle);
        
        const newData = [...prevData, newCandle];
        if (newData.length > 500) {
            newData.shift();
        }
        return newData;
    });
  }, []);

  // Update chart data on an interval
  useEffect(() => {
    const interval = setInterval(updateData, 1000); // Update every second
    return () => clearInterval(interval);
  }, [updateData]);

  // Update current time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      resolveTrade();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, resolveTrade]);


  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    setTradeAmount(Math.max(1, value || 1));
  };
  
  const handleTrade = (type: 'buy' | 'sell') => {
    if (tradeDetails || chartData.length < 1) {
      return;
    }
    
    if (balance < tradeAmount) {
      return;
    }
    
    const entryPrice = chartData[chartData.length - 1].c;
    setTradeDetails({ type, entryPrice });
    setCountdown(30);
  };

  return (
    <div className="flex h-screen w-full bg-background text-sm text-foreground font-body">
      {/* Left Sidebar */}
      <aside className="w-16 flex-none flex flex-col items-center space-y-2 bg-[#1e222d] py-4 border-r border-border">
        <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon"><Plus className="h-5 w-5" /></Button>
        <Separator className="!bg-border/50 my-2" />
        <nav className="flex flex-col space-y-2 items-center">
          <Button variant="ghost" size="icon"><Briefcase className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><CalendarDays className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><Megaphone className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><PlayCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><MessageCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chart Area */}
        <main className="flex-1 relative bg-card flex flex-col">
           {tradeDetails && countdown !== null && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 p-3 rounded-lg backdrop-blur-sm text-center">
                <p className="text-xs text-muted-foreground">TEMPO RESTANTE</p>
                <p className="text-2xl font-bold text-white">{countdown}s</p>
            </div>
          )}
          <div className="flex-1 relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 p-3 rounded-lg backdrop-blur-sm">
              <p className="text-xs text-muted-foreground">MAIORES MUDANÇAS DE HOJE</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-white font-bold">ZCash</p>
                <p className="text-primary text-sm font-bold">+3.42%</p>
              </div>
            </div>
            {chartData.length > 0 ? <TradeChart data={chartData} entryLine={tradeDetails ? { price: tradeDetails.entryPrice, type: tradeDetails.type } : null} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Carregando gráfico...</div>}
            {lastTradeResult && (
              <div
                  key={Date.now()}
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              >
                  <div
                      className={cn(
                          'text-5xl font-bold animate-result-pop',
                          lastTradeResult.type === 'gain' ? 'text-primary' : 'text-destructive'
                      )}
                      style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                  >
                      {lastTradeResult.type === 'gain' ? '+' : '-'}R$ {lastTradeResult.amount.toFixed(2)}
                  </div>
              </div>
            )}
          </div>
        </main>
        {/* Bottom Toolbar */}
        <footer className="flex-none flex items-center justify-between p-2 bg-[#1e222d] border-t border-border">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><CandlestickChart className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-1 text-xs">
                {timeframes.map(tf => (
                    <Button key={tf} variant={activeTimeframe === tf ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3" onClick={() => setActiveTimeframe(tf)}>{tf}</Button>
                ))}
            </div>
            <div className="text-xs text-muted-foreground w-36 text-right">
                {currentTime.toLocaleString('pt-BR', { day: 'numeric', month: 'short', year:'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
        </footer>
      </div>
      
      {/* Right Sidebar */}
      <aside className="w-72 flex-none bg-[#1e222d] p-4 border-l border-border flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-primary font-bold text-lg">R$ {balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">TOTAL R$ {balance.toFixed(2)}</p>
            </div>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
                + DEPOSITAR
            </Button>
        </div>
        <Separator className="!bg-border/50" />
        
        <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between items-center">
                <label htmlFor="invest-amount" className="text-muted-foreground">INVEST.</label>
                <Input id="invest-amount" type="number" value={tradeAmount} onChange={handleAmountChange} className="w-24 bg-input border-border text-right text-destructive font-bold" />
            </div>
            <div className="flex justify-between items-center">
                <p className="text-muted-foreground">ALAV.</p>
                <p className="text-white font-bold">x{leverage}</p>
            </div>
             <div className="flex justify-between items-center">
                <p className="text-muted-foreground">TOTAL</p>
                <p className="text-white font-bold">R$ {(tradeAmount * leverage).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
            </div>
        </div>

        <div className="flex flex-col gap-3 mt-auto">
            <Button size="lg" className="h-auto bg-primary hover:bg-primary/90 text-primary-foreground py-2 disabled:opacity-50" onClick={() => handleTrade('buy')} disabled={!!tradeDetails}>
                <div className="flex items-center justify-between w-full">
                    <ArrowUpRight className="h-6 w-6" />
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-base">COMPRAR</span>
                        <span className="text-xs">{chartData.length > 0 ? chartData[chartData.length - 1].c.toFixed(5) : '0.00000'}</span>
                    </div>
                </div>
            </Button>
            <div className="flex justify-between items-center text-xs px-2">
                <p className="text-muted-foreground">SPREAD</p>
                <p className="text-white">92.2</p>
            </div>
            <Button size="lg" className="h-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 disabled:opacity-50" onClick={() => handleTrade('sell')} disabled={!!tradeDetails}>
                 <div className="flex items-center justify-between w-full">
                    <ArrowDownLeft className="h-6 w-6" />
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-base">VENDER</span>
                        <span className="text-xs">{chartData.length > 0 ? chartData[chartData.length - 1].c.toFixed(5) : '0.00000'}</span>
                    </div>
                </div>
            </Button>
        </div>
      </aside>
    </div>
  );
}
