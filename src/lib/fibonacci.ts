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

function drawSquaresAnimated(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  squares: FibSquare[],
  interpolatedBounds: Bounds,
  colors: { stroke: string; fill: string; text: string; origin: string },
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

  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = Math.max(1, Math.min(2, logicalWidth / 400));
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
  
  ctx.globalAlpha = 1.0;
}

export function drawFibonacciEvenIndexSquaresAnimated(
  canvas: HTMLCanvasElement,
  fromCount: number,
  toCount: number,
  progress: number,
  colors: { stroke: string; fill: string; text: string; origin: string },
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
  colors: { stroke: string; fill: string; text: string; origin: string },
  paddingPx: number = 24
) {
  drawFibonacciEvenIndexSquaresAnimated(canvas, n, n, 1, colors, paddingPx);
}
