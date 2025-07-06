"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, CandlestickChart, CircleDollarSign as ForexIcon, Bitcoin as CryptoIcon } from 'lucide-react';
import type { CurrencyPair } from './trade-sim';
import { ScrollArea } from './ui/scroll-area';

interface AssetSelectorProps {
    allPairs: CurrencyPair[];
    openPairs: string[];
    onSelectPair: (pairId: string) => void;
    onClose: () => void;
}

export const AssetSelector = ({ allPairs, openPairs, onSelectPair, onClose }: AssetSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Trending');

  const handleSelect = (pair: CurrencyPair) => {
    onSelectPair(pair.id);
    onClose();
  };

  const categories = ['Trending', 'Forex', 'Crypto'];
  
  const filteredPairs = (category: string) => {
    return allPairs
      .filter(p => {
        if (category === 'Trending') return true;
        return p.category === category;
      })
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
        case 'Trending': return <TrendingUp className="h-5 w-5" />;
        case 'Forex': return <ForexIcon className="h-5 w-5" />;
        case 'Crypto': return <CryptoIcon className="h-5 w-5" />;
        default: return <CandlestickChart className="h-5 w-5" />;
    }
  }

  return (
    <div className="flex h-[70vh] max-h-[70vh] bg-card text-card-foreground rounded-lg border overflow-hidden">
      <Tabs defaultValue="Trending" orientation="vertical" className="flex-none border-r border-border" onValueChange={setActiveTab}>
        <TabsList className="flex flex-col h-full bg-transparent p-2 gap-1 items-start">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none text-sm">
              {getCategoryIcon(cat)}
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or ticker"
            className="pl-10 bg-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <ScrollArea className="flex-1">
            <AssetTable pairs={filteredPairs(activeTab)} openPairs={openPairs} onSelect={handleSelect} />
        </ScrollArea>
      </div>
    </div>
  );
};

const AssetTable = ({ pairs, openPairs, onSelect }: { pairs: CurrencyPair[], openPairs: string[], onSelect: (pair: CurrencyPair) => void }) => {
    if (pairs.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No assets found.</div>
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-muted-foreground">Asset</TableHead>
                    <TableHead className="text-right text-muted-foreground">Price</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pairs.map(pair => {
                    const isAdded = openPairs.includes(pair.id);
                    return (
                        <TableRow 
                            key={pair.id} 
                            onClick={() => !isAdded && onSelect(pair)}
                            className={cn("cursor-pointer hover:bg-muted/50", isAdded && "opacity-50 cursor-not-allowed")}
                        >
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    {pair.icon ? <pair.icon className="h-7 w-7" /> : (
                                        <div className="flex items-center text-2xl">
                                            <span>{pair.flag1}</span>
                                            <span className="-ml-3">{pair.flag2}</span>
                                        </div>
                                    )}
                                    <span className="font-semibold text-base">{pair.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-base">
                                {pair.basePrice.toFixed(pair.precision)}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
