import { useState } from "react";
import { Github } from "lucide-react";
import { FibonacciCanvas } from "@/components/FibonacciCanvas";
import { SquareSlider } from "@/components/SquareSlider";
import { SettingsMenu } from "@/components/SettingsMenu";
import { FooterSection } from "@/components/FooterSection";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [count, setCount] = useState(5);
  const { animationSpeed } = useSettings();

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-mono font-bold text-xs sm:text-sm">φ<sup>2</sup></span>
            </div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">Zeckendorf Spiral</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono hidden xs:block">
              F<sub>n</sub> = F<sub>n-1</sub> + F<sub>n-2</sub>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
            >
              <a
                href="https://github.com/pRizz/zeckendorf-spiral"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <SettingsMenu />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-3 sm:p-6 min-h-0 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-5 min-h-0">
          {/* Controls */}
          <div className="shrink-0 flex justify-center px-2">
            <SquareSlider value={count} onChange={setCount} animationSpeed={animationSpeed} />
          </div>

          {/* Canvas - takes remaining space */}
          <div className="flex-1 min-h-0 px-2 sm:px-4">
            <FibonacciCanvas count={count} />
          </div>

          {/* Info footer */}
          <div className="shrink-0 text-center text-[10px] sm:text-xs text-muted-foreground/70 py-1 space-y-0.5">
            <div className="font-mono">Even Fibonacci indices: F₂, F₄, F₆, ... F₂ₙ</div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <div className="shrink-0 px-4 pb-6">
        <FooterSection />
      </div>
    </div>
  );
};

export default Index;
