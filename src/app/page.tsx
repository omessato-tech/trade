import TradeSim from "@/components/trade-sim";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-background text-foreground p-2 sm:p-4">
      <TradeSim />
    </main>
  );
}
