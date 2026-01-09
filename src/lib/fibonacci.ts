import { TAU } from "./constants";
import { 
  FibSquare, 
  SpiralStrategy, 
  addSpiralToPath, 
  setupSpiralContext 
} from "./spiralStrategies";

export type { FibSquare, SpiralStrategy };

type Direction = "LEFT" | "DOWN" | "RIGHT" | "UP";

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function fibUpToIndex(maxIndex: number): number[] {
  if (maxIndex < 0) return [];
  const fib: number[] = new Array(maxIndex + 1).fill(0);
  if (maxIndex >= 1) fib[1] = 1;
  for (let i = 2; i <= maxIndex; i++) fib[i] = fib[i - 1] + fib[i - 2];
  return fib;
}

function directionForStep(step: number): Direction {
  const cycle: Direction[] = ["LEFT", "DOWN", "RIGHT", "UP"];
  return cycle[(step - 1) % cycle.length]!;
}

function placeNextSquare(prev: FibSquare, nextSize: number, dir: Direction, nextFibIndex: number): FibSquare {
  let nx0 = 0;
  let ny0 = 0;

  switch (dir) {
    case "LEFT": {
      const nextTop = prev.y1;
      nx0 = prev.x0 - nextSize;
      ny0 = nextTop - nextSize;
      break;
    }
    case "DOWN": {
      const nextLeft = prev.x0;
      nx0 = nextLeft;
      ny0 = prev.y0 - nextSize;
      break;
    }
    case "RIGHT": {
      const nextBottom = prev.y0;
      nx0 = prev.x1;
      ny0 = nextBottom;
      break;
    }
    case "UP": {
      const nextRight = prev.x1;
      nx0 = nextRight - nextSize;
      ny0 = prev.y1;
      break;
    }
  }

  return {
    fibIndex: nextFibIndex,
    size: nextSize,
    x0: nx0,
    y0: ny0,
    x1: nx0 + nextSize,
    y1: ny0 + nextSize,
  };
}

function computeBounds(squares: FibSquare[]): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const s of squares) {
    if (s.x0 < minX) minX = s.x0;
    if (s.y0 < minY) minY = s.y0;
    if (s.x1 > maxX) maxX = s.x1;
    if (s.y1 > maxY) maxY = s.y1;
  }

  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return { minX, minY, maxX, maxY };
}

function worldToCanvasMapper(bounds: Bounds, canvas: HTMLCanvasElement, paddingPx: number) {
  const usableW = Math.max(1, canvas.width - 2 * paddingPx);
  const usableH = Math.max(1, canvas.height - 2 * paddingPx);

  const worldW = Math.max(1e-9, bounds.maxX - bounds.minX);
  const worldH = Math.max(1e-9, bounds.maxY - bounds.minY);

  const scale = Math.min(usableW / worldW, usableH / worldH);

  const toCanvas = (x: number, y: number) => {
    const cx = paddingPx + (x - bounds.minX) * scale;
    const cy = paddingPx + (bounds.maxY - y) * scale;
    return { cx, cy };
  };

  return { scale, toCanvas };
}

function drawSquares(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  squares: FibSquare[],
  colors: { stroke: string; fill: string; text: string; origin: string },
  paddingPx: number,
  showLabels: boolean = true
) {
  const dpr = window.devicePixelRatio || 1;
  
  // Use logical dimensions for drawing
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  const bounds = computeBounds(squares);
  
  // Custom mapper using logical dimensions
  const usableW = Math.max(1, logicalWidth - 2 * paddingPx);
  const usableH = Math.max(1, logicalHeight - 2 * paddingPx);
  const worldW = Math.max(1e-9, bounds.maxX - bounds.minX);
  const worldH = Math.max(1e-9, bounds.maxY - bounds.minY);
  const scale = Math.min(usableW / worldW, usableH / worldH);

  const toCanvas = (x: number, y: number) => {
    // Center the content
    const contentW = worldW * scale;
    const contentH = worldH * scale;
    const offsetX = paddingPx + (usableW - contentW) / 2;
    const offsetY = paddingPx + (usableH - contentH) / 2;
    
    const cx = offsetX + (x - bounds.minX) * scale;
    const cy = offsetY + (bounds.maxY - y) * scale;
    return { cx, cy };
  };

  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  // Origin marker - scale with canvas size
  {
    const { cx, cy } = toCanvas(0, 0);
    ctx.beginPath();
    ctx.fillStyle = colors.origin;
    const markerSize = Math.max(2, Math.min(4, logicalWidth / 200));
    ctx.arc(cx, cy, markerSize, 0, TAU);
    ctx.fill();
  }

  ctx.strokeStyle = colors.stroke;
  // Scale line width appropriately
  ctx.lineWidth = Math.max(1, Math.min(2, logicalWidth / 400));
  
  // Scale font size based on canvas and square size
  const baseFontSize = Math.max(8, Math.min(13, logicalWidth / 50));

  for (const s of squares) {
    const topLeft = toCanvas(s.x0, s.y1);
    const w = s.size * scale;
    const h = s.size * scale;

    // Fill
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = colors.fill;
    ctx.fillRect(topLeft.cx, topLeft.cy, w, h);

    // Stroke
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(topLeft.cx, topLeft.cy, w, h);

    // Only show labels if square is large enough
    if (showLabels && w > 35) {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.9;
      // Scale font with square size
      const fontSize = Math.max(8, Math.min(baseFontSize, w / 5));
      ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
      const label = `F${s.fibIndex}=${s.size}`;
      const labelPadding = Math.max(4, w * 0.06);
      ctx.fillText(label, topLeft.cx + labelPadding, topLeft.cy + fontSize + labelPadding);
    }
  }
  
  ctx.globalAlpha = 1.0;
}

