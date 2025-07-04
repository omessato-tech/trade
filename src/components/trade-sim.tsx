"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ZoomIn, ZoomOut, Clock, History } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type TradeRecord = {
  id: number;
  timestamp: Date;
  type: 'buy' | 'sell';
  outcome: 'gain' | 'loss';
  amount: number;
  newBalance: number;
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

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [tradeAmount, setTradeAmount] = useState(50);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [currentTradeType, setCurrentTradeType] = useState<'buy' | 'sell' | null>(null);


  // Setup balance on mount
  useEffect(() => {
    const savedBalance = sessionStorage.getItem('tradeSimBalance');
    if (savedBalance) {
        setBalance(parseFloat(savedBalance));
    }
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
    // Persist balance to session storage whenever it changes.
    if (balance !== 1000) { // Avoid saving the initial default value
        sessionStorage.setItem('tradeSimBalance', balance.toString());
    }
    
    // Animate the balance value on change.
    if (lastResult) {
        const timer = setTimeout(() => setLastResult(null), 500);
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

  // Countdown timer and trade finalization logic
  useEffect(() => {
    if (countdown === null) {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    if (countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(c => (c !== null ? c - 1 : null));
        setNotification(`Aguarde... 0:${(countdown -1).toString().padStart(2, '0')}`);
      }, 1000);
    } else if (countdown === 0 && isTrading && currentTradeType) {
        const isWin = Math.random() > 0.45;
        const amount = tradeAmount;
        const outcomeType = isWin ? 'gain' : 'loss';

        setBalance(prevBalance => {
          const newBalance = isWin ? prevBalance + amount : prevBalance - amount;
          
          const newRecord: TradeRecord = {
            id: Date.now(),
            timestamp: new Date(),
            type: currentTradeType,
            outcome: outcomeType,
            amount: amount,
            newBalance: newBalance,
          };
          setTradeHistory(prevHistory => [newRecord, ...prevHistory]);

          setTimeout(() => {
            if (newBalance >= tradeAmount) {
              setNotification('Aguardando sua operação...');
            } else {
              setNotification('Fim de jogo! Recarregue para tentar novamente.');
            }
            setIsTrading(false);
            setCurrentTradeType(null);
          }, 3000);

          return newBalance;
        });

        setLastResult(outcomeType);
        setNotification(`${outcomeType.toUpperCase()}! Você ${outcomeType === 'gain' ? 'ganhou' : 'perdeu'} $${amount.toFixed(2)}.`);
        setCountdown(null);
    }
    
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [countdown, isTrading, currentTradeType, tradeAmount]);


  const handleTrade = (type: 'buy' | 'sell') => {
    if (isTrading || balance < tradeAmount) {
      if(balance < tradeAmount) setNotification('Saldo insuficiente para operar.');
      return;
    }
    
    setIsTrading(true);
    setCurrentTradeType(type);
    setLastResult(null);
    setCountdown(30);
    setNotification(`Sinal de ${type === 'buy' ? 'COMPRA' : 'VENDA'}! Aguarde 0:30`);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    if (value > 0) {
        setTradeAmount(value);
    } else {
        setTradeAmount(1);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.max(15, prev - 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.min(chartData.length, prev + 5));
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-background text-foreground font-body animate-fade-in relative">
      <header className="bg-card rounded-lg border border-border p-2 sm:p-4 mb-4">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <div className="flex items-center gap-4">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tighter whitespace-nowrap">TRADE SIMULATOR</h1>
                  <Sheet>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                              <History className="h-4 w-4" />
                              <span className="hidden sm:inline sm:ml-2">Histórico</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full max-w-full sm:max-w-xl">
                          <SheetHeader>
                              <SheetTitle>Histórico de Operações</SheetTitle>
                              <SheetDescription>
                                  Veja aqui todas as suas operações recentes.
                              </SheetDescription>
                          </SheetHeader>
                          <div className="mt-4">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Hora</TableHead>
                                          <TableHead>Tipo</TableHead>
                                          <TableHead>Resultado</TableHead>
                                          <TableHead className="text-right">Valor</TableHead>
                                          <TableHead className="text-right">Saldo Final</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {tradeHistory.length > 0 ? tradeHistory.map(trade => (
                                          <TableRow key={trade.id}>
                                              <TableCell>{trade.timestamp.toLocaleTimeString()}</TableCell>
                                              <TableCell>{trade.type === 'buy' ? 'Compra' : 'Venda'}</TableCell>
                                              <TableCell className={cn(
                                                  'font-semibold',
                                                  trade.outcome === 'gain' ? 'text-primary' : 'text-destructive'
                                              )}>
                                                  {trade.outcome === 'gain' ? 'Gain' : 'Loss'}
                                              </TableCell>
                                              <TableCell className={cn(
                                                  'text-right font-mono',
                                                  trade.outcome === 'gain' ? 'text-primary' : 'text-destructive'
                                              )}>
                                                  {trade.outcome === 'gain' ? '+' : '-'}${trade.amount.toFixed(2)}
                                              </TableCell>
                                              <TableCell className="text-right font-mono">${trade.newBalance.toFixed(2)}</TableCell>
                                          </TableRow>
                                      )) : (
                                          <TableRow>
                                              <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma operação registrada.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </SheetContent>
                  </Sheet>
              </div>
              <div className="flex items-center gap-2">
                  <Label htmlFor="trade-amount" className="whitespace-nowrap">Valor</Label>
                  <Input
                      id="trade-amount"
                      type="number"
                      value={tradeAmount}
                      onChange={handleAmountChange}
                      min="1"
                      step="10"
                      className="w-28"
                  />
              </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <span className="text-base sm:text-lg font-medium text-muted-foreground">USD/EUR</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-2 text-xs w-full sm:w-auto">
                <div className="flex flex-col items-start sm:items-end">
                    <span className="text-muted-foreground">Saldo</span>
                    <span id="balance-value" className={cn(
                        'text-base font-semibold transition-colors duration-300',
                        {
                            'text-primary animate-pulse': lastResult === 'gain',
                            'text-destructive animate-pulse': lastResult === 'loss',
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
          </div>
      </header>

      <main className="bg-card p-1 sm:p-2 rounded-lg border border-border">
        <div className="flex items-center justify-between p-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-7 w-24 justify-start px-2 sm:px-3">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>{activeTimeframe}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {timeframes.map(tf => (
                        <DropdownMenuItem
                            key={tf}
                            onSelect={() => setActiveTimeframe(tf)}
                            className="text-xs"
                        >
                            {tf}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1">
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
                disabled={isTrading || balance < tradeAmount}
            >
                <ArrowUp className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> COMPRAR
            </Button>
            <Button 
                id="sell-button"
                size="lg"
                className="h-12 sm:h-14 text-base sm:text-lg font-bold bg-destructive/90 hover:bg-destructive text-destructive-foreground transform transition-transform disabled:scale-100"
                onClick={() => handleTrade('sell')}
                disabled={isTrading || balance < tradeAmount}
            >
                <ArrowDown className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> VENDER
            </Button>
        </div>
      </footer>
    </div>
  );
}
