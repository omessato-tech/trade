"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { 
    Menu, Plus, Briefcase, CalendarDays, Megaphone, PlayCircle, MessageCircle, MoreHorizontal, 
    Info, Bell, CandlestickChart, ArrowUpRight, ArrowDownLeft, Timer, ZoomIn, Sparkles, LayoutGrid, Bitcoin, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

const timeframes = ['1s', '1m', '5m', '1D', '1W', '1M'];
const timeframeDurations: { [key: string]: number } = {
  '1s': 1000,
  '1m': 60000,
  '5m': 300000,
  '1D': 86400000,
  '1W': 604800000,
  '1M': 2592000000,
};

const currencyPairs = [
  { id: 'EUR/USD', name: 'EUR/USD', type: 'Binary', basePrice: 1.0850, precision: 5, flag1: '🇪🇺', flag2: '🇺🇸' },
  { id: 'EUR/JPY', name: 'EUR/JPY', type: 'Binary', basePrice: 169.50, precision: 3, flag1: '🇪🇺', flag2: '🇯🇵' },
  { id: 'Bitcoin', name: 'Bitcoin', type: 'Crypto', basePrice: 65000, precision: 2, icon: Bitcoin },
  { id: 'CHF/JPY', name: 'CHF/JPY', type: 'Forex', basePrice: 175.20, precision: 3, flag1: '🇨🇭', flag2: '🇯🇵' },
];

const generateRandomCandle = (lastCandle: any, direction: 'buy' | 'sell' | null, basePrice: number) => {
    const now = new Date();
    const volatilityFactor = 0.00015; // To control the size of candles relative to price
    
    const open = lastCandle ? lastCandle.c : basePrice + (Math.random() - 0.5) * (basePrice * volatilityFactor);
    
    let close;
    const baseRandom = Math.random();

    // The core of the price movement logic
    let movement = (baseRandom - 0.5); // -0.5 to 0.5

    if (direction === 'buy') {
        // More likely to go up. We shift the random distribution upwards.
        // A value > 0 means price up, < 0 means price down.
        // Math.random() is 0 to 1. By subtracting 0.45, we get -0.45 to 0.55.
        // This gives a higher chance of a positive result.
        movement = (Math.random() - 0.45);
    } else if (direction === 'sell') {
        // More likely to go down. We shift the random distribution downwards.
        // By subtracting 0.55, we get -0.55 to 0.45.
        // This gives a higher chance of a negative result.
        movement = (Math.random() - 0.55);
    }
    
    close = open + movement * (basePrice * volatilityFactor);

    const high = Math.max(open, close) + Math.random() * (basePrice * volatilityFactor * 0.5);
    const low = Math.min(open, close) - Math.random() * (basePrice * volatilityFactor * 0.5);
    return { x: now.getTime(), o: open, h: high, l: low, c: close };
};


