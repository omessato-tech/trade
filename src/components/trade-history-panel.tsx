"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown, ArrowUp, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurrencyPair } from "./trade-sim";

export interface TradeHistoryItem {
  id: string;
  pairId: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  entryPrice: number;
  closePrice: number;
  amount: number;
  resultAmount: number;
  isWin: boolean;
}

interface TradeHistoryPanelProps {
    history: TradeHistoryItem[];
    allPairs: CurrencyPair[];
}

export function TradeHistoryPanel({ history, allPairs }: TradeHistoryPanelProps) {
    const getPairInfo = (pairId: string) => {
        return allPairs.find(p => p.id === pairId);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><History className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[450px] p-0 flex flex-col bg-[#1e222d] border-l border-border" side="left">
                <SheetHeader className="p-4 border-b border-border/50">
                    <SheetTitle>Trading History</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1">
                    <div className="p-0">
                        {history.length === 0 ? (
                            <div className="text-center text-muted-foreground p-8">No trades yet.</div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {history.map(trade => {
                                    const pair = getPairInfo(trade.pairId);
                                    if (!pair) return null;

                                    const priceWentUp = trade.closePrice > trade.entryPrice;

                                    return (
                                        <div key={trade.id} className="p-4 flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                {pair.icon ? <pair.icon className="h-7 w-7" /> : (
                                                    <div className="flex items-center text-2xl">
                                                        <span>{pair.flag1}</span>
                                                        <span className="-ml-3">{pair.flag2}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold">{pair.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {trade.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        <span className="mx-1">•</span>
                                                        {trade.timestamp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-bold",
                                                    trade.isWin ? 'text-primary' : 'text-destructive'
                                                )}>
                                                    {trade.isWin ? '+' : '-'}R$ {Math.abs(trade.resultAmount).toFixed(2)}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                                    <span>R$ {trade.amount.toFixed(2)}</span>
                                                    {priceWentUp ? (
                                                       <ArrowUp className="h-4 w-4 text-primary" />
                                                    ) : (
                                                       <ArrowDown className="h-4 w-4 text-destructive" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
