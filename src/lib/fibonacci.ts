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
  opts?: { paddingPx?: number; showLabels?: boolean }
) {
  const paddingPx = opts?.paddingPx ?? 20;
  const showLabels = opts?.showLabels ?? true;

  const bounds = computeBounds(squares);
  const { scale, toCanvas } = worldToCanvasMapper(bounds, canvas, paddingPx);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Origin marker
  {
    const { cx, cy } = toCanvas(0, 0);
    ctx.beginPath();
    ctx.fillStyle = colors.origin;
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = Math.max(1.5, 2 * (canvas.width / 800));
  ctx.font = `600 ${Math.max(11, 13)}px "JetBrains Mono", ui-monospace, monospace`;

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

    if (showLabels && w > 40) {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.9;
      const label = `F${s.fibIndex} = ${s.size}`;
      ctx.fillText(label, topLeft.cx + 8, topLeft.cy + 20);
    }
  }
  
  ctx.globalAlpha = 1.0;
}

export function drawFibonacciEvenIndexSquares(
  canvas: HTMLCanvasElement, 
  n: number,
  colors: { stroke: string; fill: string; text: string; origin: string }
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const count = Math.max(0, Math.floor(n));
  if (count === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

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

  drawSquares(ctx, canvas, squares, colors, { paddingPx: 32, showLabels: true });
}
