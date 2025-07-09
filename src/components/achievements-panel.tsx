
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Award, Medal, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Achievement {
    name: string;
    wins: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

const achievements: Achievement[] = [
    { name: 'Bronze', wins: 5, icon: Medal, color: 'text-[#cd7f32]', bgColor: 'bg-[#cd7f32]/10' },
    { name: 'Prata', wins: 10, icon: Award, color: 'text-[#c0c0c0]', bgColor: 'bg-[#c0c0c0]/10' },
    { name: 'Ouro', wins: 20, icon: Trophy, color: 'text-[#ffd700]', bgColor: 'bg-[#ffd700]/10' },
];

interface AchievementsPanelProps {
    winCount: number;
}

export function AchievementsPanel({ winCount }: AchievementsPanelProps) {
    const getNextAchievement = () => {
        return achievements.find(a => winCount < a.wins);
    };

    const getCurrentRank = () => {
        // Find the highest rank achieved
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
            <SheetContent className="w-[350px] sm:w-[450px] p-0 flex flex-col bg-[#1e222d] border-l border-border" side="left">
                <SheetHeader className="p-4 border-b border-border/50">
                    <SheetTitle>Conquistas</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 p-6">
                    <div className="flex flex-col items-center text-center mb-8">
                        {currentRank ? (
                            <>
                                <currentRank.icon className={cn("h-24 w-24 mb-4 drop-shadow-lg", currentRank.color)} />
                                <h2 className="text-2xl font-bold">Você é {currentRank.name}!</h2>
                                <p className="text-muted-foreground">Total de vitórias: {winCount}</p>
                            </>
                        ) : (
                            <>
                                <Trophy className="h-24 w-24 mb-4 text-muted-foreground/50" />
                                <h2 className="text-2xl font-bold">Iniciante</h2>
                                <p className="text-muted-foreground">Vença 5 trades para alcançar o rank Bronze.</p>
                            </>
                        )}
                         {nextAchievement && (
                            <div className="w-full mt-4">
                                <p className="text-sm text-muted-foreground mb-2">Próximo Rank: {nextAchievement.name} ({winCount}/{nextAchievement.wins} vitórias)</p>
                                <Progress value={progress} className="h-2 [&>div]:bg-primary" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-center mb-4">Todos os Ranks</h3>
                        {achievements.map((ach) => {
                             const isUnlocked = winCount >= ach.wins;
                             return (
                                <div key={ach.name} className={cn("flex items-center gap-4 p-4 rounded-lg border border-border/50", isUnlocked ? ach.bgColor : 'bg-background/20')}>
                                    <div className={cn("flex-shrink-0", !isUnlocked && "opacity-30")}>
                                       <ach.icon className={cn("h-12 w-12", isUnlocked ? ach.color : 'text-muted-foreground')} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-baseline">
                                            <p className={cn("font-bold text-lg", isUnlocked ? "text-white" : "text-muted-foreground")}>{ach.name}</p>
                                            {isUnlocked ? (
                                                <span className="text-xs font-semibold text-primary">DESBLOQUEADO</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">BLOQUEADO</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Requer {ach.wins} vitórias</p>
                                    </div>
                                    {!isUnlocked && <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0"/>}
                                </div>
                             )
                        })}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