function generateSquares(count: number, useSqrtMode: boolean = false): FibSquare[] {
  if (count <= 0) return [];
  
  const maxFibIndex = 2 * count;
  const fib = fibUpToIndex(maxFibIndex);

  const squares: FibSquare[] = [];

  const firstIndex = 2;
  const rawSize = fib[firstIndex] ?? 1;
  const firstSize = useSqrtMode ? Math.sqrt(rawSize) : rawSize;
  squares.push({
    fibIndex: firstIndex,
    size: firstSize,
    x0: 0,
    y0: 0,
    x1: firstSize,
    y1: firstSize,
  });

  for (let i = 1; i < count; i++) {
    const nextFibIndex = 2 + 2 * i;
    const rawNextSize = fib[nextFibIndex]!;
    const nextSize = useSqrtMode ? Math.sqrt(rawNextSize) : rawNextSize;
    const prev = squares[squares.length - 1]!;
    const dir = directionForStep(i);
    squares.push(placeNextSquare(prev, nextSize, dir, nextFibIndex));
  }

  return squares;
}

function interpolateBounds(from: Bounds, to: Bounds, t: number): Bounds {
  return {
    minX: from.minX + (to.minX - from.minX) * t,
    minY: from.minY + (to.minY - from.minY) * t,
    maxX: from.maxX + (to.maxX - from.maxX) * t,
    maxY: from.maxY + (to.maxY - from.maxY) * t,
  };
}

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  squares: FibSquare[],
  toCanvas: (x: number, y: number) => { cx: number; cy: number },
  scale: number,
  spiralColor: string,
  lineWidth: number,
  alpha: number = 1,
  lineThicknessMultiplier: number = 1,
  strategy: SpiralStrategy = 'quarterArc'
) {
  if (squares.length === 0) return;
  
  ctx.save();
  setupSpiralContext(ctx, spiralColor, lineWidth, alpha, lineThicknessMultiplier);
  ctx.beginPath();
  addSpiralToPath(ctx, squares, 0, squares.length, toCanvas, scale, strategy);
  ctx.stroke();
  ctx.restore();
}

// Draw only a portion of the spiral (for fade animations)
function drawSpiralPartial(
  ctx: CanvasRenderingContext2D,
  squares: FibSquare[],
  startIndex: number,
  toCanvas: (x: number, y: number) => { cx: number; cy: number },
  scale: number,
  spiralColor: string,
  lineWidth: number,
  alpha: number = 1,
  lineThicknessMultiplier: number = 1,
  strategy: SpiralStrategy = 'quarterArc'
) {
  if (squares.length === 0 || startIndex >= squares.length) return;
  
  ctx.save();
  setupSpiralContext(ctx, spiralColor, lineWidth, alpha, lineThicknessMultiplier);
  ctx.beginPath();
  addSpiralToPath(ctx, squares, startIndex, squares.length, toCanvas, scale, strategy);
  ctx.stroke();
  ctx.restore();
}

