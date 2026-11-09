import { describe, expect, it } from 'vitest';
import { canExit } from './geometry';
import { generatePuzzle } from './generator';

describe('portrait puzzle generator', () => {
  it('creates a deterministic 146-piece portrait', () => {
    const first = generatePuzzle(undefined, { seed: 42 });
    const second = generatePuzzle(undefined, { seed: 42 });
    expect(first.pieces).toHaveLength(146);
    expect(first).toEqual(second);
    expect(new Set(first.pieces.map((piece) => piece.color)).size).toBeGreaterThan(4);
  });

  it('produces orthogonal line geometry with matching arrows', () => {
    const puzzle = generatePuzzle();
    puzzle.pieces.forEach((piece) => {
      piece.points.slice(1).forEach((point, index) => {
        const previous = piece.points[index];
        expect(point.x === previous.x || point.y === previous.y).toBe(true);
      });
      const tip = piece.points[piece.points.length - 1];
      const before = piece.points[piece.points.length - 2];
      if (piece.direction === 'left') expect(tip.x).toBeLessThan(before.x);
      if (piece.direction === 'right') expect(tip.x).toBeGreaterThan(before.x);
    });
  });

  it('has a collision-free canonical solution', () => {
    const puzzle = generatePuzzle(undefined, { seed: 97 });
    const remaining = new Set(puzzle.pieces.map((piece) => piece.id));
    puzzle.solution.forEach((id) => {
      const piece = puzzle.pieces[id];
      const active = puzzle.pieces.filter((candidate) => remaining.has(candidate.id));
      expect(canExit(piece, active, puzzle.width, puzzle.height), `piece ${id} should exit`).toBe(true);
      remaining.delete(id);
    });
    expect(remaining.size).toBe(0);
  });
});
