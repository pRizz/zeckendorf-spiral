import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SquareSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  animationSpeed?: number;
}

// Solve cubic bezier for parameter u given x-coordinate t, with Newton + bisection fallback
function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number, t: number): number {
  // Clamp input
  t = Math.min(1, Math.max(0, t));

  // Coefficients for x(u) and y(u) where P0=(0,0), P3=(1,1)
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const sampleDX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;

  // Solve x(u)=t for u using Newton-Raphson
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleX(u) - t;
    if (Math.abs(x) < 1e-7) return sampleY(u);
    const d = sampleDX(u);
    if (Math.abs(d) < 1e-7) break;
    u -= x / d;
    if (u < 0) u = 0;
    else if (u > 1) u = 1;
  }

  // Fallback: bisection
  let lo = 0, hi = 1;
  u = t;
  for (let i = 0; i < 20; i++) {
    const x = sampleX(u);
    if (Math.abs(x - t) < 1e-7) break;
    if (x < t) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }

  return sampleY(u);
}

export function SquareSlider({ value, onChange, min = 1, max = 10, animationSpeed = 1 }: SquareSliderProps) {
  const [animatingDirection, setAnimatingDirection] = useState<'forward' | 'backward' | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);
  const targetValueRef = useRef<number>(0);

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAnimatingDirection(null);
  };

  const animateTo = (target: number, direction: 'forward' | 'backward') => {
    if (animatingDirection) {
      stopAnimation();
      return; // If already animating, just stop
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
    setAnimatingDirection(direction);

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
        setAnimatingDirection(null);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  const handlePlayForward = () => {
    if (animatingDirection === 'forward') {
      stopAnimation();
    } else {
      animateTo(max, 'forward');
    }
  };

  const handlePlayBackward = () => {
    if (animatingDirection === 'backward') {
      stopAnimation();
    } else {
      animateTo(min, 'backward');
    }
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
      setAnimatingDirection(null);
    }
    onChange(val);
  };

  const isAnimatingBackward = animatingDirection === 'backward';
  const isAnimatingForward = animatingDirection === 'forward';

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
        {/* Play/Stop backward button (to min) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayBackward}
          disabled={!isAnimatingBackward && value <= min}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-accent-foreground hover:bg-accent/20 disabled:opacity-30"
          aria-label={isAnimatingBackward ? "Stop animation" : "Animate to minimum"}
        >
          {isAnimatingBackward ? (
            <Square className="h-3 w-3 fill-current" />
          ) : (
            <Play className="h-4 w-4 rotate-180" />
          )}
        </Button>
        
        <Slider
          value={[Math.round(value)]}
          onValueChange={([val]) => handleSliderChange(val)}
          min={min}
          max={max}
          step={1}
          className="flex-1"
        />
        
        {/* Play/Stop forward button (to max) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayForward}
          disabled={!isAnimatingForward && value >= max}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-accent-foreground hover:bg-accent/20 disabled:opacity-30"
          aria-label={isAnimatingForward ? "Stop animation" : "Animate to maximum"}
        >
          {isAnimatingForward ? (
            <Square className="h-3 w-3 fill-current" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground/60 font-mono px-11">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
