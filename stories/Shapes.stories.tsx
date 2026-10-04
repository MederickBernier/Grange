import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FilledButton,
  LoadingIndicator,
  Slider,
  bounds,
  circle,
  flatten,
  normalized,
  polylinePath,
  rectangle,
  regularRoundedPolygon,
  shape,
  shapeNames,
  shapePath,
  star,
  type ShapeName,
} from '../src';

/**
 * The M3 Expressive shape library, all 35 of it.
 *
 * The token file only ever listed their names, because they are not token values: they are
 * `RoundedPolygon`s in androidx.graphics.shapes, built from a vertex list with a radius and a
 * smoothing per corner. `pnpm capture-shapes` reads the definitions out of MaterialShapes.kt and
 * `src/shapes` is the port that turns one into curves.
 */
const meta: Meta = {
  title: 'Foundations/Shapes',
  parameters: { layout: 'padded' },
};
export default meta;

const SIZE = 88;

/** Slider reports a range as an array; these are all single-value sliders. */
const single = (value: number | number[]) => (Array.isArray(value) ? value[0]! : value);

function Tile({ name, size = SIZE }: { name: ShapeName; size?: number }) {
  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={name}>
        <path d={shapePath(shape(name), { size })} fill="var(--md-sys-color-primary)" />
      </svg>
      <figcaption className="sb-label" style={{ fontSize: 11 }}>
        {name}
      </figcaption>
    </figure>
  );
}

/** Every shape in the library, each one normalised into its own square. */
export const Library: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 20 }}>
      {shapeNames.map((name) => (
        <Tile key={name} name={name} />
      ))}
    </div>
  ),
};

/**
 * Corner rounding, and what smoothing does to it.
 *
 * A radius alone cuts the corner back and bridges it with an arc. Smoothing trades part of that
 * arc for curves that run in from each side, which is what turns a rounded square into a
 * squircle: the corner reaches just as far, but nothing on the outline changes direction sharply.
 */
export const Rounding: StoryObj = {
  render: function Render() {
    const [radius, setRadius] = useState(0.4);
    const [smoothing, setSmoothing] = useState(0);
    const built = normalized(regularRoundedPolygon(4, { rounding: { radius, smoothing } }));

    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <svg width={200} height={200} viewBox="0 0 200 200" role="img" aria-label="A rounded square">
          <path d={shapePath(built, { size: 200 })} fill="var(--md-sys-color-primary)" />
        </svg>
        <Slider
          label={`radius ${radius.toFixed(2)}`}
          minValue={0}
          maxValue={1}
          step={0.01}
          value={radius}
          onChange={(value) => setRadius(single(value))}
        />
        <Slider
          label={`smoothing ${smoothing.toFixed(2)}`}
          minValue={0}
          maxValue={1}
          step={0.01}
          value={smoothing}
          onChange={(value) => setSmoothing(single(value))}
        />
        <p className="sb-label">{built.cubics.length} curves</p>
      </div>
    );
  },
};

/**
 * The factories the library is built out of: a regular polygon, a circle (a polygon rounded all
 * the way), a rectangle, and a star, which is a polygon with every other vertex pulled in.
 */
