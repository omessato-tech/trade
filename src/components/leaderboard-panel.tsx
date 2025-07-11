
"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Podium, Globe, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Player {
    id: string;
    name: string;
    nationality: string; // e.g., 'BR', 'US'
    balance: number;
    avatar?: string;
}

interface LeaderboardPanelProps {
    players: Player[];
    currentUser: Player;
    children?: React.ReactNode;
}

const getCountryFlagEmoji = (countryCode: string) => {
    if (countryCode === 'GLOBAL') return <Globe className="h-6 w-6" />;
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');

    const calculateTimeLeft = () => {
        const now = new Date();
        const nextMonday = new Date();
        nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
        nextMonday.setHours(0, 0, 0, 0);

        if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
           nextMonday.setDate(now.getDate() + 7);
        }

        const difference = nextMonday.getTime() - now.getTime();

        let tempTimeLeft = '';
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);

            tempTimeLeft = `${days}d ${hours}h ${minutes}m`;
        }
        return tempTimeLeft;
    }

    useState(() => {
        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // update every minute
        return () => clearInterval(timer);
    });

    return (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground p-2 bg-background/30 rounded-lg">
            <Timer className="h-4 w-4" />
            <span>Fim da temporada em: <strong>{timeLeft}</strong></span>
        </div>
    );
};


const PlayerRow = ({ player, rank }: { player: Player; rank: number }) => {
    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-yellow-500/80 border-yellow-400';
        if (rank === 2) return 'bg-gray-400/80 border-gray-300';
        if (rank === 3) return 'bg-yellow-800/80 border-yellow-700';
        return 'bg-secondary/50 border-border';
    };

    const maxBalance = 1000000;
    const progress = (player.balance / maxBalance) * 100;

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border-b border-border/50">
            <div className={cn("flex items-center justify-center h-8 w-8 rounded-md text-sm font-bold text-white border", getRankColor(rank))}>
                {rank}
            </div>
            <div className="flex items-center gap-3 flex-1">
                 <Avatar className="h-10 w-10">
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold text-white">{player.name}</p>
                     <div className="text-2xl">{getCountryFlagEmoji(player.nationality)}</div>
                </div>
            </div>
            <div className="w-1/3 text-right">
                <p className="font-mono text-primary font-bold">R$ {player.balance.toLocaleString('pt-BR')}</p>
                <Progress value={progress} className="h-1.5 mt-1 bg-background/20 [&>div]:bg-primary" />
            </div>
        </div>
    );
};

const CurrentUserCard = ({ player, rank }: { player: Player; rank: number | null }) => {
    const maxBalance = 1000000;
    const progress = (player.balance / maxBalance) * 100;
    
    return (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold text-lg text-white">{player.name}</p>
                        <p className="text-sm text-primary">Seu Desempenho</p>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Posição</p>
                    <p className="text-2xl font-bold text-white">{rank ? `#${rank}` : 'N/A'}</p>
                </div>
            </div>
            <div>
                 <p className="font-mono text-primary text-right font-bold">R$ {player.balance.toLocaleString('pt-BR')}</p>
                 <Progress value={progress} className="h-2 mt-1 bg-background/20 [&>div]:bg-primary" />
            </div>
        </div>
    )
}

export function LeaderboardPanel({ players, currentUser, children }: LeaderboardPanelProps) {
    const [activeTab, setActiveTab] = useState<'global' | 'brasil'>('global');
    
    const allRankedPlayers = [...players, currentUser].sort((a, b) => b.balance - a.balance);

    const globalRanking = allRankedPlayers.slice(0, 50);
    const brasilRanking = allRankedPlayers.filter(p => p.nationality === 'BR').slice(0, 50);

    const displayedRanking = activeTab === 'global' ? globalRanking : brasilRanking;
    
    const currentUserRank = globalRanking.findIndex(p => p.id === currentUser.id) + 1;


    return (
        <Sheet>
            <SheetTrigger asChild>
                {children || <Button variant="ghost" size="icon"><Podium className="h-5 w-5" /></Button>}
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[500px] p-0 flex flex-col bg-[#13161c] border-l border-border/50" side="left">
                <SheetHeader className="p-4 border-b border-border/50 text-center">
                    <SheetTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Podium className="h-7 w-7 text-primary" />
                        Ranking Semanal
                    </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-4">
                   <CountdownTimer />
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'global' | 'brasil')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="global">
                                <Globe className="h-4 w-4 mr-2" /> Global
                            </TabsTrigger>
                            <TabsTrigger value="brasil">
                                <span className="mr-2">{getCountryFlagEmoji('BR')}</span> Brasil
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-2 pb-4">
                        {displayedRanking.map((player, index) => (
                            <PlayerRow key={player.id} player={player} rank={index + 1} />
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/50 bg-background/20">
                    <CurrentUserCard player={currentUser} rank={currentUserRank > 0 ? currentUserRank : null} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
