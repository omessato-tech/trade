
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Lock, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Achievement } from "./trade-sim";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";

interface AchievementsPanelProps {
    winCount: number;
    achievements: Achievement[];
    children?: React.ReactNode;
}

const CurrentRankDisplay = ({ rank, winCount }: { rank: Achievement | undefined; winCount: number }) => {
    if (!rank) {
        return (
            <div className="relative flex flex-col items-center text-center p-8 rounded-xl bg-gradient-to-b from-muted/10 to-background/10 overflow-hidden border border-border/20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50" />
                <Trophy 
                    className="h-32 w-32 mb-4 text-muted-foreground/30"
                    style={{ filter: `drop-shadow(0 0 15px transparent)` }} 
                />
                <h2 className="text-3xl font-bold text-white z-10">Iniciante</h2>
                <p className="text-muted-foreground z-10">Continue negociando para subir de rank.</p>
            </div>
        );
    }
    
    return (
        <div className={cn(
            "relative flex flex-col items-center text-center p-8 rounded-xl bg-gradient-to-b overflow-hidden border border-border/20",
            rank.gradientFrom, rank.gradientTo
        )}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50" />
            <Image 
                src={rank.icon}
                alt={rank.name}
                width={128}
                height={128}
                className="mb-4"
                style={{ filter: `drop-shadow(0 0 15px ${rank.glowColor})` }} 
            />
            <h2 className="text-3xl font-bold text-white z-10">{`Você é ${rank.name}!`}</h2>
            <p className="text-muted-foreground z-10">{`Baseado em suas ${winCount} vitórias.`}</p>
        </div>
    );
};

const NextRankProgress = ({ nextAchievement, winCount, progress }: { nextAchievement: Achievement; winCount: number; progress: number }) => (
    <div className="w-full text-center space-y-2">
        <p className="text-sm text-muted-foreground">
            Próximo Rank: <span className={cn('font-bold', nextAchievement.color)}>{nextAchievement.name}</span> ({winCount}/{nextAchievement.wins} vitórias)
        </p>
        <Progress value={progress} className={cn("h-3 bg-background/20", nextAchievement.progressBg)} />
    </div>
);


const AchievementCard = ({ ach, isUnlocked }: { ach: Achievement; isUnlocked: boolean }) => (
    <div className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
        isUnlocked 
            ? `${ach.bgColor} border-primary/30 shadow-lg ${ach.shadowColor}`
            : 'bg-background/20 border-border/50 hover:bg-background/30 hover:border-border'
    )}>
        <div className={cn(
            "flex-shrink-0 p-2 rounded-full",
            isUnlocked ? ach.bgColor : 'bg-background/20'
        )}>
            <Image src={ach.icon} alt={ach.name} width={40} height={40} />
        </div>
        <div className="flex-1">
            <p className={cn("font-bold text-lg", isUnlocked ? "text-white" : "text-muted-foreground")}>{ach.name}</p>
            <p className="text-sm text-muted-foreground">Requer {ach.wins} vitórias</p>
        </div>
        {isUnlocked ? (
             <div className="flex flex-col items-center text-primary text-center w-20">
                <CheckCircle className="h-6 w-6" />
                <span className="text-xs mt-1">Conquistado</span>
            </div>
        ) : (
            <div className="flex flex-col items-center text-muted-foreground text-center w-20">
                <Lock className="h-6 w-6" />
                <span className="text-xs mt-1">Bloqueado</span>
            </div>
        )}
    </div>
);


export function AchievementsPanel({ winCount, achievements, children }: AchievementsPanelProps) {
    const getNextAchievement = () => {
        return achievements.find(a => winCount < a.wins);
    };

    const getCurrentRank = () => {
        return [...achievements].reverse().find(a => winCount >= a.wins);
    };

    const nextAchievement = getNextAchievement();
    const currentRank = getCurrentRank();
    
    let progress = 0;
    if (nextAchievement) {
        const nextAchievementIndex = achievements.findIndex(a => a.name === nextAchievement.name);
        const previousWins = nextAchievementIndex > 0 ? achievements[nextAchievementIndex - 1].wins : 0;
        
        const totalNeededForNext = nextAchievement.wins - previousWins;
        const currentProgressForNext = winCount - previousWins;
        progress = (currentProgressForNext / totalNeededForNext) * 100;
    } else if (currentRank) {
        progress = 100;
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children || <Button variant="ghost" size="icon"><Trophy className="h-5 w-5" /></Button>}
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[450px] p-0 flex flex-col bg-[#13161c] border-l border-border/50" side="left">
                <SheetHeader className="p-4 border-b border-border/50 text-center">
                    <SheetTitle className="text-2xl font-bold">Central de Conquistas</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8">
                        <Carousel className="w-full max-w-xs mx-auto">
                          <CarouselContent>
                              <CarouselItem>
                                <Image src="https://i.imgur.com/WsBE1JC.png" alt="Conquista 1" width={400} height={400} className="rounded-lg" />
                              </CarouselItem>
                              <CarouselItem>
                                <Image src="https://i.imgur.com/MBdAGAR.png" alt="Conquista 2" width={400} height={400} className="rounded-lg" />
                              </CarouselItem>
                          </CarouselContent>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </Carousel>

                        <CurrentRankDisplay rank={currentRank} winCount={winCount} />
                        
                        {nextAchievement && (
                            <NextRankProgress nextAchievement={nextAchievement} winCount={winCount} progress={progress} />
                        )}

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-center mb-4">Todos os Ranks</h3>
                            {achievements.map((ach) => (
                                <AchievementCard
                                    key={ach.name}
                                    ach={ach}
                                    isUnlocked={winCount >= ach.wins}
                                />
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
