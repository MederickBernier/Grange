import { describe, expect, it } from 'vitest';
import { strokeBounds, strokePath, strokesToSvg, thin, type Stroke } from './strokes';

const line: Stroke = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 20, y: 10 },
];

describe('one stroke as a path', () => {
  it('has nothing to draw for no points', () => {
    expect(strokePath([])).toBe('');
  });

  it('draws a tap as a dot, since a zero-length line is invisible', () => {
    const dot = strokePath([{ x: 5, y: 7 }]);
    expect(dot).toContain('M 4.99 7');
    // Two arcs, which is a circle. A line from a point to itself renders nothing at all.
    expect(dot.match(/a /g)).toHaveLength(2);
  });

  it('starts at the first sample and ends at the last', () => {
    const path = strokePath(line);
    expect(path.startsWith('M 0 0')).toBe(true);
    expect(path.endsWith('L 20 10')).toBe(true);
  });

  it('curves through the midpoints rather than cornering at every sample', () => {
    // A pointer samples coarsely, so straight segments would make a signature look like a
    // seismograph. Each sample becomes a control point and the curve passes through the midpoint.
    expect(strokePath(line)).toBe('M 0 0 Q 10 0 15 5 L 20 10');
  });

  it('rounds to a sensible number of places', () => {
    const path = strokePath([
      { x: 1 / 3, y: 2 / 3 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
    expect(path).not.toMatch(/\d\.\d{3}/);
  });

  it('draws two samples as a straight run', () => {
    expect(strokePath([{ x: 0, y: 0 }, { x: 4, y: 4 }])).toBe('M 0 0 L 4 4');
  });
});

describe('thinning', () => {
  it('leaves a short stroke alone', () => {
    expect(thin([{ x: 0, y: 0 }])).toEqual([{ x: 0, y: 0 }]);
    expect(thin(line.slice(0, 2))).toEqual(line.slice(0, 2));
  });

  it('drops samples closer together than the tolerance', () => {
    const noisy: Stroke = [
      { x: 0, y: 0 },
      { x: 0.2, y: 0 },
      { x: 0.4, y: 0 },
      { x: 5, y: 0 },
      { x: 5.1, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(thin(noisy, 1.5)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it('always keeps the last sample, so the stroke ends where the pointer did', () => {
    const stroke: Stroke = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0 },
      { x: 0.2, y: 0 },
    ];
    const thinned = thin(stroke, 1.5);
    expect(thinned[0]).toEqual({ x: 0, y: 0 });
    expect(thinned[thinned.length - 1]).toEqual({ x: 0.2, y: 0 });
  });

  it('never grows a stroke', () => {
    expect(thin(line, 1.5).length).toBeLessThanOrEqual(line.length);
  });
});

describe('bounds', () => {
  it('says there is nothing when nothing has been drawn', () => {
    expect(strokeBounds([])).toBeNull();
    expect(strokeBounds([[], []])).toBeNull();
  });

  it('covers every stroke', () => {
    expect(strokeBounds([line, [{ x: -5, y: 30 }]])).toEqual({ x: -5, y: 0, width: 25, height: 30 });
  });

  it('gives a dot no size, which is still something drawn', () => {
    expect(strokeBounds([[{ x: 3, y: 4 }]])).toEqual({ x: 3, y: 4, width: 0, height: 0 });
  });
});

describe('the exported document', () => {
  const options = { width: 320, height: 140, strokeWidth: 2, color: '#123456' };

  it('is null until something is drawn, which is the "has it been signed" check', () => {
    expect(strokesToSvg([], options)).toBeNull();
    // Empty strokes are not a signature either.
    expect(strokesToSvg([[], []], options)).toBeNull();
  });

  it('is a standalone document, not a fragment', () => {
    const svg = strokesToSvg([line], options)!;
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    // A viewBox and a size, so it scales and also has a natural one.
    expect(svg).toContain('viewBox="0 0 320 140"');
    expect(svg).toContain('width="320" height="140"');
  });

  it('carries the ink settings on the group rather than per path', () => {
    const svg = strokesToSvg([line, line], options)!;
    expect(svg).toContain('stroke="#123456"');
    expect(svg).toContain('stroke-width="2"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg.match(/stroke="/g)).toHaveLength(1);
  });

  it('skips the empty strokes rather than writing empty paths', () => {
    const svg = strokesToSvg([line, [], line], options)!;
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg).not.toContain('d=""');
  });

  it('is text, so it can be stored, diffed and dropped into a page', () => {
    const svg = strokesToSvg([line], options)!;
    // No base64, no data URL: a caller that wants one can encode this.
    expect(svg).not.toContain('base64');
    expect(svg).toContain(strokePath(line));
  });
});