function drawSquaresAnimated(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  squares: FibSquare[],
  interpolatedBounds: Bounds,
  colors: { stroke: string; fill: string; text: string; origin: string; spiral: string },
  paddingPx: number,
  fadeInIndices: Set<number>,
  fadeOutSquares: FibSquare[],
  progress: number,
  showLabels: boolean = true,
  useSqrtMode: boolean = false,
  lineThicknessMultiplier: number = 1,
  squareStrokeMultiplier: number = 1,
  lockOrigin: boolean = true
) {
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  const usableW = Math.max(1, logicalWidth - 2 * paddingPx);
  const usableH = Math.max(1, logicalHeight - 2 * paddingPx);
  
  let worldW: number, worldH: number, scale: number;
  
  if (lockOrigin) {
    // In lock origin mode, we need to ensure origin (0,0) is centered
    // and all content is visible. Calculate the max extent from origin.
    const maxExtentX = Math.max(Math.abs(interpolatedBounds.minX), Math.abs(interpolatedBounds.maxX));
    const maxExtentY = Math.max(Math.abs(interpolatedBounds.minY), Math.abs(interpolatedBounds.maxY));
    // World spans from -maxExtent to +maxExtent in both directions
    worldW = maxExtentX * 2;
    worldH = maxExtentY * 2;
    scale = Math.min(usableW / Math.max(1e-9, worldW), usableH / Math.max(1e-9, worldH));
  } else {
    worldW = Math.max(1e-9, interpolatedBounds.maxX - interpolatedBounds.minX);
    worldH = Math.max(1e-9, interpolatedBounds.maxY - interpolatedBounds.minY);
    scale = Math.min(usableW / worldW, usableH / worldH);
  }

  const toCanvas = (x: number, y: number) => {
    if (lockOrigin) {
      // Origin (0,0) is at center of canvas
      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const cx = centerX + x * scale;
      const cy = centerY - y * scale; // Y is flipped for canvas coordinates
      return { cx, cy };
    } else {
      const contentW = worldW * scale;
      const contentH = worldH * scale;
      const offsetX = paddingPx + (usableW - contentW) / 2;
      const offsetY = paddingPx + (usableH - contentH) / 2;
      
      const cx = offsetX + (x - interpolatedBounds.minX) * scale;
      const cy = offsetY + (interpolatedBounds.maxY - y) * scale;
      return { cx, cy };
    }
  };

  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  // Origin marker
  {
    const { cx, cy } = toCanvas(0, 0);
    ctx.beginPath();
    ctx.fillStyle = colors.origin;
    const markerSize = Math.max(2, Math.min(4, logicalWidth / 200));
    ctx.arc(cx, cy, markerSize, 0, TAU);
    ctx.fill();
  }

  const baseLineWidth = Math.max(1, Math.min(2, logicalWidth / 400));
  const lineWidth = baseLineWidth * squareStrokeMultiplier;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = lineWidth;
  const baseFontSize = Math.max(8, Math.min(13, logicalWidth / 50));

  // Helper to format label based on mode
  const formatLabel = (s: FibSquare) => {
    if (useSqrtMode) {
      return `√F${s.fibIndex}`;
    }
    return `F${s.fibIndex}=${Math.round(s.size)}`;
  };

  // Draw fading out squares first
  for (const s of fadeOutSquares) {
    const topLeft = toCanvas(s.x0, s.y1);
    const w = s.size * scale;
    const h = s.size * scale;
    const fadeAlpha = 1 - progress;

    ctx.globalAlpha = 0.08 * fadeAlpha;
    ctx.fillStyle = colors.fill;
    ctx.fillRect(topLeft.cx, topLeft.cy, w, h);

    ctx.globalAlpha = fadeAlpha;
    ctx.strokeRect(topLeft.cx, topLeft.cy, w, h);

    if (showLabels && w > 35) {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.9 * fadeAlpha;
      const fontSize = Math.max(8, Math.min(baseFontSize, w / 5));
      ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
      const label = formatLabel(s);
      const labelPadding = Math.max(4, w * 0.06);
      ctx.fillText(label, topLeft.cx + labelPadding, topLeft.cy + fontSize + labelPadding);
    }
  }

  // Draw current squares
  for (let i = 0; i < squares.length; i++) {
    const s = squares[i];
    const topLeft = toCanvas(s.x0, s.y1);
    const w = s.size * scale;
    const h = s.size * scale;
    
    const isFadingIn = fadeInIndices.has(i);
    const alpha = isFadingIn ? progress : 1;

    ctx.globalAlpha = 0.08 * alpha;
    ctx.fillStyle = colors.fill;
    ctx.fillRect(topLeft.cx, topLeft.cy, w, h);

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(topLeft.cx, topLeft.cy, w, h);

    if (showLabels && w > 35) {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.9 * alpha;
      const fontSize = Math.max(8, Math.min(baseFontSize, w / 5));
      ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
      const label = formatLabel(s);
      const labelPadding = Math.max(4, w * 0.06);
      ctx.fillText(label, topLeft.cx + labelPadding, topLeft.cy + fontSize + labelPadding);
    }
  }
  
  // Draw the spiral
  // For squares that are fully visible (not fading in), draw solid spiral
  // For fading squares, draw with appropriate alpha
  
  const stableSquareCount = squares.length - fadeInIndices.size;
  
  // Draw spiral for stable squares (full alpha)
  if (stableSquareCount > 0) {
    const stableSquares = squares.slice(0, stableSquareCount);
    drawSpiral(ctx, stableSquares, toCanvas, scale, colors.spiral, baseLineWidth, 1, lineThicknessMultiplier);
  }
  
  // Draw fading in spiral arcs for new squares
  if (fadeInIndices.size > 0) {
    drawSpiralPartial(ctx, squares, stableSquareCount, toCanvas, scale, colors.spiral, baseLineWidth, progress, lineThicknessMultiplier);
  }
  
  // Draw fading out spiral arcs for squares being removed
  if (fadeOutSquares.length > 0) {
    const allSquaresForFadeOut = [...squares, ...fadeOutSquares];
    drawSpiralPartial(ctx, allSquaresForFadeOut, squares.length, toCanvas, scale, colors.spiral, baseLineWidth, 1 - progress, lineThicknessMultiplier);
  }
  
  ctx.globalAlpha = 1.0;
}

