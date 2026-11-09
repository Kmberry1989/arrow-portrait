import { useCallback, useEffect, useRef, useState } from 'react';
import { directionVector, pointSegmentDistance } from '../game/geometry';
import type { PieceSpec, Point, PuzzleSpec } from '../types';

interface FlyingPiece { id: number; progress: number }

interface GameCanvasProps {
  puzzle: PuzzleSpec;
  removed: Set<number>;
  flying?: FlyingPiece;
  blockedId?: number;
  hintId?: number;
  onPiecePress: (piece: PieceSpec) => void;
}

const drawPath = (
  context: CanvasRenderingContext2D,
  piece: PieceSpec,
  offset: Point,
  emphasis: 'normal' | 'hint' | 'blocked',
  portraitPattern?: CanvasPattern
) => {
  const points = piece.points;
  context.save();
  context.translate(offset.x, offset.y);
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  const highlight = emphasis === 'blocked' ? '#ff746c' : emphasis === 'hint' ? '#ffffff' : undefined;
  context.strokeStyle = piece.color;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.globalAlpha = 0.12;
  context.lineWidth = piece.width + 7;
  context.shadowColor = highlight ?? piece.color;
  context.shadowBlur = 10;
  context.stroke();
  context.globalAlpha = 1;
  context.strokeStyle = highlight ?? portraitPattern ?? piece.color;
  context.lineWidth = piece.width + (emphasis === 'hint' ? 1.2 : emphasis === 'blocked' ? 0.8 : 0);
  context.shadowColor = highlight ?? piece.color;
  context.shadowBlur = emphasis === 'normal' ? 4 : 10;
  context.stroke();

  const tip = points[points.length - 1];
  const vector = directionVector(piece.direction);
  const perpendicular = { x: -vector.y, y: vector.x };
  const length = 4.2;
  const width = 2.7;
  context.beginPath();
  context.moveTo(tip.x + vector.x * 1.5, tip.y + vector.y * 1.5);
  context.lineTo(tip.x - vector.x * length + perpendicular.x * width, tip.y - vector.y * length + perpendicular.y * width);
  context.lineTo(tip.x - vector.x * length - perpendicular.x * width, tip.y - vector.y * length - perpendicular.y * width);
  context.closePath();
  context.fillStyle = context.strokeStyle;
  context.fill();
  context.restore();
};

export function GameCanvas({ puzzle, removed, flying, blockedId, hintId, onPiecePress }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [portraitImage, setPortraitImage] = useState<HTMLImageElement>();

  useEffect(() => {
    if (!puzzle.preview) {
      setPortraitImage(undefined);
      return;
    }
    const image = new Image();
    image.onload = () => setPortraitImage(image);
    image.src = puzzle.preview;
    return () => { image.onload = null; };
  }, [puzzle.preview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = puzzle.width * ratio;
    canvas.height = puzzle.height * ratio;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, puzzle.width, puzzle.height);
    const portraitPattern = portraitImage ? context.createPattern(portraitImage, 'no-repeat') ?? undefined : undefined;

    puzzle.pieces.forEach((piece) => {
      if (removed.has(piece.id) || flying?.id === piece.id) return;
      drawPath(context, piece, { x: 0, y: 0 }, blockedId === piece.id ? 'blocked' : hintId === piece.id ? 'hint' : 'normal', portraitPattern);
    });
    if (flying) {
      const piece = puzzle.pieces[flying.id];
      const vector = directionVector(piece.direction);
      const eased = 1 - Math.pow(1 - flying.progress, 3);
      const distance = (vector.x !== 0 ? puzzle.width : puzzle.height) + 100;
      drawPath(context, piece, { x: vector.x * distance * eased, y: vector.y * distance * eased }, 'normal', portraitPattern);
    }
  }, [puzzle, removed, flying, blockedId, hintId, portraitImage]);

  const handlePointer = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || flying) return;
    const bounds = canvas.getBoundingClientRect();
    const point = {
      x: (event.clientX - bounds.left) * puzzle.width / bounds.width,
      y: (event.clientY - bounds.top) * puzzle.height / bounds.height
    };
    let selected: PieceSpec | undefined;
    let closest = 11;
    for (const piece of puzzle.pieces) {
      if (removed.has(piece.id)) continue;
      for (let index = 0; index < piece.points.length - 1; index += 1) {
        const distance = pointSegmentDistance(point, piece.points[index], piece.points[index + 1]);
        if (distance < closest) {
          selected = piece;
          closest = distance;
        }
      }
    }
    if (selected) onPiecePress(selected);
  }, [flying, onPiecePress, puzzle, removed]);

  return <canvas ref={canvasRef} className="game-canvas" onPointerDown={handlePointer} aria-label="Portrait arrow puzzle" />;
}
