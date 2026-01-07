import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SquareSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  animationSpeed?: number;
}

// Attempt to solve cubic bezier at time t using Newton's method
function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number, t: number): number {
  // Calculate the polynomial coefficients
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  
  // Solve for x given t using Newton-Raphson
  let x = t;
  for (let i = 0; i < 8; i++) {
    const xCalc = ((ax * x + bx) * x + cx) * x - t;
    if (Math.abs(xCalc) < 1e-6) break;
    const d = (3 * ax * x + 2 * bx) * x + cx;
    if (Math.abs(d) < 1e-6) break;
    x -= xCalc / d;
  }
  
  // Return y value
  return ((ay * x + by) * x + cy) * x;
}

export function SquareSlider({ value, onChange, min = 1, max = 10, animationSpeed = 1 }: SquareSliderProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);
  const targetValueRef = useRef<number>(0);

  const animateTo = (target: number) => {
    if (isAnimating) {
      // Cancel current animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    const start = value;
    const distance = Math.abs(target - start);
    
    if (distance === 0) return;

    // Duration scales with distance: base ~1800ms per step, adjusted by speed
    const baseDuration = 1800 / animationSpeed;
    const duration = distance * baseDuration;
    
    startValueRef.current = start;
    targetValueRef.current = target;
    startTimeRef.current = performance.now();
    setIsAnimating(true);

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Custom cubic-bezier(0.25, 0, 0.75, 1) easing
      const eased = cubicBezier(0.25, 0, 0.75, 1, progress);
      
      const currentValue = startValueRef.current + (targetValueRef.current - startValueRef.current) * eased;
      
      // Round to nearest integer for the slider, but pass fractional for smooth canvas
      onChange(Math.round(currentValue * 100) / 100);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        onChange(target);
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  const playForward = () => {
    animateTo(max);
  };

  const playBackward = () => {
    animateTo(min);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Stop animation if user manually changes slider
  const handleSliderChange = (val: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      setIsAnimating(false);
    }
    onChange(val);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          Number of Squares
        </label>
        <span className="text-2xl font-bold text-accent-foreground tabular-nums">
          {Math.round(value)}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Play backward button (to min) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={playBackward}
          disabled={value <= min}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-accent-foreground hover:bg-accent/20 disabled:opacity-30"
          aria-label="Animate to minimum"
        >
          <Play className="h-4 w-4 rotate-180" />
        </Button>
        
        <Slider
          value={[Math.round(value)]}
          onValueChange={([val]) => handleSliderChange(val)}
          min={min}
          max={max}
          step={1}
          className="flex-1"
        />
        
        {/* Play forward button (to max) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={playForward}
          disabled={value >= max}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-accent-foreground hover:bg-accent/20 disabled:opacity-30"
          aria-label="Animate to maximum"
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground/60 font-mono px-11">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
