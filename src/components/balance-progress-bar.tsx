
"use client";

import { Medal, Award, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  min: number;
  max: number;
  icon: React.ElementType;
  color: string;
  progressBg: string;
}

const tiers: Tier[] = [
  { name: 'Bronze', min: 0, max: 10000, icon: Medal, color: 'text-[#cd7f32]', progressBg: '[&>div]:bg-[#cd7f32]' },
  { name: 'Prata', min: 10000, max: 500000, icon: Award, color: 'text-[#c0c0c0]', progressBg: '[&>div]:bg-[#c0c0c0]' },
  { name: 'Ouro', min: 500000, max: 1000000, icon: Trophy, color: 'text-[#ffd700]', progressBg: '[&>div]:bg-[#ffd700]' },
];

const formatBalance = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
    return `R$ ${value.toFixed(2)}`;
};

export const BalanceProgressBar = ({ balance }: { balance: number }) => {
    const currentTier = tiers.find(t => balance >= t.min && balance < t.max) || tiers[tiers.length - 1];
    
    // Handle case where balance exceeds all tiers
    if (balance >= tiers[tiers.length - 1].max) {
      const finalTier = tiers[tiers.length - 1];
      return (
        <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-lg w-full">
            <finalTier.icon className={cn("h-8 w-8 shrink-0", finalTier.color)} />
            <div className="flex-1">
                <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-foreground">{formatBalance(balance)}</span>
                    <span className={finalTier.color}>RANK MÁXIMO</span>
                </div>
                <Progress value={100} className={cn("h-2", finalTier.progressBg)} />
            </div>
            <Avatar className="h-9 w-9">
                <AvatarImage src="https://i.imgur.com/kZxqYd9.png" alt="User Avatar" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
        </div>
      )
    }

    const progress = ((balance - currentTier.min) / (currentTier.max - currentTier.min)) * 100;
    const { icon: Icon, color, progressBg } = currentTier;
    
    return (
        <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-lg w-full">
            <Icon className={cn("h-8 w-8 shrink-0", color)} />
            <div className="flex-1">
                <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-foreground">{formatBalance(balance)}</span>
                    <span className="text-muted-foreground">/ {formatBalance(currentTier.max)}</span>
                </div>
                <Progress value={progress} className={cn("h-2", progressBg)} />
            </div>
            <Avatar className="h-9 w-9">
                <AvatarImage src="https://i.imgur.com/kZxqYd9.png" alt="User Avatar" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
        </div>
    );
};
