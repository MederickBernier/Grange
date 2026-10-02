import { describe, expect, it } from 'vitest';
import { pieceInsets, slider, stopPositions, trackPieces } from './specs';

describe('trackPieces', () => {
  it('splits a single handle into a filled run and an empty one', () => {
    expect(trackPieces([0.3])).toEqual([
      { from: 0, to: 0.3, active: true },
      { from: 0.3, to: 1, active: false },
    ]);
  });

  it('fills only between the handles of a range', () => {
    expect(trackPieces([0.25, 0.75])).toEqual([
      { from: 0, to: 0.25, active: false },
      { from: 0.25, to: 0.75, active: true },
      { from: 0.75, to: 1, active: false },
    ]);
  });

  it('does not care which order the handles arrive in', () => {
    expect(trackPieces([0.75, 0.25])).toEqual(trackPieces([0.25, 0.75]));
  });

  it('covers the whole track with no gaps or overlaps', () => {
    for (const positions of [[0.3], [0.25, 0.75], [0, 1], [0.5, 0.5]]) {
      const pieces = trackPieces(positions);
      expect(pieces[0]!.from).toBe(0);
      expect(pieces.at(-1)!.to).toBe(1);
      for (let i = 1; i < pieces.length; i += 1) {
        expect(pieces[i]!.from).toBe(pieces[i - 1]!.to);
      }
    }
  });

  it('falls back to one empty run with no handles at all', () => {
    expect(trackPieces([])).toEqual([{ from: 0, to: 1, active: false }]);
  });
});

describe('pieceInsets', () => {
  const clearance = slider.handleGap + slider.handleWidth / 2;

  it('pulls a run back from the handle it meets, by the gap plus half the handle', () => {
    const [filled, empty] = trackPieces([0.4]);
    expect(pieceInsets(filled!, [0.4], slider.handleWidth)).toEqual({ start: 0, end: clearance });
    expect(pieceInsets(empty!, [0.4], slider.handleWidth)).toEqual({ start: clearance, end: 0 });
  });

  it('never pulls back at the ends of the track, which have no handle', () => {
    const pieces = trackPieces([0.25, 0.75]);
    expect(pieceInsets(pieces[0]!, [0.25, 0.75], slider.handleWidth).start).toBe(0);
    expect(pieceInsets(pieces.at(-1)!, [0.25, 0.75], slider.handleWidth).end).toBe(0);
  });

  it('pulls the filled range back at both ends', () => {
    const middle = trackPieces([0.25, 0.75])[1]!;
    expect(pieceInsets(middle, [0.25, 0.75], slider.handleWidth)).toEqual({
      start: clearance,
      end: clearance,
    });
  });

  it('follows the handle as it narrows, so the gap stays the token 6px', () => {
    const [filled] = trackPieces([0.4]);
    const narrow = pieceInsets(filled!, [0.4], slider.handleWidthActive);
    expect(narrow.end).toBe(slider.handleGap + slider.handleWidthActive / 2);
    expect(narrow.end).toBeLessThan(clearance);
  });

  it('leaves a handle sitting at either end with no pull-back on the outside', () => {
    const atZero = trackPieces([0]);
    expect(pieceInsets(atZero[0]!, [0], slider.handleWidth).start).toBe(0);
    const atOne = trackPieces([1]);
    expect(pieceInsets(atOne.at(-1)!, [1], slider.handleWidth).end).toBe(0);
  });
});

describe('stopPositions', () => {
  it('puts a stop at every step, both ends included', () => {
    expect(stopPositions(0, 100, 25)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('works off a range that does not start at zero', () => {
    expect(stopPositions(10, 20, 5)).toEqual([0, 0.5, 1]);
  });

  it('gives nothing for a continuous slider', () => {
    expect(stopPositions(0, 100, 0)).toEqual([]);
  });

  it('gives nothing for an empty or inverted range', () => {
    expect(stopPositions(5, 5, 1)).toEqual([]);
    expect(stopPositions(10, 0, 1)).toEqual([]);
  });

  it('refuses to draw hundreds of dots for a tiny step', () => {
    expect(stopPositions(0, 100, 0.1)).toEqual([]);
    expect(stopPositions(0, 100, 1)).toHaveLength(101);
  });

  it('keeps every stop within the track', () => {
    for (const at of stopPositions(0, 100, 10)) {
      expect(at).toBeGreaterThanOrEqual(0);
      expect(at).toBeLessThanOrEqual(1);
    }
  });
});
