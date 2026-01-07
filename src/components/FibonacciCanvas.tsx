import { useEffect, useRef } from "react";
import { drawFibonacciEvenIndexSquares } from "@/lib/fibonacci";

interface FibonacciCanvasProps {
  count: number;
}

export function FibonacciCanvas({ count }: FibonacciCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      // Get CSS custom properties for theming
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--accent-canvas').trim() || '#d4a574';
      const text = styles.getPropertyValue('--canvas-text').trim() || '#a3a3a3';
      const origin = styles.getPropertyValue('--canvas-origin').trim() || '#525252';
      
      drawFibonacciEvenIndexSquares(canvas, count, {
        stroke: accent,
        fill: accent,
        text: text,
        origin: origin,
      });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [count]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] rounded-xl bg-canvas border border-canvas-border overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
