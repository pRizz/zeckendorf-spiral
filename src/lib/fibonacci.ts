type Direction = "LEFT" | "DOWN" | "RIGHT" | "UP";

type FibSquare = {
  fibIndex: number;
  size: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

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
    ctx.arc(cx, cy, markerSize, 0, Math.PI * 2);
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

function generateSquares(count: number): FibSquare[] {
  if (count <= 0) return [];
  
  const maxFibIndex = 2 * count;
  const fib = fibUpToIndex(maxFibIndex);

  const squares: FibSquare[] = [];

  const firstIndex = 2;
  const firstSize = fib[firstIndex] ?? 1;
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
    const nextSize = fib[nextFibIndex]!;
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

type ArcParams = {
  centerX: number;  // world coords
  centerY: number;
  radius: number;
  startAngle: number;  // canvas angles (after Y flip)
  endAngle: number;
  counterclockwise: boolean;
};

// Get the arc parameters for each square in the spiral
// Each arc is a quarter circle that connects outer corners of adjacent squares
// The spiral flows counterclockwise in world coordinates (Y up)
// 
// Pattern for each square (world coords, Y up):
// - index % 4 == 0: Center at bottom-left (x0,y0), arc from bottom-right to top-left
// - index % 4 == 1: Center at bottom-right (x1,y0), arc from top-right to bottom-left  
// - index % 4 == 2: Center at top-right (x1,y1), arc from top-left to bottom-right
// - index % 4 == 3: Center at top-left (x0,y1), arc from bottom-left to top-right
//
function getArcParams(square: FibSquare, index: number): ArcParams {
  const cyclePos = index % 4;
  const { x0, y0, x1, y1, size } = square;
  
  // World coordinate angles (Y goes up):
  // 0 = right, π/2 = up, π = left, 3π/2 = down
  
  switch (cyclePos) {
    case 0:
      // Center at bottom-left corner
      // Arc from bottom-right (angle 0) to top-left (angle π/2), counterclockwise
      return {
        centerX: x0,
        centerY: y0,
        radius: size,
        startAngle: 0,            // points to bottom-right
        endAngle: Math.PI / 2,    // points to top-left
        counterclockwise: true,
      };
    case 1:
      // Center at bottom-right corner
      // Arc from top-right (angle π/2) to bottom-left (angle π), counterclockwise
      return {
        centerX: x1,
        centerY: y0,
        radius: size,
        startAngle: Math.PI / 2,  // points to top-right
        endAngle: Math.PI,        // points to bottom-left
        counterclockwise: true,
      };
    case 2:
      // Center at top-right corner
      // Arc from top-left (angle π) to bottom-right (angle 3π/2), counterclockwise
      return {
        centerX: x1,
        centerY: y1,
        radius: size,
        startAngle: Math.PI,          // points to top-left
        endAngle: Math.PI * 1.5,      // points to bottom-right
        counterclockwise: true,
      };
    case 3:
      // Center at top-left corner
      // Arc from bottom-left (angle 3π/2) to top-right (angle 2π/0), counterclockwise
      return {
        centerX: x0,
        centerY: y1,
        radius: size,
        startAngle: Math.PI * 1.5,    // points to bottom-left
        endAngle: Math.PI * 2,        // points to top-right (same as 0)
        counterclockwise: true,
      };
    default:
      return { centerX: 0, centerY: 0, radius: size, startAngle: 0, endAngle: 0, counterclockwise: true };
  }
}

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  squares: FibSquare[],
  toCanvas: (x: number, y: number) => { cx: number; cy: number },
  scale: number,
  spiralColor: string,
  lineWidth: number,
  alpha: number = 1
) {
  if (squares.length === 0) return;
  
  ctx.save();
  ctx.strokeStyle = spiralColor;
  ctx.lineWidth = lineWidth * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha;
  
  // Add subtle glow effect
  ctx.shadowColor = spiralColor;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.beginPath();
  
  let isFirst = true;
  
  for (let i = 0; i < squares.length; i++) {
    const square = squares[i];
    const arc = getArcParams(square, i);
    
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
  alpha: number = 1
) {
  if (squares.length === 0 || startIndex >= squares.length) return;
  
  ctx.save();
  ctx.strokeStyle = spiralColor;
  ctx.lineWidth = lineWidth * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha;
  
  // Add subtle glow effect
  ctx.shadowColor = spiralColor;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.beginPath();
  
  let isFirst = true;
  
  for (let i = startIndex; i < squares.length; i++) {
    const square = squares[i];
    const arc = getArcParams(square, i);
    
    const center = toCanvas(arc.centerX, arc.centerY);
    const radius = arc.radius * scale;
    
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
  progress: number
) {
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  const usableW = Math.max(1, logicalWidth - 2 * paddingPx);
  const usableH = Math.max(1, logicalHeight - 2 * paddingPx);
  const worldW = Math.max(1e-9, interpolatedBounds.maxX - interpolatedBounds.minX);
  const worldH = Math.max(1e-9, interpolatedBounds.maxY - interpolatedBounds.minY);
  const scale = Math.min(usableW / worldW, usableH / worldH);

  const toCanvas = (x: number, y: number) => {
    const contentW = worldW * scale;
    const contentH = worldH * scale;
    const offsetX = paddingPx + (usableW - contentW) / 2;
    const offsetY = paddingPx + (usableH - contentH) / 2;
    
    const cx = offsetX + (x - interpolatedBounds.minX) * scale;
    const cy = offsetY + (interpolatedBounds.maxY - y) * scale;
    return { cx, cy };
  };

  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  // Origin marker
  {
    const { cx, cy } = toCanvas(0, 0);
    ctx.beginPath();
    ctx.fillStyle = colors.origin;
    const markerSize = Math.max(2, Math.min(4, logicalWidth / 200));
    ctx.arc(cx, cy, markerSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const lineWidth = Math.max(1, Math.min(2, logicalWidth / 400));
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = lineWidth;
  const baseFontSize = Math.max(8, Math.min(13, logicalWidth / 50));

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

    if (w > 35) {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.9 * fadeAlpha;
      const fontSize = Math.max(8, Math.min(baseFontSize, w / 5));
      ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
      const label = `F${s.fibIndex}=${s.size}`;
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

    if (w > 35) {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.9 * alpha;
      const fontSize = Math.max(8, Math.min(baseFontSize, w / 5));
      ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
      const label = `F${s.fibIndex}=${s.size}`;
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
    drawSpiral(ctx, stableSquares, toCanvas, scale, colors.spiral, lineWidth, 1);
  }
  
  // Draw fading in spiral arcs for new squares
  if (fadeInIndices.size > 0) {
    drawSpiralPartial(ctx, squares, stableSquareCount, toCanvas, scale, colors.spiral, lineWidth, progress);
  }
  
  // Draw fading out spiral arcs for squares being removed
  if (fadeOutSquares.length > 0) {
    const allSquaresForFadeOut = [...squares, ...fadeOutSquares];
    drawSpiralPartial(ctx, allSquaresForFadeOut, squares.length, toCanvas, scale, colors.spiral, lineWidth, 1 - progress);
  }
  
  ctx.globalAlpha = 1.0;
}

export function drawFibonacciEvenIndexSquaresAnimated(
  canvas: HTMLCanvasElement,
  fromCount: number,
  toCount: number,
  progress: number,
  colors: { stroke: string; fill: string; text: string; origin: string; spiral: string },
  paddingPx: number = 24
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const fromSquares = generateSquares(Math.floor(fromCount));
  const toSquares = generateSquares(Math.floor(toCount));

  if (toSquares.length === 0 && fromSquares.length === 0) {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    return;
  }

  const fromBounds = fromSquares.length > 0 ? computeBounds(fromSquares) : { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const toBounds = toSquares.length > 0 ? computeBounds(toSquares) : { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  
  const interpolatedBounds = interpolateBounds(fromBounds, toBounds, progress);

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
    progress
  );
}

export function drawFibonacciEvenIndexSquares(
  canvas: HTMLCanvasElement, 
  n: number,
  colors: { stroke: string; fill: string; text: string; origin: string; spiral: string },
  paddingPx: number = 24
) {
  drawFibonacciEvenIndexSquaresAnimated(canvas, n, n, 1, colors, paddingPx);
}