export const Factories: StoryObj = {
  render: () => {
    const examples = [
      ['regular, 5 sides', normalized(regularRoundedPolygon(5, { rounding: { radius: 0.2 } }))],
      ['circle, 8 vertices', normalized(circle(8))],
      ['rectangle 3:2', normalized(rectangle(3, 2, { rounding: { radius: 0.3 } }))],
      ['star, 8 points', normalized(star(8, { innerRadius: 0.6, rounding: { radius: 0.1 } }))],
      [
        'star, soft inner',
        normalized(star(8, { innerRadius: 0.6, rounding: { radius: 0.1 }, innerRounding: { radius: 0.5 } })),
      ],
    ] as const;

    return (
      <div className="sb-row" style={{ gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {examples.map(([label, polygon]) => (
          <figure
            key={label}
            style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <svg width={120} height={120} viewBox="0 0 120 120" role="img" aria-label={label}>
              <path d={shapePath(polygon, { size: 120 })} fill="var(--md-sys-color-tertiary)" />
            </svg>
            <figcaption className="sb-label" style={{ fontSize: 11 }}>
              {label}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  },
};

/**
 * What the loading indicator does with them. There is no `Morph` here — matching the corners of
 * two different shapes is the other half of the upstream library — so each outline is flattened
 * and resampled to the same number of points and those are interpolated. That is why a shape
 * with twelve corners can become one with three without a side collapsing.
 */
export const Morphing: StoryObj = {
  render: function Render() {
    const [t, setT] = useState(0.35);
    const [from, setFrom] = useState<ShapeName>('Cookie12Sided');
    const [to, setTo] = useState<ShapeName>('Triangle');
    const samples = 96;
    const size = 200;

    const outline = (name: ShapeName) => {
      const points = flatten(shape(name), 8).map((p) => ({ x: p.x * size, y: p.y * size }));
      // Even spacing along the outline, which is what makes two of them interpolable.
      return resampleEvenly(points, samples);
    };

    const a = outline(from);
    const b = outline(to);
    const points = a.map((p, i) => ({ x: p.x + (b[i]!.x - p.x) * t, y: p.y + (b[i]!.y - p.y) * t }));

    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Morphing shape"
        >
          <path d={polylinePath(points)} fill="var(--md-sys-color-primary)" />
        </svg>
        <Slider
          label={`t ${t.toFixed(2)}`}
          minValue={0}
          maxValue={1}
          step={0.01}
          value={t}
          onChange={(value) => setT(single(value))}
        />
        <div className="sb-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <FilledButton size="xs" onClick={() => setFrom(nextName(from))}>
            from: {from}
          </FilledButton>
          <FilledButton size="xs" onClick={() => setTo(nextName(to))}>
            to: {to}
          </FilledButton>
        </div>
        <p className="sb-label">
          The indicator at the token size, running the same mechanism on its own sequence:
        </p>
        <LoadingIndicator aria-label="Loading" />
      </div>
    );
  },
};

const nextName = (name: ShapeName) => shapeNames[(shapeNames.indexOf(name) + 1) % shapeNames.length]!;

/** Spreads points evenly along a closed outline. The library ships this as `resample`. */
function resampleEvenly(points: { x: number; y: number }[], count: number) {
  const lengths = points.map((p, i) => {
    const next = points[(i + 1) % points.length]!;
    return Math.hypot(next.x - p.x, next.y - p.y);
  });
  const perimeter = lengths.reduce((a, b) => a + b, 0);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    let target = (i / count) * perimeter;
    let edge = 0;
    while (edge < lengths.length && target > lengths[edge]!) {
      target -= lengths[edge]!;
      edge += 1;
    }
    const a = points[edge % points.length]!;
    const b = points[(edge + 1) % points.length]!;
    const t = lengths[edge % lengths.length]! === 0 ? 0 : target / lengths[edge % lengths.length]!;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

/** Every shape fills the unit square, which is what lets them all be drawn into one grid. */
export const Normalisation: StoryObj = {
  render: () => (
    <div className="sb-col">
      <p className="sb-label">
        Each outline is scaled so its longer axis fills the box, and centred on the other. The dashed square
        is the box.
      </p>
      <div className="sb-row" style={{ gap: 20, flexWrap: 'wrap' }}>
        {(['Circle', 'SemiCircle', 'Arrow', 'PixelTriangle', 'Heart'] as const).map((name) => {
          const box = bounds(shape(name).cubics);
          return (
            <figure
              key={name}
              style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <svg width={120} height={120} viewBox="0 0 120 120" role="img" aria-label={name}>
                <rect
                  x={0.5}
                  y={0.5}
                  width={119}
                  height={119}
                  fill="none"
                  stroke="var(--md-sys-color-outline-variant)"
                  strokeDasharray="4 4"
                />
                <path d={shapePath(shape(name), { size: 120 })} fill="var(--md-sys-color-secondary)" />
              </svg>
              <figcaption className="sb-label" style={{ fontSize: 11 }}>
                {name} — {(box.right - box.left).toFixed(2)} × {(box.bottom - box.top).toFixed(2)}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  ),
};
