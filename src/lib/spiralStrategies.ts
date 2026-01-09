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

export type SpiralStrategy = 'quarterArc' | 'bezier';

// Magic number for approximating a quarter circle with a cubic Bézier curve
// k = 4/3 * (√2 - 1) ≈ 0.5522847498
const BEZIER_QUARTER_CIRCLE_K = 4 / 3 * (Math.sqrt(2) - 1);

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
      return {
        centerX: x0,
        centerY: y0,
        radius: size,
        startAngle: 0,
        endAngle: TAU / 4,
        counterclockwise: true,
      };
    case 1:
      return {
        centerX: x1,
        centerY: y0,
        radius: size,
        startAngle: TAU / 4,
        endAngle: TAU / 2,
        counterclockwise: true,
      };
    case 2:
      return {
        centerX: x1,
        centerY: y1,
        radius: size,
        startAngle: TAU / 2,
        endAngle: 3 / 4 * TAU,
        counterclockwise: true,
      };
    case 3:
      return {
        centerX: x0,
        centerY: y1,
        radius: size,
        startAngle: 3 / 4 * TAU,
        endAngle: TAU,
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
    case 'bezier':
    default:
      // Both strategies use the same arc params, they differ in rendering
      return getQuarterArcParams(square, index);
  }
}

/**
 * Draw a quarter circle arc using a cubic Bézier curve approximation.
 * This provides a slightly different visual character than the native arc.
 */
function drawBezierArc(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  isFirst: boolean
) {
  // Calculate start and end points
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  
  // Calculate control points for cubic Bézier approximation of quarter circle
  // Control points are perpendicular to the radius at start/end, at distance k*radius
  const k = BEZIER_QUARTER_CIRCLE_K;
  
  // For counterclockwise quarter arc (negative angle direction in canvas coords)
  // Control point 1 is perpendicular to start radius, in the direction of the arc
  const cp1X = startX + k * radius * Math.cos(startAngle - TAU / 4);
  const cp1Y = startY + k * radius * Math.sin(startAngle - TAU / 4);
  
  // Control point 2 is perpendicular to end radius, opposite direction
  const cp2X = endX + k * radius * Math.cos(endAngle + TAU / 4);
  const cp2Y = endY + k * radius * Math.sin(endAngle + TAU / 4);
  
  if (isFirst) {
    ctx.moveTo(startX, startY);
  }
  
  ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
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
    
    if (strategy === 'bezier') {
      drawBezierArc(ctx, center.cx, center.cy, radius, canvasStartAngle, canvasEndAngle, isFirst);
    } else {
      // Quarter arc (native canvas arc)
      if (isFirst) {
        const startX = center.cx + radius * Math.cos(canvasStartAngle);
        const startY = center.cy + radius * Math.sin(canvasStartAngle);
        ctx.moveTo(startX, startY);
      }
      ctx.arc(center.cx, center.cy, radius, canvasStartAngle, canvasEndAngle, arc.counterclockwise);
    }
    
    isFirst = false;
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
