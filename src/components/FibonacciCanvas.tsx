import { useEffect, useRef, useCallback } from "react";
import { drawFibonacciEvenIndexSquares } from "@/lib/fibonacci";

interface FibonacciCanvasProps {
  count: number;
}

export function FibonacciCanvas({ count }: FibonacciCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Use the actual available size
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
    
    // Get CSS custom properties for theming
    const styles = getComputedStyle(document.documentElement);
    const accent = styles.getPropertyValue('--accent-canvas').trim() || '#d4a574';
    const text = styles.getPropertyValue('--canvas-text').trim() || '#a3a3a3';
    const origin = styles.getPropertyValue('--canvas-origin').trim() || '#525252';
    
    // Adjust padding based on screen size for better mobile fit
    const padding = Math.min(24, Math.max(12, width * 0.03));
    
    drawFibonacciEvenIndexSquares(canvas, count, {
      stroke: accent,
      fill: accent,
      text: text,
      origin: origin,
    }, padding);
  }, [count]);

  useEffect(() => {
    draw();
    
    const handleResize = () => {
      requestAnimationFrame(draw);
    };
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [draw]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-xl bg-canvas border border-canvas-border overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
