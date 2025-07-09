"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Award, Medal, Lock, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Achievement {
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

const CurrentRankDisplay = ({ rank, winCount }: { rank: Achievement | undefined; winCount: number }) => {
    const displayRank = rank || {
        name: 'Iniciante',
        icon: Trophy,
        color: 'text-muted-foreground/30',
        glowColor: 'transparent',
        gradientFrom: 'from-muted/10',
        gradientTo: 'to-background/10'
    };

    return (
        <div className={cn(
            "relative flex flex-col items-center text-center p-8 rounded-xl bg-gradient-to-b overflow-hidden border border-border/20",
            displayRank.gradientFrom, displayRank.gradientTo
        )}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50" />
            <displayRank.icon 
                className={cn("h-32 w-32 mb-4", displayRank.color)} 
                style={{ filter: `drop-shadow(0 0 15px ${displayRank.glowColor})` }} 
            />
            <h2 className="text-3xl font-bold text-white z-10">{rank ? `Você é ${rank.name}!` : "Iniciante"}</h2>
            <p className="text-muted-foreground z-10">{rank ? `Baseado em suas ${winCount} vitórias.` : 'Continue negociando para subir de rank.'}</p>
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
            "flex-shrink-0 p-3 rounded-full",
            isUnlocked ? ach.bgColor : 'bg-background/20'
        )}>
            <ach.icon className={cn("h-10 w-10", isUnlocked ? ach.color : 'text-muted-foreground/60')} />
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


export function AchievementsPanel({ winCount }: AchievementsPanelProps) {
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
                <Button variant="ghost" size="icon"><Trophy className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[450px] p-0 flex flex-col bg-[#13161c] border-l border-border/50" side="left">
                <SheetHeader className="p-4 border-b border-border/50 text-center">
                    <SheetTitle className="text-2xl font-bold">Central de Conquistas</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8">
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
