"use client";

import { useState, useEffect, useRef } from 'react';
import TradeChart from './trade-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function TradeSim() {
  const [gameStarted, setGameStarted] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [isTrading, setIsTrading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<'gain' | 'loss' | null>(null);

  const gainSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedBalance = sessionStorage.getItem('tradeSimBalance');
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    } else {
      setBalance(1000);
    }

    gainSoundRef.current = new Audio('/sounds/gain.mp3');
    lossSoundRef.current = new Audio('/sounds/loss.mp3');
    gainSoundRef.current.volume = 0.3;
    lossSoundRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    if(gameStarted) {
      sessionStorage.setItem('tradeSimBalance', balance.toString());
    }
    if (lastResult) {
        const timer = setTimeout(() => setLastResult(null), 1000);
        return () => clearTimeout(timer);
    }
  }, [balance, gameStarted, lastResult]);
  
  const handleStartGame = () => {
    setGameStarted(true);
    setNotification('Aguardando sua operação...');
  };

  const handleTrade = (type: 'buy' | 'sell') => {
    if (isTrading || balance < 50) {
      if(balance < 50) setNotification('Saldo insuficiente para operar.');
      return;
    }
    
    setIsTrading(true);
    setLastResult(null);
    const countdown = 3;
    setNotification(`Sinal de ${type === 'buy' ? 'COMPRA' : 'VENDA'}! Analisando em ${countdown}...`);
    
    let currentCount = countdown;
    const countdownInterval = setInterval(() => {
        currentCount--;
        setNotification(`Sinal de ${type === 'buy' ? 'COMPRA' : 'VENDA'}! Analisando em ${currentCount}...`);
        if (currentCount <= 0) {
            clearInterval(countdownInterval);
            
            const isWin = Math.random() > 0.5;
            
            if (isWin) {
                setBalance(prev => prev + 50);
                setNotification('GAIN! Operação bem-sucedida. +R$50,00');
                setLastResult('gain');
                gainSoundRef.current?.play().catch(e => console.error("Error playing gain sound:", e));
            } else {
                setBalance(prev => prev - 50);
                setNotification('LOSS! Operação malsucedida. -R$50,00');
                setLastResult('loss');
                lossSoundRef.current?.play().catch(e => console.error("Error playing loss sound:", e));
            }

            setTimeout(() => {
              if (balance > 50) {
                setNotification('Aguardando sua operação...');
              } else {
                setNotification('Fim de jogo! Recarregue para tentar novamente.');
              }
              setIsTrading(false);
            }, 2000);
        }
    }, 1000);
  };
  
  if (!gameStarted) {
    return (
      <header className="text-center p-8 flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
          TRADE GAME: <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">TESTE SUA ESTRATÉGIA!</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-md">
          Clique em "Jogar" e opere com sinais em tempo real para aumentar sua banca!
        </p>
        <Button size="lg" onClick={handleStartGame} className="font-bold text-lg px-10 py-6 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary/20">
          JOGAR AGORA
        </Button>
      </header>
    );
  }

  return (
    <div id="game-container" className="w-full max-w-4xl mx-auto animate-fade-in">
      <Card id="game-card" className="bg-card/50 backdrop-blur-sm border-border/20 shadow-2xl">
        <CardHeader className="flex flex-row justify-between items-center p-4 border-b border-border/20">
          <div id="balance" className="text-xl md:text-2xl font-bold">
            Saldo: R$ 
            <span id="balance-value" className={cn(
              'transition-all duration-500 inline-block',
              {
                'text-primary': lastResult === 'gain',
                'text-destructive': lastResult === 'loss',
                'animate-pulse': lastResult !== null,
              }
            )}>
              {balance.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 flex flex-col gap-4">
          <div className="h-64 md:h-96 w-full bg-background/50 rounded-lg overflow-hidden border border-border/20">
            <TradeChart />
          </div>
          <div id="notifications" className="text-center text-muted-foreground h-6 font-semibold">
            {notification}
          </div>
          <div id="controls" className="grid grid-cols-2 gap-4">
            <Button 
              id="buy-button"
              variant="default"
              size="lg"
              className="h-16 text-lg md:text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground transform hover:scale-105 transition-transform disabled:scale-100"
              onClick={() => handleTrade('buy')}
              disabled={isTrading || balance < 50}
            >
              <ArrowUp className="mr-2 h-6 w-6" /> COMPRAR
            </Button>
            <Button 
              id="sell-button"
              variant="destructive" 
              size="lg"
              className="h-16 text-lg md:text-xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground transform hover:scale-105 transition-transform disabled:scale-100"
              onClick={() => handleTrade('sell')}
              disabled={isTrading || balance < 50}
            >
              <ArrowDown className="mr-2 h-6 w-6" /> VENDER
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
