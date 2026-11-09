export type Direction = 'left' | 'right' | 'up' | 'down';

export interface Point {
  x: number;
  y: number;
}

export interface PieceSpec {
  id: number;
  points: Point[];
  color: string;
  width: number;
  direction: Direction;
  solutionIndex: number;
}

export interface PuzzleSpec {
  version: 1;
  seed: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  palette: string[];
  pieces: PieceSpec[];
  solution: number[];
  preview?: string;
}

export interface PixelSource {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

export interface GenerationOptions {
  seed: number;
  pieceCount: number;
  width: number;
  height: number;
}

export type WorkerRequest = {
  type: 'generate';
  source: PixelSource;
  options: GenerationOptions;
};

export type WorkerResponse =
  | { type: 'progress'; progress: number; label: string }
  | { type: 'complete'; puzzle: PuzzleSpec }
  | { type: 'error'; message: string };
