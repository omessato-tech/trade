
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { 
    Menu, Plus, Briefcase, History, Megaphone, PlayCircle, MessageCircle, MoreHorizontal, 
    Info, Bell, CandlestickChart, ArrowUpRight, ArrowDownLeft, Timer, ZoomIn, LayoutGrid, Bitcoin, X,
    Gem, CircleDollarSign, Lightbulb, Waves, Volume2, VolumeX, Trophy, Award, Medal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AssetSelector } from './asset-selector';
import type { LucideIcon } from 'lucide-react';
import { TradeHistoryPanel } from './trade-history-panel';
import type { TradeHistoryItem } from './trade-history-panel';
import { ScrollArea } from './ui/scroll-area';
import { AchievementsPanel } from './achievements-panel';
import { TutorialGuide, type TutorialStep } from './tutorial-guide';


const timeframes = ['5s', '30s', '1m', '5m'];
const timeframeDurations: { [key: string]: number } = {
  '5s': 5000,
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
};

export interface CurrencyPair {
  id: string;
  name: string;
  category: 'Forex' | 'Crypto';
  type: 'Binary' | 'Crypto' | 'Forex';
  basePrice: number;
  precision: number;
  flag1?: string;
  flag2?: string;
  icon?: LucideIcon;
}

interface PredictionMessage {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  percentage: number;
  countdown: number;
  pairName: string;
  status: 'active' | 'followed' | 'ignored' | 'expired';
}

const allCurrencyPairs: CurrencyPair[] = [
  // Forex
  { id: 'EUR/USD', name: 'EUR/USD', category: 'Forex', type: 'Binary', basePrice: 1.0850, precision: 5, flag1: '🇪🇺', flag2: '🇺🇸' },
  { id: 'EUR/JPY', name: 'EUR/JPY', category: 'Forex', type: 'Binary', basePrice: 169.50, precision: 3, flag1: '🇪🇺', flag2: '🇯🇵' },
  { id: 'CHF/JPY', name: 'CHF/JPY', category: 'Forex', type: 'Forex', basePrice: 175.20, precision: 3, flag1: '🇨🇭', flag2: '🇯🇵' },
  { id: 'GBP/USD', name: 'GBP/USD', category: 'Forex', type: 'Forex', basePrice: 1.2730, precision: 5, flag1: '🇬🇧', flag2: '🇺🇸' },
  { id: 'AUD/USD', name: 'AUD/USD', category: 'Forex', type: 'Forex', basePrice: 0.6650, precision: 5, flag1: '🇦🇺', flag2: '🇺🇸' },
  { id: 'USD/CAD', name: 'USD/CAD', category: 'Forex', type: 'Forex', basePrice: 1.3660, precision: 5, flag1: '🇺🇸', flag2: '🇨🇦' },
  { id: 'USD/JPY', name: 'USD/JPY', category: 'Forex', type: 'Forex', basePrice: 157.40, precision: 3, flag1: '🇺🇸', flag2: '🇯🇵' },
  // Crypto
  { id: 'BTC-USD', name: 'Bitcoin', category: 'Crypto', type: 'Crypto', basePrice: 65000, precision: 2, icon: Bitcoin },
  { id: 'ETH-USD', name: 'Ethereum', category: 'Crypto', type: 'Crypto', basePrice: 3500, precision: 2, icon: Gem },
  { id: 'XRP-USD', name: 'Ripple', category: 'Crypto', type: 'Crypto', basePrice: 0.49, precision: 4, icon: CircleDollarSign },
  { id: 'LTC-USD', name: 'Litecoin', category: 'Crypto', type: 'Crypto', basePrice: 74, precision: 2, icon: Lightbulb },
  { id: 'SOL-USD', name: 'Solana', category: 'Crypto', type: 'Crypto', basePrice: 145, precision: 2, icon: Waves },
];

interface TradeDetails {
    id: string;
    pairId: string;
    type: 'buy' | 'sell';
    entryPrice: number;
    amount: number;
    countdown: number;
    profitState: 'profit' | 'loss' | null;
}

export interface Achievement {
    name: string;
    wins: number;
    icon: React.ElementType;
    color: string;
    glowColor: string;
    bgColor: string;
    shadowColor: string;
    gradientFrom: string;
    gradientTo: string;
    progressBg: string;
}