export default function TradeSim() {
  const [balance, setBalance] = useState(1000);
  const [activePairId, setActivePairId] = useState('EUR/USD');
  const [openPairs, setOpenPairs] = useState(['EUR/USD', 'EUR/JPY', 'Bitcoin', 'CHF/JPY']);
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({});
  const [activeTimeframe, setActiveTimeframe] = useState('1m');
  const [tradeAmount, setTradeAmount] = useState(4);
  const [leverage, setLeverage] = useState(300);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastTradeResult, setLastTradeResult] = useState<{ amount: number; type: 'gain' | 'loss' } | null>(null);
  const gainSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatSoundRef = useRef<HTMLAudioElement | null>(null);

  const [tradeDetails, setTradeDetails] = useState<{ pairId: string, type: 'buy' | 'sell'; entryPrice: number; amount: number; } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [profitState, setProfitState] = useState<'profit' | 'loss' | null>(null);
  const [zoomLevel, setZoomLevel] = useState(200);

  const [prediction, setPrediction] = useState<{ visible: boolean; type: 'buy' | 'sell'; amount: number; percentage: number; } | null>(null);
  const [predictionDirection, setPredictionDirection] = useState<'buy' | 'sell' | null>(null);
  
  const chartDataRef = useRef<{ [key: string]: any[] }>();
  chartDataRef.current = chartData;

  const activePair = currencyPairs.find(p => p.id === activePairId)!;

  const resolveTrade = useCallback(() => {
    if (!tradeDetails) return;

    const currentChartData = chartDataRef.current?.[tradeDetails.pairId];
    if (!currentChartData || currentChartData.length === 0) return;

    const finalPrice = currentChartData[currentChartData.length - 1].c;
    const { type, entryPrice, amount } = tradeDetails;

    let isWin = false;
    if (type === 'buy') {
      isWin = finalPrice > entryPrice;
    } else { // sell
      isWin = finalPrice < entryPrice;
    }

    const winAmount = amount * 0.9;
    const lossAmount = -amount;
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
    setPredictionDirection(null);
  }, [tradeDetails]);


  useEffect(() => {
    gainSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/g8kuyoj92dse42x809px8/money-soundfx.mp3?rlkey=yrvyfsscwyuvvwkhz1db8pnsc&st=fwvi92jq&dl=1');
    lossSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/422avpg6mmh10gxzlgmtq/app-error.mp3?rlkey=eecjn7ft9w71oerkjvbpjnkl0&st=hngh4cba&dl=1');
    
    const heartbeatSound = new Audio('https://www.dropbox.com/scl/fi/o6ot3qm4qs33tnxt0l89b/Heart-Rate-Monitor.mov.mp3?rlkey=49vwh340mvpogypuv8lx3lsqn&st=lh31tk6d&dl=1');
    heartbeatSound.loop = true;
    heartbeatSoundRef.current = heartbeatSound;
  }, []);

  // Chart data generation for active pair
  useEffect(() => {
    if (!chartData[activePairId]) {
      let initialData: any[] = [];
      let lastCandle: any = null;
      for (let i = 0; i < 200; i++) {
        const candle = generateRandomCandle(lastCandle, null, activePair.basePrice);
        candle.x = new Date().getTime() - (200 - i) * 1000;
        initialData.push(candle);
        lastCandle = candle;
      }
      setChartData(prev => ({ ...prev, [activePairId]: initialData }));
    }
  }, [activePairId, activePair.basePrice]);

  const updateData = useCallback(() => {
    setChartData(prevData => {
        const currentData = prevData[activePairId] || [];
        if (currentData.length === 0) return prevData;

        const lastCandle = currentData[currentData.length - 1];
        const newCandle = generateRandomCandle(lastCandle, predictionDirection, activePair.basePrice);
        
        const newData = [...currentData, newCandle];
        if (newData.length > 500) {
            newData.shift();
        }
        return { ...prevData, [activePairId]: newData };
    });
  }, [predictionDirection, activePairId, activePair.basePrice]);

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
  
  // Profit/Loss state checker
  useEffect(() => {
    if (!tradeDetails || !chartData[tradeDetails.pairId] || chartData[tradeDetails.pairId].length === 0) {
      setProfitState(null);
      if (heartbeatSoundRef.current) {
        heartbeatSoundRef.current.pause();
        heartbeatSoundRef.current.currentTime = 0;
      }
      return;
    }
    
    const currentPairChartData = chartData[tradeDetails.pairId];
    const currentPrice = currentPairChartData[currentPairChartData.length - 1].c;
    const { type, entryPrice } = tradeDetails;

    let isProfit = false;
    if (type === 'buy') {
      isProfit = currentPrice > entryPrice;
    } else { // sell
      isProfit = currentPrice < entryPrice;
    }
    
    const newProfitState = isProfit ? 'profit' : 'loss';
    setProfitState(newProfitState);

    if (newProfitState === 'loss') {
        heartbeatSoundRef.current?.play().catch(error => console.error("Heartbeat audio play failed", error));
    } else { // profit
        if (heartbeatSoundRef.current) {
            heartbeatSoundRef.current.pause();
            heartbeatSoundRef.current.currentTime = 0;
        }
    }

  }, [chartData, tradeDetails]);
  
    // Prediction Card Timer
    useEffect(() => {
        const predictionInterval = setInterval(() => {
            if (!tradeDetails && !prediction?.visible) {
                const predictionType = Math.random() > 0.5 ? 'buy' : 'sell';
                const predictionPercentage = Math.floor(Math.random() * 11) + 10; // 10% to 20%
                const predictionAmount = (balance * predictionPercentage) / 100;

                setPrediction({
                    visible: true,
                    type: predictionType,
                    amount: predictionAmount,
                    percentage: predictionPercentage,
                });
            } else if (prediction?.visible) {
                // Hides the card if it's visible for too long
                // setTimeout(() => setPrediction(null), 10000);
            }
        }, 30000); // 30 seconds

        return () => clearInterval(predictionInterval);
    }, [balance, tradeDetails, prediction]);


  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    setTradeAmount(Math.max(1, value || 1));
  };
  
  const handleTrade = (type: 'buy' | 'sell', amount: number) => {
    const currentChart = chartData[activePairId];
    if (tradeDetails || !currentChart || currentChart.length < 1) {
      return;
    }
    
    if (balance < amount) {
      return;
    }
    
    const entryPrice = currentChart[currentChart.length - 1].c;
    setTradeDetails({ pairId: activePairId, type, entryPrice, amount });
    setCountdown(30);
  };

  const handleFollowPrediction = () => {
    if (!prediction || tradeDetails) return;
    
    handleTrade(prediction.type, prediction.amount);
    setPredictionDirection(prediction.type);
    setPrediction(null);
  };
  
  const handleZoom = () => {
    setZoomLevel(prev => {
      if (prev === 200) return 100;
      if (prev === 100) return 50;
      return 200; // cycle back
    });
  };

  const handlePairChange = (pairId: string) => {
    if (tradeDetails) {
        // Maybe show a toast that you can't switch during a trade
        return;
    }
    setActivePairId(pairId);
  };

  const currentChart = chartData[activePairId] || [];
  const currentPrice = currentChart.length > 0 ? currentChart[currentChart.length - 1].c : null;

  return (
    <div className="flex md:flex-row flex-col h-screen w-full bg-background text-sm text-foreground font-body">
      {/* Left Sidebar */}
      <aside className="w-16 hidden md:flex flex-none flex-col items-center space-y-2 bg-[#1e222d] py-4 border-r border-border">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Currency Pair Selector */}
        <div className="flex-none flex items-center gap-1 p-1 bg-[#1e222d] border-b border-border overflow-x-auto no-scrollbar">
            <Button variant="ghost" size="icon" className="border border-border/50 h-10 w-10">
                <LayoutGrid className="h-5 w-5" />
            </Button>
            {openPairs.map(pairId => {
                const pair = currencyPairs.find(p => p.id === pairId);
                if (!pair) return null;
                const isActive = activePairId === pairId;
                return (
                    <div
                        key={pair.id}
                        onClick={() => handlePairChange(pair.id)}
                        className={cn(
                            "relative flex items-center gap-2 p-2 rounded-md cursor-pointer h-10 shrink-0",
                            isActive ? "bg-background/50 border-b-2 border-primary" : "hover:bg-background/20"
                        )}
                    >
                        {pair.icon ? <pair.icon className="h-5 w-5 text-orange-400" /> : (
                            <div className="flex items-center">
                                <span className="text-xl">{pair.flag1}</span>
                                <span className="text-xl -ml-2">{pair.flag2}</span>
                            </div>
                        )}
                        <div className="flex flex-col items-start">
                            <span className="text-xs font-semibold">{pair.name}</span>
                            <span className="text-xs text-muted-foreground">{pair.type}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-4 w-4 text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )
            })}
            <Button variant="ghost" size="icon" className="border border-border/50 h-10 w-10">
                <Plus className="h-5 w-5" />
            </Button>
        </div>
        
        {/* Chart Area */}
        <main className="flex-1 relative flex flex-col">
            <div className="absolute inset-0 bg-[url('https://imgur.com/jCWkgEv.png')] bg-cover bg-center bg-no-repeat brightness-50 z-0"></div>
            {tradeDetails && tradeDetails.pairId === activePairId && countdown !== null && (
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-8 bg-black/50 px-2 py-1 md:px-4 md:py-2 rounded-lg backdrop-blur-sm font-mono">
                    <div className="text-left">
                        <div className="text-destructive text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Timer className="h-5 w-5 md:h-6 md:w-6" />
                            <span>{`00:${String(countdown).padStart(2, '0')}`}</span>
                        </div>
                        <p className="text-xs text-destructive/90 font-semibold tracking-wider uppercase mt-1">Expiration Time</p>
                    </div>

                    <div className="text-left">
                        <p className="text-white text-xl md:text-2xl font-bold">
                            R$ {tradeDetails.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase mt-1">Total Investment</p>
                    </div>

                    <div className="text-left">
                        <p className={cn(
                            "text-xl md:text-2xl font-bold",
                            profitState === 'profit' ? 'text-primary' : 'text-destructive'
                        )}>
                            {profitState === 'profit' ? '+' : '-'}R$ {(profitState === 'profit' ? tradeDetails.amount * 0.9 : tradeDetails.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase mt-1">Expected Profit</p>
                    </div>
                </div>
            )}
            
          {/* Prediction Card */}
          {prediction?.visible && (
              <Card className="absolute bottom-4 z-30 w-full max-w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 md:w-80 md:left-4 md:translate-x-0 animate-fade-in bg-background/80 backdrop-blur-sm border-primary shadow-lg shadow-primary/20">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                          <Sparkles className="h-6 w-6" />
                          DETONA 7
                      </CardTitle>
                      <CardDescription>Oportunidade detectada em {activePair.name}!</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                      <p className="text-lg font-bold">
                          {`${prediction.percentage}% da banca`}
                      </p>
                      <p className="text-lg font-bold uppercase">
                          {`${prediction.type === 'buy' ? 'COMPRE' : 'VENDA'} sem GALE`}
                      </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button className="w-full bg-primary hover:bg-primary/90">SEGUIR PREVISÃO</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Entrada?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Você está prestes a fazer uma entrada de {prediction.type === 'buy' ? 'COMPRA' : 'VENDA'} em {activePair.name} no valor de R$ {prediction.amount.toFixed(2)}. Esta ação é baseada na previsão "DETONA 7".
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setPrediction(null)}>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleFollowPrediction}>Confirmar e Entrar</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="outline" className="w-full" onClick={() => setPrediction(null)}>Ignorar</Button>
                  </CardFooter>
              </Card>
          )}

          <div className="flex-1 relative z-10">
            {currentChart.length > 0 ? (
                <TradeChart 
                    data={currentChart} 
                    visibleRange={zoomLevel} 
                    entryLine={tradeDetails && tradeDetails.pairId === activePairId ? { price: tradeDetails.entryPrice, type: tradeDetails.type } : null} 
                    profitState={profitState} 
                    currentPrice={currentPrice} 
                />
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Carregando gráfico...</div>
            )}
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
        <footer className="hidden md:flex flex-none items-center justify-between p-2 bg-[#1e222d] border-t border-border">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><CandlestickChart className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={handleZoom}><ZoomIn className="h-4 w-4" /></Button>
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
      
      {/* Right Sidebar / Mobile Bottom Bar */}
      <aside className="w-full md:w-72 md:flex-none bg-[#1e222d] p-3 md:p-4 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3 md:gap-4">
        <div className="hidden md:flex justify-between items-center">
            <div>
                <p className="text-primary font-bold text-lg">R$ {balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">TOTAL R$ {balance.toFixed(2)}</p>
            </div>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
                + DEPOSITAR
            </Button>
        </div>
        <Separator className="!bg-border/50 hidden md:block" />
        
        <div className="flex flex-row md:flex-col items-center md:items-stretch gap-3 text-sm">
            <div className="flex flex-1 md:flex-initial flex-col gap-3">
                <div className="flex justify-between items-center">
                    <label htmlFor="invest-amount" className="text-muted-foreground">INVEST.</label>
                    <Input id="invest-amount" type="number" value={tradeAmount} onChange={handleAmountChange} className="w-24 bg-input border-border text-right text-destructive font-bold" />
                </div>
                <div className="hidden md:flex justify-between items-center">
                    <p className="text-muted-foreground">ALAV.</p>
                    <p className="text-white font-bold">x{leverage}</p>
                </div>
                <div className="hidden md:flex justify-between items-center">
                    <p className="text-muted-foreground">TOTAL</p>
                    <p className="text-white font-bold">R$ {(tradeAmount * leverage).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
            </div>

            <div className="flex flex-1 md:flex-initial flex-row md:flex-col gap-3 md:mt-auto">
                <Button size="lg" className="h-auto flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 disabled:opacity-50" onClick={() => handleTrade('buy', tradeAmount)} disabled={!!tradeDetails}>
                    <div className="flex items-center justify-between w-full">
                        <ArrowUpRight className="h-6 w-6" />
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-base">COMPRAR</span>
                            <span className="text-xs">{currentPrice ? currentPrice.toFixed(activePair.precision) : '0.00000'}</span>
                        </div>
                    </div>
                </Button>
                <div className="hidden md:flex justify-between items-center text-xs px-2">
                    <p className="text-muted-foreground">SPREAD</p>
                    <p className="text-white">92.2</p>
                </div>
                <Button size="lg" className="h-auto flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 disabled:opacity-50" onClick={() => handleTrade('sell', tradeAmount)} disabled={!!tradeDetails}>
                    <div className="flex items-center justify-between w-full">
                        <ArrowDownLeft className="h-6 w-6" />
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-base">VENDER</span>
                            <span className="text-xs">{currentPrice ? currentPrice.toFixed(activePair.precision) : '0.00000'}</span>
                        </div>
                    </div>
                </Button>
            </div>
        </div>
      </aside>
    </div>
  );
}
