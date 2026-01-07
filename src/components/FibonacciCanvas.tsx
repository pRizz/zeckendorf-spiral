import { useEffect, useRef, useCallback } from "react";
import { drawFibonacciEvenIndexSquaresAnimated } from "@/lib/fibonacci";

interface FibonacciCanvasProps {
  count: number;
}

export function FibonacciCanvas({ count }: FibonacciCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const prevCountRef = useRef<number>(count);

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

  const animate = useCallback((fromCount: number, toCount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const result = setupCanvas();
    if (!result) return;
    
    const { width } = result;
    const colors = getColors();
    const padding = Math.min(24, Math.max(12, width * 0.03));
    
    const duration = 400; // ms
    const startTime = performance.now();
    
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      
      drawFibonacciEvenIndexSquaresAnimated(
        canvas,
        fromCount,
        toCount,
        eased,
        colors,
        padding
      );
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(tick);
  }, [setupCanvas, getColors]);

  // Handle count changes with animation
  useEffect(() => {
    const prevCount = prevCountRef.current;
    
    if (prevCount !== count) {
      animate(prevCount, count);
      prevCountRef.current = count;
    } else {
      // Initial draw or resize
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const result = setupCanvas();
      if (!result) return;
      
      const { width } = result;
      const colors = getColors();
      const padding = Math.min(24, Math.max(12, width * 0.03));
      
      drawFibonacciEvenIndexSquaresAnimated(canvas, count, count, 1, colors, padding);
    }
  }, [count, animate, setupCanvas, getColors]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const result = setupCanvas();
      if (!result) return;
      
      const { width } = result;
      const colors = getColors();
      const padding = Math.min(24, Math.max(12, width * 0.03));
      
      drawFibonacciEvenIndexSquaresAnimated(canvas, count, count, 1, colors, padding);
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
  }, [count, setupCanvas, getColors]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-xl bg-canvas border border-canvas-border overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
