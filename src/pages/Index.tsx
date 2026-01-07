import { useState } from "react";
import { FibonacciCanvas } from "@/components/FibonacciCanvas";
import { SquareSlider } from "@/components/SquareSlider";

const Index = () => {
  const [count, setCount] = useState(5);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-mono font-bold text-sm">φ</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Fibonacci Squares</h1>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            F<sub>n</sub> = F<sub>n-1</sub> + F<sub>n-2</sub>
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-6">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
          {/* Controls */}
          <div className="flex justify-center">
            <SquareSlider value={count} onChange={setCount} />
          </div>

          {/* Canvas */}
          <div className="flex-1 min-h-0">
            <FibonacciCanvas count={count} />
          </div>

          {/* Info footer */}
          <div className="text-center text-xs text-muted-foreground/70 font-mono">
            Showing squares for even Fibonacci indices: F₂, F₄, F₆, ... F₂ₙ
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