const achievements: Achievement[] = [
    { name: 'Bronze', wins: 5, icon: Medal, color: 'text-[#cd7f32]', glowColor: '#cd7f32', bgColor: 'bg-[#cd7f32]/10', shadowColor: 'shadow-[#cd7f32]/20', gradientFrom: 'from-[#4a2f14]', gradientTo: 'to-[#13161c]', progressBg: '[&>div]:bg-[#cd7f32]' },
    { name: 'Prata', wins: 10, icon: Award, color: 'text-[#c0c0c0]', glowColor: '#c0c0c0', bgColor: 'bg-[#c0c0c0]/10', shadowColor: 'shadow-[#c0c0c0]/20', gradientFrom: 'from-[#4c4c4c]', gradientTo: 'to-[#13161c]', progressBg: '[&>div]:bg-[#c0c0c0]' },
    { name: 'Ouro', wins: 20, icon: Trophy, color: 'text-[#ffd700]', glowColor: '#ffd700', bgColor: 'bg-[#ffd700]/10', shadowColor: 'shadow-[#ffd700]/20', gradientFrom: 'from-[#5e4d00]', gradientTo: 'to-[#13161c]', progressBg: '[&>div]:bg-[#ffd700]' },
];


export default function TradeSim() {
  const [balance, setBalance] = useState(1000);
  const [activePairId, setActivePairId] = useState('EUR/USD');
  const [openPairs, setOpenPairs] = useState(['EUR/USD', 'EUR/JPY', 'BTC-USD', 'CHF/JPY']);
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({});
  const [activeTimeframe, setActiveTimeframe] = useState('5s');
  const [tradeAmount, setTradeAmount] = useState(4);
  const [leverage, setLeverage] = useState(300);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [lastTradeResult, setLastTradeResult] = useState<{ amount: number; type: 'gain' | 'loss' } | null>(null);
  
  const gainSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatSoundRef = useRef<HTMLAudioElement | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const modoProSoundRef = useRef<HTMLAudioElement | null>(null);
  const rankUpSoundRef = useRef<HTMLAudioElement | null>(null);

  const [activeTrades, setActiveTrades] = useState<TradeDetails[]>([]);
  const [tradesToResolve, setTradesToResolve] = useState<TradeDetails[]>([]);
  
  const [zoomLevel, setZoomLevel] = useState(200);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [winCount, setWinCount] = useState(0);
  const [rankUpInfo, setRankUpInfo] = useState<{ rank: Achievement; nextRank?: Achievement } | null>(null);
  const prevWinCountRef = useRef<number>(winCount);

  const [predictions, setPredictions] = useState<PredictionMessage[]>([]);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [isProMode, setIsProMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const chartDataRef = useRef<{ [key: string]: any[] }>();
  chartDataRef.current = chartData;

  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  
  const activePair = allCurrencyPairs.find(p => p.id === activePairId)!;

  // Draggable chat state
  const [chatPosition, setChatPosition] = useState<{top: number, left: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const chatWrapperRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLElement>(null);

  // Refs for tutorial
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  const sellButtonRef = useRef<HTMLButtonElement>(null);
  const proModeButtonRef = useRef<HTMLButtonElement>(null);
  const historyButtonRef = useRef<HTMLDivElement>(null);
  const achievementsButtonRef = useRef<HTMLDivElement>(null);
  const predictionsChatRef = useRef<HTMLDivElement>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Sound setup
  useEffect(() => {
    gainSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/g8kuyoj92dse42x809px8/money-soundfx.mp3?rlkey=yrvyfsscwyuvvwkhz1db8pnsc&dl=1');
    lossSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/422avpg6mmh10gxzlgmtq/app-error.mp3?rlkey=eecjn7ft9w71oerkjvbpjnkl0&dl=1');
    notificationSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/z8b9x0ivjzy50lixhhien/mensagens-notificacao.mp3?rlkey=tjock8lev0b7h72agsoo4a9z3&dl=1');
    clickSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/n55rapwidqiyan35ea5h3/button_09-190435.mp3?rlkey=ok05nvpvpvljsqzxa1iewcqp6&dl=1');
    modoProSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/dt5877jdhzsb26v6nzffh/Efeito-Sonoro-RISADA-MALIGNA.mp3?rlkey=ceai7boxregpmf38eo4lkc58t&dl=1');
    rankUpSoundRef.current = new Audio('https://www.dropbox.com/scl/fi/ve20i62ep6lcplte69iqp/brass-fanfare-with-timpani-and-winchimes-reverberated-146260.mp3?rlkey=a68w7y4o5tdpr0ihw1uwfvlb0&dl=1');

    const heartbeatSound = new Audio('https://www.dropbox.com/scl/fi/o6ot3qm4qs33tnxt0l89b/Heart-Rate-Monitor.mov.mp3?rlkey=49vwh340mvpogypuv8lx3lsqn&dl=1');
    heartbeatSound.loop = true;
    heartbeatSoundRef.current = heartbeatSound;
  }, []);

  const fetchInitialData = useCallback(async (pairId: string) => {
    const pair = allCurrencyPairs.find(p => p.id === pairId);
    if (!pair) return;

    try {
      const response = await fetch(`/api/market-data?pair=${pair.id}&category=${pair.category}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch market data (${response.status})`);
      }
      const data = await response.json();
      if (!data || data.error) {
          throw new Error(data.error || 'Empty data returned from API');
      }
      setChartData(prev => ({ ...prev, [pairId]: data.slice(-500) })); // Keep last 500 candles
    } catch (error) {
      console.warn(`Could not fetch real data for ${pairId}, using fallback. Error:`, error);
      // Fallback to random data on error
      const timeframeMillis = timeframeDurations[activeTimeframe];
      let initialData: any[] = [];
      const now = new Date().getTime();
      const startTime = Math.floor(now / timeframeMillis) * timeframeMillis - (200 * timeframeMillis);
      let lastCandle: any = null;
      for (let i = 0; i < 200; i++) {
        const candleTime = startTime + i * timeframeMillis;
        const open = lastCandle ? lastCandle.c : allCurrencyPairs.find(p=>p.id === pairId)!.basePrice;
        const close = open + (Math.random() - 0.5) * (open * 0.0005);
        const high = Math.max(open, close) + Math.random() * (open * 0.0005 * 0.5);
        const low = Math.min(open, close) - Math.random() * (open * 0.0005 * 0.5);
        initialData.push({ x: candleTime, o: open, h: high, l: low, c: close });
        lastCandle = initialData[initialData.length-1];
      }
      setChartData(prev => ({ ...prev, [pairId]: initialData }));
    }
  }, [activeTimeframe]);

  useEffect(() => {
    // Fetch data for all open pairs initially
    openPairs.forEach(pairId => {
      if (!chartData[pairId]) {
        fetchInitialData(pairId);
      }
    });
  }, [openPairs, fetchInitialData, chartData]);

  const updateData = useCallback(async () => {
    const pair = allCurrencyPairs.find(p => p.id === activePairId);
    if (!pair) return;

    try {
        const response = await fetch(`/api/market-data?pair=${pair.id}&category=${pair.category}`);
        if (!response.ok) {
           throw new Error(`Failed to fetch latest data for ${pair.id}. Status: ${response.status}`);
        }
        const data = await response.json();
        if (!data || data.error || !Array.isArray(data)) {
            throw new Error(`Empty or error data for latest price of ${pair.id}: ${data?.error}`);
        }

        setChartData(prevData => ({
             ...prevData,
             [activePairId]: data.slice(-500) // Just replace with the latest dataset
        }));

    } catch (error) {
        console.warn(`Failed to update data for ${pair.id}, using fallback. Error:`, error);
        // Fallback to generating a new random candle to keep the chart moving
        setChartData(prevData => {
            const existingData = prevData[activePairId] || [];
            if (existingData.length === 0) return prevData;

            const lastCandle = existingData[existingData.length - 1];
            const newTime = lastCandle.x + 5000; // New candle every 5 seconds on fallback
            const open = lastCandle.c;
            const close = open + (Math.random() - 0.5) * (open * 0.0005);
            const high = Math.max(open, close) + Math.random() * (open * 0.0005 * 0.5);
            const low = Math.min(open, close) - Math.random() * (open * 0.0005 * 0.5);
            const newCandle = { x: newTime, o: open, h: high, l: low, c: close };

            const newData = [...existingData, newCandle];
            
            return {
                ...prevData,
                [activePairId]: newData.slice(-500)
            };
        });
    }
  }, [activePairId]);

  // Update chart data on an interval
  useEffect(() => {
    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateData]);

  // Update current time display
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Effect to process trades that have finished their countdown
  useEffect(() => {
    if (tradesToResolve.length === 0) return;

    tradesToResolve.forEach(trade => {
        const currentChartData = chartDataRef.current?.[trade.pairId];
        if (!currentChartData || currentChartData.length === 0) {
            console.error("Cannot resolve trade, chart data not available for", trade.pairId);
            return;
        }

        const finalPrice = currentChartData[currentChartData.length - 1].c;
        const { type, entryPrice, amount } = trade;
        const isWin = (type === 'buy') ? finalPrice > entryPrice : finalPrice < entryPrice;

        if (isWin) {
            setWinCount(prev => prev + 1);
        }

        const winAmount = amount * 0.9;
        const lossAmount = -amount;
        const resultAmount = isWin ? winAmount : lossAmount;

        const newHistoryItem: TradeHistoryItem = {
            id: `${new Date().getTime()}-${Math.random()}`,
            pairId: trade.pairId,
            timestamp: new Date(),
            type: trade.type,
            entryPrice: trade.entryPrice,
            closePrice: finalPrice,
            amount: trade.amount,
            resultAmount: resultAmount,
            isWin: isWin,
        };
        setTradeHistory(prev => [newHistoryItem, ...prev]);

        setLastTradeResult({
            amount: Math.abs(resultAmount),
            type: isWin ? 'gain' : 'loss'
        });
        setTimeout(() => setLastTradeResult(null), 2000);

        if (isSoundEnabled) {
            const sound = isWin ? gainSoundRef.current : lossSoundRef.current;
            sound?.play().catch(console.error);
        }
        
        if (isWin) {
          setBalance(prevBalance => prevBalance + amount + winAmount);
        }
    });

    setTradesToResolve([]); // Clear the queue after processing
  }, [tradesToResolve, isSoundEnabled]);

  // Effect for trade countdowns and live status updates
  useEffect(() => {
    const tradeTimer = setInterval(() => {
        let needsHeartbeat = false;

        setActiveTrades(prevTrades => {
            const stillActive: TradeDetails[] = [];
            const resolvedNow: TradeDetails[] = [];

            prevTrades.forEach(trade => {
                if (trade.countdown <= 1) {
                    resolvedNow.push(trade);
                } else {
                    const currentPairChartData = chartDataRef.current?.[trade.pairId];
                    let newProfitState = trade.profitState;

                    if (currentPairChartData && currentPairChartData.length > 0) {
                        const currentPrice = currentPairChartData[currentPairChartData.length - 1].c;
                        newProfitState = ((trade.type === 'buy' && currentPrice > trade.entryPrice) || (trade.type === 'sell' && currentPrice < trade.entryPrice))
                            ? 'profit' : 'loss';
                    }

                    if (newProfitState === 'loss') {
                        needsHeartbeat = true;
                    }

                    stillActive.push({
                        ...trade,
                        countdown: trade.countdown - 1,
                        profitState: newProfitState,
                    });
                }
            });

            if (resolvedNow.length > 0) {
                setTradesToResolve(prev => [...prev, ...resolvedNow]);
            }
            
            // Heartbeat sound logic
            if (isSoundEnabled) {
                if (needsHeartbeat && heartbeatSoundRef.current?.paused) {
                    heartbeatSoundRef.current.play().catch(console.error);
                } else if (!needsHeartbeat && !heartbeatSoundRef.current?.paused) {
                    heartbeatSoundRef.current.pause();
                    heartbeatSoundRef.current.currentTime = 0;
                }
            }
            
            return stillActive;
        });
    }, 1000);

    return () => clearInterval(tradeTimer);
  }, [isSoundEnabled]);
  
  // Rank-up detection effect
  useEffect(() => {
    const previousWins = prevWinCountRef.current;
    const currentWins = winCount;

    if (currentWins > previousWins) {
        const justAchievedRank = achievements.find(ach => currentWins >= ach.wins && previousWins < ach.wins);

        if (justAchievedRank) {
            const nextRankIndex = achievements.findIndex(a => a.name === justAchievedRank.name) + 1;
            const nextRank = achievements[nextRankIndex];
            
            setRankUpInfo({ rank: justAchievedRank, nextRank });
            if (isSoundEnabled) {
                rankUpSoundRef.current?.play().catch(console.error);
            }
        }
    }
    
    prevWinCountRef.current = currentWins;
  }, [winCount, isSoundEnabled]);


  // Stop sounds if they are disabled
  useEffect(() => {
    if (!isSoundEnabled && heartbeatSoundRef.current) {
      heartbeatSoundRef.current.pause();
      heartbeatSoundRef.current.currentTime = 0;
    }
  }, [isSoundEnabled]);
  
  // Prediction Generation
  useEffect(() => {
    const predictionInterval = setInterval(() => {
      setPredictions(prevPredictions => {
        const hasActivePrediction = prevPredictions.some(p => p.status === 'active');
        if (activeTrades.length === 0 && !hasActivePrediction) {
          const predictionType = Math.random() > 0.5 ? 'buy' : 'sell';
          
          const predictionPercentage = isProMode
              ? Math.floor(Math.random() * 21) + 20 // 20% to 40%
              : Math.floor(Math.random() * 11) + 10; // 10% to 20%
          
          const predictionAmount = (balance * predictionPercentage) / 100;

          const newPrediction: PredictionMessage = {
            id: new Date().getTime().toString(),
            type: predictionType,
            amount: predictionAmount,
            percentage: predictionPercentage,
            countdown: 15,
            pairName: activePair.name,
            status: 'active',
          };

          setIsChatMinimized(false);
          if (isSoundEnabled) {
            notificationSoundRef.current?.play().catch(error => console.error("Notification audio play failed", error));
          }
          return [newPrediction, ...prevPredictions].slice(0, 5);
        }
        return prevPredictions;
      });
    }, 30000); // 30 seconds

    return () => clearInterval(predictionInterval);
  }, [balance, activeTrades.length, isProMode, isSoundEnabled, activePair.name]);

  // Prediction Countdown Logic
  useEffect(() => {
      const timer = setInterval(() => {
          setPredictions(prevPredictions => 
              prevPredictions.map(p => {
                  if (p.status === 'active' && p.countdown > 0) {
                      return { ...p, countdown: p.countdown - 1 };
                  }
                  if (p.status === 'active' && p.countdown === 0) {
                      return { ...p, status: 'expired' };
                  }
                  return p;
              })
          );
      }, 1000);

      return () => clearInterval(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chatWrapperRef.current || !chartAreaRef.current) return;
    
    // Set initial position on first drag
    if (!chatPosition) {
        const chatRect = chatWrapperRef.current.getBoundingClientRect();
        const chartAreaRect = chartAreaRef.current.getBoundingClientRect();
        setChatPosition({
            top: chatRect.top - chartAreaRect.top,
            left: chatRect.left - chartAreaRect.left
        });
    }

    setIsDragging(true);

    const chatRect = chatWrapperRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - chatRect.left,
      y: e.clientY - chatRect.top,
    };
    
    e.preventDefault();
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !chartAreaRef.current || !chatWrapperRef.current) return;

    const chartAreaRect = chartAreaRef.current.getBoundingClientRect();
    const chatRect = chatWrapperRef.current.getBoundingClientRect();
    
    let newLeft = e.clientX - dragOffset.current.x;
    let newTop = e.clientY - dragOffset.current.y;
    
    // Constrain to chart area boundaries (relative to viewport)
    newLeft = Math.max(chartAreaRect.left, newLeft);
    newTop = Math.max(chartAreaRect.top, newTop);
    newLeft = Math.min(chartAreaRect.right - chatRect.width, newLeft);
    newTop = Math.min(chartAreaRect.bottom - chatRect.height, newTop);

    // Set position relative to the chart area
    setChatPosition({
      top: newTop - chartAreaRect.top,
      left: newLeft - chartAreaRect.left,
    });
  }, [isDragging]);

  useEffect(() => {
    const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
    const mouseUpHandler = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    }

    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
  }, [isDragging, handleMouseMove]);


  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    setTradeAmount(Math.max(1, value || 1));
  };
  
  const handleTrade = (type: 'buy' | 'sell', amount: number) => {
    const currentChart = chartData[activePairId];
    if (!currentChart || currentChart.length < 1) {
      return;
    }
    
    if (balance < amount) {
      return;
    }

    if (isSoundEnabled) {
        clickSoundRef.current?.play().catch(error => console.error("Audio play failed", error));
    }
    
    setBalance(prevBalance => prevBalance - amount);

    const entryPrice = currentChart[currentChart.length - 1].c;
    const newTrade: TradeDetails = {
        id: `${new Date().getTime()}`,
        pairId: activePairId,
        type,
        entryPrice,
        amount,
        countdown: 30,
        profitState: null,
    };

    setActiveTrades(prev => [...prev, newTrade]);
  };

  const handleFollowPrediction = (predictionId: string) => {
    const predictionToFollow = predictions.find(p => p.id === predictionId);
    if (!predictionToFollow || predictionToFollow.status !== 'active') return;

    if (predictionToFollow.pairName !== activePair.name) {
      console.warn(`Prediction is for ${predictionToFollow.pairName}, but active pair is ${activePair.name}.`);
      return;
    }
    
    handleTrade(predictionToFollow.type, predictionToFollow.amount);
    setPredictions(prev => prev.map(p => p.id === predictionId ? { ...p, status: 'followed' } : p));
  };
  
  const handleIgnorePrediction = (predictionId: string) => {
    setPredictions(prev => prev.map(p => p.id === predictionId ? { ...p, status: 'ignored' } : p));
  };

  const handleToggleProMode = () => {
    setIsProMode(prevIsPro => {
        const newIsPro = !prevIsPro;
        if (newIsPro && isSoundEnabled) {
            modoProSoundRef.current?.play().catch(error => console.error("Audio play failed", error));
        }
        return newIsPro;
    });
  };
  
  const handleZoom = () => {
    setZoomLevel(prev => {
      if (prev === 200) return 100;
      if (prev === 100) return 50;
      return 200; // cycle back
    });
  };

  const handlePairChange = (pairId: string) => {
    setActivePairId(pairId);
  };
  
  const handleAddPair = (pairId: string) => {
    if (!openPairs.includes(pairId)) {
        setOpenPairs(prev => [...prev, pairId]);
        fetchInitialData(pairId);
    }
    setActivePairId(pairId);
  };

  const handleRemovePair = (e: React.MouseEvent, pairId: string) => {
      e.stopPropagation(); 
      if (openPairs.length <= 1) return; 

      const newOpenPairs = openPairs.filter(id => id !== pairId);
      setOpenPairs(newOpenPairs);
      
      if (activePairId === pairId) {
          setActivePairId(newOpenPairs[0]);
      }
  };


  const currentChart = chartData[activePairId] || [];
  const currentPrice = currentChart.length > 0 ? currentChart[currentChart.length - 1].c : null;
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !chatPosition) {
        const chartArea = chartAreaRef.current;
        if (chartArea) {
            const initialTop = chartArea.clientHeight - 520;
            setChatPosition({ top: initialTop > 20 ? initialTop : 20, left: 16 });
        }
    }
  }, [chatPosition]);


  const activeTradesForCurrentPair = activeTrades.filter(t => t.pairId === activePairId);
  const entryLinesForChart = activeTradesForCurrentPair.map(t => ({
      price: t.entryPrice,
      type: t.type,
      state: t.profitState,
  }));

  // Tutorial Logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const tutorialSeen = localStorage.getItem('tradeSimTutorialSeen');
        if (!tutorialSeen) {
            setTimeout(() => setIsTutorialOpen(true), 1000);
        }
    }
  }, []);

  const handleTutorialComplete = () => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('tradeSimTutorialSeen', 'true');
      }
      setIsTutorialOpen(false);
  };

  const tutorialSteps: TutorialStep[] = [
    {
        ref: buyButtonRef,
        title: 'Botão de Compra (Subir)',
        content: 'Use este botão para abrir uma operação de COMPRA. Você lucra se o preço do ativo SUBIR acima do preço de entrada quando o tempo acabar.',
        placement: 'left',
    },
    {
        ref: sellButtonRef,
        title: 'Botão de Venda (Descer)',
        content: 'Use este botão para abrir uma operação de VENDA. Você lucra se o preço do ativo DESCER abaixo do preço de entrada quando o tempo acabar.',
        placement: 'left',
    },
    {
        ref: proModeButtonRef,
        title: 'Modo Pro',
        content: 'Ative o "Modo Pro" para receber sinais de entrada com maior risco e potencial de lucro. Use com sabedoria!',
        placement: 'top',
    },
    {
        ref: achievementsButtonRef,
        title: 'Central de Conquistas',
        content: 'Aqui você pode acompanhar seus ranks e conquistas. Quanto mais vitórias, mais alto seu rank!',
        placement: 'right',
    },
    {
        ref: historyButtonRef,
        title: 'Histórico de Trades',
        content: 'Consulte todos os seus trades passados, tanto as vitórias quanto as derrotas, para analisar sua performance.',
        placement: 'right',
    },
    {
        ref: predictionsChatRef,
        title: 'Sinais de Entrada (IA)',
        content: 'Fique de olho! Nossa IA envia sinais de oportunidade aqui. Você pode escolher seguir ou ignorar as sugestões.',
        placement: 'right',
        spotlightPadding: 0,
    },
  ];

  return (
    <div className="flex md:flex-row flex-col h-screen w-full bg-background text-sm text-foreground font-body">
      {isTutorialOpen && <TutorialGuide steps={tutorialSteps} onComplete={handleTutorialComplete} isOpen={isTutorialOpen} />}
      <AlertDialog open={!!rankUpInfo} onOpenChange={(open) => { if (!open) setRankUpInfo(null); }}>
          <AlertDialogContent className="bg-gradient-to-br from-[#2a2a3a] to-[#1a1a2a] border-primary/50 text-white">
              <AlertDialogHeader>
                  <div className="flex justify-center mb-4">
                      {rankUpInfo && <rankUpInfo.rank.icon className={cn("h-24 w-24", rankUpInfo.rank.color)} style={{ filter: `drop-shadow(0 0 20px ${rankUpInfo.rank.glowColor})` }} />}
                  </div>
                  <AlertDialogTitle className="text-center text-3xl font-bold">Parabéns!</AlertDialogTitle>
                  <AlertDialogDescription className="text-center text-lg text-white/80 mt-2">
                      Você foi promovido para o rank de <strong className={cn("font-bold", rankUpInfo?.rank.color)}>{rankUpInfo?.rank.name}</strong>!
                      <br />
                      {rankUpInfo?.nextRank 
                          ? `Faltam ${rankUpInfo.nextRank.wins - winCount} vitórias para o próximo nível: ${rankUpInfo.nextRank.name}.`
                          : 'Você alcançou o rank mais alto! Continue assim!'
                      }
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                  <AlertDialogAction className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setRankUpInfo(null)}>Continuar Dominando</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      {/* Left Sidebar */}
      <aside className="w-16 hidden md:flex flex-none flex-col items-center space-y-2 bg-[#1e222d] py-4 border-r border-border">
        <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
         <Dialog open={isAssetSelectorOpen} onOpenChange={setIsAssetSelectorOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Plus className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent className="p-0 max-w-4xl bg-transparent border-0 shadow-none">
                <DialogHeader>
                    <DialogTitle className="sr-only">Select Asset</DialogTitle>
                    <DialogDescription className="sr-only">
                        Search for and select a currency pair or cryptocurrency to trade.
                    </DialogDescription>
                </DialogHeader>
                <AssetSelector 
                    allPairs={allCurrencyPairs}
                    openPairs={openPairs}
                    onSelectPair={handleAddPair}
                    onClose={() => setIsAssetSelectorOpen(false)}
                />
            </DialogContent>
        </Dialog>
        <Separator className="!bg-border/50 my-2" />
        <nav className="flex flex-col space-y-2 items-center">
          <Button variant="ghost" size="icon"><Briefcase className="h-5 w-5" /></Button>
          <div ref={historyButtonRef} className="inline-block">
            <TradeHistoryPanel history={tradeHistory} allPairs={allCurrencyPairs} />
          </div>
          <div ref={achievementsButtonRef} className="inline-block">
            <AchievementsPanel winCount={winCount} achievements={achievements} />
          </div>
          <Button variant="ghost" size="icon"><Megaphone className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><PlayCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><MessageCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSoundEnabled(prev => !prev)}>
            {isSoundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Currency Pair Selector */}
        <div className="flex-none flex items-center gap-1 p-1 bg-[#1e222d] border-b border-border overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-center h-10 px-2 shrink-0">
                <Image src="https://i.imgur.com/7muedyE.png" alt="TradeSim Logo" width={120} height={36} className="object-contain" />
            </div>
            {openPairs.map(pairId => {
                const pair = allCurrencyPairs.find(p => p.id === pairId);
                if (!pair) return null;
                const isActive = activePairId === pairId;
                const activeTradeCount = activeTrades.filter(t => t.pairId === pairId).length;
                return (
                    <div
                        key={pair.id}
                        onClick={() => handlePairChange(pair.id)}
                        className={cn(
                            "relative flex items-center gap-2 p-2 rounded-md cursor-pointer h-10 shrink-0",
                            isActive ? "bg-background/50 border-b-2 border-primary" : "hover:bg-background/20"
                        )}
                    >
                        {activeTradeCount > 0 && (
                            <span className="absolute top-0 left-0 h-4 w-4 text-xs rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                {activeTradeCount}
                            </span>
                        )}
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
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-4 w-4 text-muted-foreground hover:text-foreground" onClick={(e) => handleRemovePair(e, pair.id)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )
            })}
             <Dialog open={isAssetSelectorOpen} onOpenChange={setIsAssetSelectorOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="border border-border/50 h-10 w-10">
                        <Plus className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="p-0 max-w-4xl bg-transparent border-0 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Select Asset</DialogTitle>
                        <DialogDescription className="sr-only">
                            Search for and select a currency pair or cryptocurrency to trade.
                        </DialogDescription>
                    </DialogHeader>
                    <AssetSelector 
                        allPairs={allCurrencyPairs}
                        openPairs={openPairs}
                        onSelectPair={handleAddPair}
                        onClose={() => setIsAssetSelectorOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
        
        {/* Chart Area */}
        <main ref={chartAreaRef} className="flex-1 relative flex flex-col">
            <div className="absolute inset-0 bg-[url('https://i.imgur.com/3Dir0GB.png')] bg-cover bg-center bg-no-repeat brightness-50 z-0"></div>
            
            {activeTradesForCurrentPair.length > 0 && (
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 flex flex-col items-start gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm font-mono max-h-48 overflow-y-auto">
                   {activeTradesForCurrentPair.map(trade => (
                        <div key={trade.id} className="flex items-center gap-4 text-xs w-full">
                            <div className={cn("w-14 text-center px-2 py-1 rounded", trade.type === 'buy' ? 'bg-primary/80' : 'bg-destructive/80')}>
                                {trade.type.toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold">R$ {trade.amount.toFixed(2)}</p>
                                <p className="text-muted-foreground">{trade.entryPrice.toFixed(activePair.precision)}</p>
                            </div>
                             <div className="flex-1 text-center">
                                <p className={cn(
                                    "font-bold",
                                    trade.profitState === 'profit' ? 'text-primary' : 'text-destructive'
                                )}>
                                    {trade.profitState === 'profit' ? '+' : '-'}R$ {(trade.profitState === 'profit' ? trade.amount * 0.9 : trade.amount).toFixed(2)}
                                </p>
                            </div>
                             <div className="w-16 text-right text-destructive font-bold flex items-center gap-1">
                                <Timer className="h-4 w-4" />
                                <span>{`00:${String(trade.countdown).padStart(2, '0')}`}</span>
                            </div>
                        </div>
                   ))}
                </div>
            )}
            
          {/* Prediction Chat */}
          <div
            ref={predictionsChatRef}
            className="absolute z-30 w-full max-w-sm"
            style={
              chatPosition
                ? { top: chatPosition.top, left: chatPosition.left, bottom: 'auto', right: 'auto' }
                : { top: '200px', left: '16px' }
            }
          >
            <div className="flex flex-col items-end gap-2">
                {!isChatMinimized && (
                    <Card className="w-full bg-background/80 backdrop-blur-sm border-primary shadow-lg shadow-primary/20 animate-fade-in">
                        <CardHeader 
                          className="flex flex-row items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg cursor-move"
                          onMouseDown={handleMouseDown}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-white/50">
                                    <AvatarImage src="https://i.imgur.com/1yOxxAY.png" alt="DETONA 7" />
                                    <AvatarFallback>D7</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base font-bold">DETONA 7 SINAIS</CardTitle>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <p className="text-xs text-primary-foreground/80">Online</p>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={() => setIsChatMinimized(true)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-80 p-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-primary shrink-0">
                                            <AvatarImage src="https://i.imgur.com/1yOxxAY.png" alt="DETONA 7" />
                                            <AvatarFallback>D7</AvatarFallback>
                                        </Avatar>
                                        <div className="p-3 rounded-lg bg-muted max-w-[85%]">
                                            <p className="text-sm">Analisando o mercado em busca das melhores oportunidades! Fique atento.</p>
                                        </div>
                                    </div>
                                    
                                    {[...predictions].reverse().map(p => (
                                        <div key={p.id} className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8 border-2 border-primary shrink-0">
                                                <AvatarImage src="https://i.imgur.com/1yOxxAY.png" alt="DETONA 7" />
                                                <AvatarFallback>D7</AvatarFallback>
                                            </Avatar>
                                            <div className="p-3 rounded-lg bg-muted max-w-[85%] space-y-2">
                                                <p className="font-bold text-sm">Oportunidade em {p.pairName}!</p>
                                                <p className="text-sm">
                                                    Entrada de <strong>{p.percentage}%</strong> da banca (R$ {p.amount.toFixed(2)}).
                                                    <br />
                                                    Operação: <strong className={p.type === 'buy' ? 'text-primary' : 'text-destructive'}>{p.type === 'buy' ? 'COMPRA' : 'VENDA'}</strong>.
                                                </p>
                                                {p.status === 'active' && (
                                                    <div className="pt-2">
                                                        <div className="text-xs text-center text-muted-foreground mb-2">Expira em {p.countdown}s</div>
                                                        <div className="flex gap-2">
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">SEGUIR</Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Confirmar Entrada?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Você está prestes a fazer uma entrada de {p.type === 'buy' ? 'COMPRA' : 'VENDA'} em {p.pairName} no valor de R$ {p.amount.toFixed(2)}.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleFollowPrediction(p.id)}>Confirmar</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleIgnorePrediction(p.id)}>Ignorar</Button>
                                                        </div>
                                                    </div>
                                                )}
                                                {p.status === 'followed' && <p className="text-xs font-bold text-primary text-center pt-2">✅ SINAL SEGUIDO</p>}
                                                {p.status === 'ignored' && <p className="text-xs font-bold text-muted-foreground text-center pt-2">❌ SINAL IGNORADO</p>}
                                                {p.status === 'expired' && <p className="text-xs font-bold text-muted-foreground text-center pt-2">⏰ SINAL EXPIRADO</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
                
                <button
                    onClick={() => setIsChatMinimized(p => !p)}
                    className="group relative rounded-full transition-transform duration-300 ease-out hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <Avatar className="h-14 w-14 border-2 border-primary shadow-lg">
                        <AvatarImage src="https://i.imgur.com/1yOxxAY.png" alt="DETONA 7" />
                        <AvatarFallback>D7</AvatarFallback>
                    </Avatar>
                    {isChatMinimized && predictions.some(p => p.status === 'active') && (
                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
                    )}
                </button>
            </div>
          </div>


          <div className="flex-1 relative z-10">
            {currentChart.length > 0 ? (
                <TradeChart 
                    data={currentChart} 
                    visibleRange={zoomLevel} 
                    entryLines={entryLinesForChart} 
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
                {currentTime?.toLocaleString('pt-BR', { day: 'numeric', month: 'short', year:'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                <Button ref={buyButtonRef} size="lg" className="h-auto flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 disabled:opacity-50" onClick={() => handleTrade('buy', tradeAmount)}>
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
                <Button ref={sellButtonRef} size="lg" className="h-auto flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 disabled:opacity-50" onClick={() => handleTrade('sell', tradeAmount)}>
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
        <div className="flex flex-col items-center justify-center gap-2 pt-3 border-t border-border/50">
            <button
                ref={proModeButtonRef}
                onClick={handleToggleProMode}
                className="group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
                <Image
                    src="https://imgur.com/nujNEMB.png"
                    alt="Modo Pro"
                    width={80}
                    height={80}
                    className={cn(
                        "rounded-full transition-all duration-300 ease-in-out",
                        isProMode 
                            ? "brightness-110 saturate-150 [filter:drop-shadow(0_0_8px_hsl(var(--primary)))]" 
                            : "grayscale brightness-75 opacity-80 group-hover:opacity-100 group-hover:grayscale-0"
                    )}
                />
            </button>
            <p className={cn(
                "font-bold transition-colors text-xs tracking-widest uppercase",
                isProMode ? "text-primary" : "text-muted-foreground"
            )}>
                Modo Pro
            </p>
        </div>
      </aside>
    </div>
  );
}