// Compute the max extent from origin for locked origin mode
function computeOriginExtent(bounds: Bounds): number {
  const maxExtentX = Math.max(Math.abs(bounds.minX), Math.abs(bounds.maxX));
  const maxExtentY = Math.max(Math.abs(bounds.minY), Math.abs(bounds.maxY));
  return Math.max(maxExtentX, maxExtentY);
}

export function drawFibonacciEvenIndexSquaresAnimated(
  canvas: HTMLCanvasElement,
  fromCount: number,
  toCount: number,
  progress: number,
  colors: { stroke: string; fill: string; text: string; origin: string; spiral: string },
  paddingPx: number = 24,
  showLabels: boolean = true,
  useSqrtMode: boolean = false,
  lineThicknessMultiplier: number = 1,
  squareStrokeMultiplier: number = 1,
  lockOrigin: boolean = true
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const fromSquares = generateSquares(Math.floor(fromCount), useSqrtMode);
  const toSquares = generateSquares(Math.floor(toCount), useSqrtMode);

  if (toSquares.length === 0 && fromSquares.length === 0) {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    return;
  }

  const fromBounds = fromSquares.length > 0 ? computeBounds(fromSquares) : { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const toBounds = toSquares.length > 0 ? computeBounds(toSquares) : { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  
  let interpolatedBounds: Bounds;
  
  if (lockOrigin) {
    // For locked origin mode, interpolate the extent from origin between start and end states only
    // This prevents erratic zooming during intermediate animation frames
    const fromExtent = computeOriginExtent(fromBounds);
    const toExtent = computeOriginExtent(toBounds);
    const interpolatedExtent = fromExtent + (toExtent - fromExtent) * progress;
    
    // Create synthetic bounds that represent this interpolated extent
    // The actual content bounds don't matter for scaling in lock origin mode,
    // only the extent from origin matters
    interpolatedBounds = {
      minX: -interpolatedExtent,
      minY: -interpolatedExtent,
      maxX: interpolatedExtent,
      maxY: interpolatedExtent,
    };
  } else {
    interpolatedBounds = interpolateBounds(fromBounds, toBounds, progress);
  }

  // Determine which squares are fading in (new ones)
  const fadeInIndices = new Set<number>();
  for (let i = fromSquares.length; i < toSquares.length; i++) {
    fadeInIndices.add(i);
  }

  // Squares that are fading out (removed ones)
  const fadeOutSquares = fromSquares.slice(toSquares.length);

  drawSquaresAnimated(
    ctx,
    canvas,
    toSquares,
    interpolatedBounds,
    colors,
    paddingPx,
    fadeInIndices,
    fadeOutSquares,
    progress,
    showLabels,
    useSqrtMode,
    lineThicknessMultiplier,
    squareStrokeMultiplier,
    lockOrigin
  );
}

export function drawFibonacciEvenIndexSquares(
  canvas: HTMLCanvasElement, 
  n: number,
  colors: { stroke: string; fill: string; text: string; origin: string; spiral: string },
  paddingPx: number = 24,
  showLabels: boolean = true,
  useSqrtMode: boolean = false,
  lineThicknessMultiplier: number = 1,
  squareStrokeMultiplier: number = 1
) {
  drawFibonacciEvenIndexSquaresAnimated(canvas, n, n, 1, colors, paddingPx, showLabels, useSqrtMode, lineThicknessMultiplier, squareStrokeMultiplier);
}
