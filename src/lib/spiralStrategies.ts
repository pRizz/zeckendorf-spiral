import { TAU } from "./constants";

export type FibSquare = {
  fibIndex: number;
  size: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type ArcParams = {
  centerX: number;  // world coords
  centerY: number;
  radius: number;
  startAngle: number;  // world angles (before Y flip)
  endAngle: number;
  counterclockwise: boolean;
};

export type SpiralStrategy = 'quarterArc' | 'diagonal';

/**
 * Get arc parameters using the classic quarter-arc method.
 * Each arc is a quarter circle that connects outer corners of adjacent squares.
 * The spiral flows counterclockwise in world coordinates (Y up).
 * 
 * Pattern for each square (world coords, Y up):
 * - index % 4 == 0: Center at bottom-left (x0,y0), arc from bottom-right to top-left
 * - index % 4 == 1: Center at bottom-right (x1,y0), arc from top-right to bottom-left  
 * - index % 4 == 2: Center at top-right (x1,y1), arc from top-left to bottom-right
 * - index % 4 == 3: Center at top-left (x0,y1), arc from bottom-left to top-right
 */
function getQuarterArcParams(square: FibSquare, index: number): ArcParams {
  const cyclePos = index % 4;
  const { x0, y0, x1, y1, size } = square;
  
  // World coordinate angles (Y goes up):
  // 0 = right, τ/4 = up, τ/2 = left, 3τ/4 = down
  
  switch (cyclePos) {
    case 0:
      // Center at bottom-left corner
      // Arc from bottom-right (angle 0) to top-left (angle τ/4), counterclockwise
      return {
        centerX: x0,
        centerY: y0,
        radius: size,
        startAngle: 0,              // points to bottom-right
        endAngle: TAU / 4,          // points to top-left
        counterclockwise: true,
      };
    case 1:
      // Center at bottom-right corner
      // Arc from top-right (angle τ/4) to bottom-left (angle τ/2), counterclockwise
      return {
        centerX: x1,
        centerY: y0,
        radius: size,
        startAngle: TAU / 4,        // points to top-right
        endAngle: TAU / 2,          // points to bottom-left
        counterclockwise: true,
      };
    case 2:
      // Center at top-right corner
      // Arc from top-left (angle τ/2) to bottom-right (angle 3τ/4), counterclockwise
      return {
        centerX: x1,
        centerY: y1,
        radius: size,
        startAngle: TAU / 2,        // points to top-left
        endAngle: 3 / 4 * TAU,      // points to bottom-right
        counterclockwise: true,
      };
    case 3:
      // Center at top-left corner
      // Arc from bottom-left (angle 3τ/4) to top-right (angle τ), counterclockwise
      return {
        centerX: x0,
        centerY: y1,
        radius: size,
        startAngle: 3 / 4 * TAU,    // points to bottom-left
        endAngle: TAU,              // points to top-right (same as 0)
        counterclockwise: true,
      };
    default:
      return { centerX: 0, centerY: 0, radius: size, startAngle: 0, endAngle: 0, counterclockwise: true };
  }
}

/**
 * Get the arc parameters for a given square and index using the specified strategy.
 */
export function getArcParams(square: FibSquare, index: number, strategy: SpiralStrategy = 'quarterArc'): ArcParams {
  switch (strategy) {
    case 'quarterArc':
    default:
      return getQuarterArcParams(square, index);
  }
}

/**
 * Draw spiral arcs to a canvas path.
 * This is the core rendering logic shared by both full and partial spiral drawing.
 */
export function addSpiralToPath(
  ctx: CanvasRenderingContext2D,
  squares: FibSquare[],
  startIndex: number,
  endIndex: number,
  toCanvas: (x: number, y: number) => { cx: number; cy: number },
  scale: number,
  strategy: SpiralStrategy = 'quarterArc'
) {
  if (squares.length === 0 || startIndex >= squares.length) return;
  
  const effectiveEnd = Math.min(endIndex, squares.length);
  let isFirst = true;
  
  for (let i = startIndex; i < effectiveEnd; i++) {
    const square = squares[i];
    const arc = getArcParams(square, i, strategy);
    
    const center = toCanvas(arc.centerX, arc.centerY);
    const radius = arc.radius * scale;
    
    // Flip angles for canvas Y-flip
    const canvasStartAngle = -arc.startAngle;
    const canvasEndAngle = -arc.endAngle;
    
    if (isFirst) {
      const startX = center.cx + radius * Math.cos(canvasStartAngle);
      const startY = center.cy + radius * Math.sin(canvasStartAngle);
      ctx.moveTo(startX, startY);
      isFirst = false;
    }
    
    ctx.arc(center.cx, center.cy, radius, canvasStartAngle, canvasEndAngle, arc.counterclockwise);
  }
}

/**
 * Set up the canvas context for spiral drawing with consistent styling.
 */
export function setupSpiralContext(
  ctx: CanvasRenderingContext2D,
  spiralColor: string,
  lineWidth: number,
  alpha: number,
  lineThicknessMultiplier: number
) {
  ctx.strokeStyle = spiralColor;
  ctx.lineWidth = lineWidth * 2 * lineThicknessMultiplier;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha;
  
  // Add subtle glow effect
  ctx.shadowColor = spiralColor;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}
