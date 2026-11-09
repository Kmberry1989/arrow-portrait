import type { Direction, PieceSpec, Point } from '../types';

export const directionVector = (direction: Direction): Point => {
  switch (direction) {
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
    case 'up': return { x: 0, y: -1 };
    case 'down': return { x: 0, y: 1 };
  }
};

export const pointSegmentDistance = (point: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
};

const orientation = (a: Point, b: Point, c: Point): number => Math.sign((b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y));

const onSegment = (a: Point, b: Point, c: Point): boolean =>
  b.x <= Math.max(a.x, c.x) && b.x >= Math.min(a.x, c.x) && b.y <= Math.max(a.y, c.y) && b.y >= Math.min(a.y, c.y);

export const segmentsIntersect = (a: Point, b: Point, c: Point, d: Point): boolean => {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && onSegment(a, c, b)) || (o2 === 0 && onSegment(a, d, b)) ||
    (o3 === 0 && onSegment(c, a, d)) || (o4 === 0 && onSegment(c, b, d));
};

const segmentDistance = (a: Point, b: Point, c: Point, d: Point): number => {
  if (segmentsIntersect(a, b, c, d)) return 0;
  return Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d), pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b));
};

export const translatePoints = (points: Point[], dx: number, dy: number): Point[] => points.map((p) => ({ x: p.x + dx, y: p.y + dy }));

export const piecesCollide = (a: PieceSpec, b: PieceSpec, offsetA: Point = { x: 0, y: 0 }): boolean => {
  const threshold = (a.width + b.width) * 0.72 + 1;
  const aPoints = translatePoints(a.points, offsetA.x, offsetA.y);
  for (let i = 0; i < aPoints.length - 1; i += 1) {
    for (let j = 0; j < b.points.length - 1; j += 1) {
      if (segmentDistance(aPoints[i], aPoints[i + 1], b.points[j], b.points[j + 1]) <= threshold) return true;
    }
  }
  return false;
};

export const canExit = (piece: PieceSpec, active: PieceSpec[], width: number, height: number): boolean => {
  const vector = directionVector(piece.direction);
  const step = 5;
  const distance = vector.x !== 0 ? width + 80 : height + 80;
  for (let travel = step; travel <= distance; travel += step) {
    const offset = { x: vector.x * travel, y: vector.y * travel };
    const shifted = translatePoints(piece.points, offset.x, offset.y);
    const outside = shifted.every((p) => p.x < -12 || p.x > width + 12 || p.y < -12 || p.y > height + 12);
    if (outside) return true;
    for (const other of active) {
      if (other.id !== piece.id && piecesCollide(piece, other, offset)) return false;
    }
  }
  return true;
};
