import type { GenerationOptions, PixelSource, PieceSpec, Point, PuzzleSpec } from '../types';

const portraitPalette = ['#35d8df', '#d88b3d', '#ffc989', '#fff0c9', '#141943', '#18100d', '#d56f60'];

const mulberry32 = (seed: number) => () => {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rgbToHex = (r: number, g: number, b: number): string => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

const samplePixel = (source: PixelSource | undefined, nx: number, ny: number): string => {
  if (!source) return proceduralPortrait(nx, ny);
  const x = Math.max(0, Math.min(source.width - 1, Math.round(nx * (source.width - 1))));
  const y = Math.max(0, Math.min(source.height - 1, Math.round(ny * (source.height - 1))));
  const i = (y * source.width + x) * 4;
  const quantize = (value: number) => Math.round(value / 28) * 28;
  const lift = 1.08;
  return rgbToHex(quantize(source.pixels[i]) * lift, quantize(source.pixels[i + 1]) * lift, quantize(source.pixels[i + 2]) * lift);
};

const proceduralPortrait = (x: number, y: number): string => {
  const face = Math.pow((x - 0.5) / 0.245, 2) + Math.pow((y - 0.43) / 0.245, 2) < 1;
  const hair = Math.pow((x - 0.5) / 0.31, 2) + Math.pow((y - 0.39) / 0.34, 2) < 1 && (!face || y < 0.27 || x < 0.29 || x > 0.71);
  const eyeL = Math.pow((x - 0.415) / 0.042, 2) + Math.pow((y - 0.43) / 0.022, 2) < 1;
  const eyeR = Math.pow((x - 0.585) / 0.042, 2) + Math.pow((y - 0.43) / 0.022, 2) < 1;
  const mouth = Math.abs(y - 0.57) < 0.012 && x > 0.43 && x < 0.57;
  const body = y > 0.66 && Math.abs(x - 0.5) < 0.44 - Math.max(0, (0.74 - y) * 0.8);
  if (eyeL || eyeR) return '#14100f';
  if (mouth) return '#d56f60';
  if (face) return y < 0.32 ? '#f0af67' : '#ffc989';
  if (hair) return x < 0.5 ? '#9e5c29' : '#d88b3d';
  if (body) return Math.floor((y - 0.66) / 0.085) % 2 === 0 ? '#141943' : '#fff0c9';
  return '#35d8df';
};

const averageColors = (colors: string[]): string => {
  const rgb = colors.map((color) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)));
  return rgbToHex(...([0, 1, 2].map((channel) => rgb.reduce((sum, value) => sum + value[channel], 0) / rgb.length) as [number, number, number]));
};

const makePath = (x0: number, x1: number, y: number, band: number, random: () => number, row: number): Point[] => {
  const inset = 0.8;
  const start = x0 + inset;
  const end = x1 - inset;
  const a = start + (end - start) * (0.16 + random() * 0.15);
  const b = start + (end - start) * (0.4 + random() * 0.16);
  const c = start + (end - start) * (0.68 + random() * 0.16);
  const sign = row % 2 === 0 ? 1 : -1;
  const outer = sign * Math.max(6, band * 0.3);
  const innerA = (random() - 0.5) * band * 0.3;
  const innerB = (random() - 0.5) * band * 0.3;
  return [
    { x: start, y: y - outer }, { x: a, y: y - outer },
    { x: a, y: y + innerA }, { x: b, y: y + innerA },
    { x: b, y: y + innerB }, { x: c, y: y + innerB },
    { x: c, y: y + outer }, { x: end, y: y + outer }
  ];
};

export const generatePuzzle = (source?: PixelSource, options: Partial<GenerationOptions> = {}): PuzzleSpec => {
  const seed = options.seed ?? 8417;
  const width = options.width ?? 350;
  const height = options.height ?? 520;
  const target = options.pieceCount ?? 146;
  const random = mulberry32(seed);
  const rows = 13;
  const marginX = 5;
  const marginY = 9;
  const usableWidth = width - marginX * 2;
  const usableHeight = height - marginY * 2;
  const band = usableHeight / rows;
  const basePerRow = Math.floor(target / rows);
  let extras = target - basePerRow * rows;
  const pieces: PieceSpec[] = [];
  const solution: number[] = [];

  for (let row = 0; row < rows; row += 1) {
    const count = basePerRow + (extras-- > 0 ? 1 : 0);
    const y = marginY + band * (row + 0.5);
    const segmentWidth = usableWidth / count;
    const rowIds: number[] = [];
    for (let column = 0; column < count; column += 1) {
      const x0 = marginX + segmentWidth * column;
      const x1 = x0 + segmentWidth;
      const points = makePath(x0, x1, y, band, random, row);
      const direction = column < count / 2 ? 'left' : 'right';
      if (direction === 'left') points.reverse();
      const sampleX = ((x0 + x1) / 2) / width;
      const sampleY = y / height;
      const color = averageColors([
        samplePixel(source, sampleX, sampleY),
        samplePixel(source, Math.min(1, sampleX + 0.018), Math.min(1, sampleY + 0.012)),
        samplePixel(source, Math.max(0, sampleX - 0.018), Math.max(0, sampleY - 0.012))
      ]);
      const id = pieces.length;
      pieces.push({ id, points, color, width: 2.15, direction, solutionIndex: -1 });
      rowIds.push(id);
    }
    const order: number[] = [];
    let left = 0;
    let right = rowIds.length - 1;
    while (left <= right) {
      if (left <= right) order.push(rowIds[left++]);
      if (left <= right) order.push(rowIds[right--]);
    }
    solution.push(...order);
  }

  solution.forEach((id, index) => { pieces[id].solutionIndex = index; });
  return {
    version: 1,
    seed,
    width,
    height,
    title: 'LEVEL 01',
    subtitle: 'PORTRAIT',
    palette: source ? Array.from(new Set(pieces.map((piece) => piece.color))).slice(0, 16) : portraitPalette,
    pieces,
    solution
  };
};
