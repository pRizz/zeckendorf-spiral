import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { drawFibonacciEvenIndexSquaresAnimated } from "@/lib/fibonacci";
import { useSettings } from "@/contexts/SettingsContext";

interface FibonacciCanvasProps {
  count: number;
}

export interface FibonacciCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const FibonacciCanvas = forwardRef<FibonacciCanvasRef, FibonacciCanvasProps>(
  function FibonacciCanvas({ count }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const prevCountRef = useRef<number>(count);
  const { showLabels, useSqrtMode, theme, lineThicknessMultiplier, squareStrokeMultiplier, lockOrigin, spiralStrategy } = useSettings();

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  const getColors = useCallback(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      stroke: styles.getPropertyValue('--accent-canvas').trim() || '#d4a574',
      fill: styles.getPropertyValue('--accent-canvas').trim() || '#d4a574',
      text: styles.getPropertyValue('--canvas-text').trim() || '#a3a3a3',
      origin: styles.getPropertyValue('--canvas-origin').trim() || '#525252',
      spiral: styles.getPropertyValue('--spiral-color').trim() || '#e8c49a',
    };
  }, []);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    return { width, ctx };
  }, []);

  const draw = useCallback((currentCount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const result = setupCanvas();
    if (!result) return;
    
    const { width } = result;
    const colors = getColors();
    const padding = Math.min(24, Math.max(12, width * 0.03));
    
    // Use floor for the "from" state and ceil for "to" state
    // Progress is the fractional part
    const floorCount = Math.floor(currentCount);
    const ceilCount = Math.ceil(currentCount);
    const progress = currentCount - floorCount;
    
    // If it's a whole number, just draw that state
    if (floorCount === ceilCount || progress === 0) {
      drawFibonacciEvenIndexSquaresAnimated(canvas, floorCount, floorCount, 1, colors, padding, showLabels, useSqrtMode, lineThicknessMultiplier, squareStrokeMultiplier, lockOrigin, spiralStrategy);
    } else {
      // Animate between floor and ceil
      drawFibonacciEvenIndexSquaresAnimated(canvas, floorCount, ceilCount, progress, colors, padding, showLabels, useSqrtMode, lineThicknessMultiplier, squareStrokeMultiplier, lockOrigin, spiralStrategy);
    }
  }, [setupCanvas, getColors, showLabels, useSqrtMode, lineThicknessMultiplier, squareStrokeMultiplier, lockOrigin, spiralStrategy]);

  // Handle count changes - direct draw for smooth animation from slider
  useEffect(() => {
    // Cancel any pending internal animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    const prevCount = prevCountRef.current;
    const currentCount = count;
    
    // Check if this is a discrete step (user clicking slider) vs continuous animation
    const isDiscreteStep = Number.isInteger(currentCount) && 
                           Number.isInteger(prevCount) && 
                           Math.abs(currentCount - prevCount) === 1;
    
    if (isDiscreteStep) {
      // Animate the discrete step
      const duration = 300;
      const startTime = performance.now();
      const from = prevCount;
      const to = currentCount;
      
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const result = setupCanvas();
        if (!result) return;
        
        const { width } = result;
        const colors = getColors();
        const padding = Math.min(24, Math.max(12, width * 0.03));
        
        drawFibonacciEvenIndexSquaresAnimated(canvas, from, to, eased, colors, padding, showLabels, useSqrtMode, lineThicknessMultiplier, squareStrokeMultiplier, lockOrigin, spiralStrategy);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(tick);
        }
      };
      
      animationRef.current = requestAnimationFrame(tick);
    } else {
      // Continuous update from slider animation - draw directly
      draw(currentCount);
    }
    
    prevCountRef.current = currentCount;
  }, [count, draw, setupCanvas, getColors, showLabels, useSqrtMode, lineThicknessMultiplier, squareStrokeMultiplier, lockOrigin, spiralStrategy]);

  // Redraw when settings change
  useEffect(() => {
    draw(count);
  }, [showLabels, useSqrtMode, theme, lineThicknessMultiplier, squareStrokeMultiplier, lockOrigin, spiralStrategy, draw, count]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      draw(count);
    };
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [count, draw]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-xl bg-canvas border border-canvas-border overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
});
