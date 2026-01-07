import { TAU } from "./constants";

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
    case "LEFT":
      nx0 = prev.x0 - nextSize;
      ny0 = prev.y1 - nextSize;
      break;
    case "DOWN":
      nx0 = prev.x0;
      ny0 = prev.y0 - nextSize;
      break;
    case "RIGHT":
      nx0 = prev.x1;
      ny0 = prev.y0;
      break;
    case "UP":
      nx0 = prev.x1 - nextSize;
      ny0 = prev.y1;
      break;
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

type ArcParams = {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
  endAngle: number;
};

function getArcParams(square: FibSquare, index: number): ArcParams {
  const cyclePos = index % 4;
  const { x0, y0, x1, y1, size } = square;
  
  switch (cyclePos) {
    case 0:
      return { centerX: x0, centerY: y0, radius: size, startAngle: 0, endAngle: TAU / 4 };
    case 1:
      return { centerX: x1, centerY: y0, radius: size, startAngle: TAU / 4, endAngle: TAU / 2 };
    case 2:
      return { centerX: x1, centerY: y1, radius: size, startAngle: TAU / 2, endAngle: TAU * 0.75 };
    case 3:
      return { centerX: x0, centerY: y1, radius: size, startAngle: TAU * 0.75, endAngle: TAU };
    default:
      return { centerX: 0, centerY: 0, radius: size, startAngle: 0, endAngle: 0 };
  }
}

// Convert arc to SVG arc path command
function arcToSvgPath(
  cx: number, cy: number, 
  radius: number, 
  startAngle: number, endAngle: number,
  toSvg: (x: number, y: number) => { x: number; y: number },
  scale: number,
  isFirst: boolean
): string {
  const r = radius * scale;
  
  // Calculate start and end points in world coords
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  
  // Convert to SVG coords (Y is flipped)
  const start = toSvg(startX, startY);
  const end = toSvg(endX, endY);
  
  // SVG arc: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  // large-arc = 0 (quarter circle is less than 180°)
  // sweep = 0 (counterclockwise in SVG coords, which is clockwise in world coords due to Y flip)
  const move = isFirst ? `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} ` : '';
  return `${move}A ${r.toFixed(3)} ${r.toFixed(3)} 0 0 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

export interface SvgExportOptions {
  count: number;
  useSqrtMode: boolean;
  showLabels: boolean;
  width?: number;
  height?: number;
  padding?: number;
  colors: {
    background: string;
    stroke: string;
    fill: string;
    text: string;
    origin: string;
    spiral: string;
  };
}

export function generateSvg(options: SvgExportOptions): string {
  const {
    count,
    useSqrtMode,
    showLabels,
    width = 800,
    height = 600,
    padding = 24,
    colors,
  } = options;

  const squares = generateSquares(count, useSqrtMode);
  if (squares.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${colors.background}"/>
</svg>`;
  }

  const bounds = computeBounds(squares);
  const usableW = width - 2 * padding;
  const usableH = height - 2 * padding;
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scale = Math.min(usableW / worldW, usableH / worldH);

  const contentW = worldW * scale;
  const contentH = worldH * scale;
  const offsetX = padding + (usableW - contentW) / 2;
  const offsetY = padding + (usableH - contentH) / 2;

  const toSvg = (x: number, y: number) => ({
    x: offsetX + (x - bounds.minX) * scale,
    y: offsetY + (bounds.maxY - y) * scale,
  });

  const elements: string[] = [];
  
  // Background
  elements.push(`  <rect width="${width}" height="${height}" fill="${colors.background}"/>`);

  // Origin marker
  const origin = toSvg(0, 0);
  const markerSize = Math.max(2, Math.min(4, width / 200));
  elements.push(`  <circle cx="${origin.x.toFixed(3)}" cy="${origin.y.toFixed(3)}" r="${markerSize}" fill="${colors.origin}"/>`);

  const lineWidth = Math.max(1, Math.min(2, width / 400));
  const baseFontSize = Math.max(8, Math.min(13, width / 50));

  // Draw squares
  for (const s of squares) {
    const topLeft = toSvg(s.x0, s.y1);
    const w = s.size * scale;
    const h = s.size * scale;

    // Fill with low opacity
    elements.push(`  <rect x="${topLeft.x.toFixed(3)}" y="${topLeft.y.toFixed(3)}" width="${w.toFixed(3)}" height="${h.toFixed(3)}" fill="${colors.fill}" fill-opacity="0.08" stroke="none"/>`);
    
    // Stroke
    elements.push(`  <rect x="${topLeft.x.toFixed(3)}" y="${topLeft.y.toFixed(3)}" width="${w.toFixed(3)}" height="${h.toFixed(3)}" fill="none" stroke="${colors.stroke}" stroke-width="${lineWidth}"/>`);

    // Label
    if (showLabels && w > 35) {
      const fontSize = Math.max(8, Math.min(baseFontSize, w / 5));
      const labelPadding = Math.max(4, w * 0.06);
      const label = useSqrtMode ? `√F${s.fibIndex}` : `F${s.fibIndex}=${Math.round(s.size)}`;
      elements.push(`  <text x="${(topLeft.x + labelPadding).toFixed(3)}" y="${(topLeft.y + fontSize + labelPadding).toFixed(3)}" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="${fontSize}" font-weight="600" fill="${colors.text}" fill-opacity="0.9">${label}</text>`);
    }
  }

  // Draw spiral
  const spiralPaths: string[] = [];
  for (let i = 0; i < squares.length; i++) {
    const square = squares[i];
    const arc = getArcParams(square, i);
    spiralPaths.push(arcToSvgPath(arc.centerX, arc.centerY, arc.radius, arc.startAngle, arc.endAngle, toSvg, scale, i === 0));
  }
  
  const spiralLineWidth = lineWidth * 2;
  // Add glow effect with filter
  elements.push(`  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`);
  elements.push(`  <path d="${spiralPaths.join(' ')}" fill="none" stroke="${colors.spiral}" stroke-width="${spiralLineWidth}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${elements.join('\n')}
</svg>`;
}
