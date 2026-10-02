/**
 * How a shape in the library is described.
 *
 * These are the shapes of the values in `tokens/m3-shapes.json`, which `pnpm capture-shapes`
 * reads out of androidx's MaterialShapes.kt. A descriptor says which factory built the shape and
 * with what; turning one into curves is `polygon.ts`, which is a port rather than a capture.
 */

/** A corner's radius, and how much of the arc is traded for a smooth run-in on each side. */
export interface CornerRounding {
  /** In the polygon's own units, so 1 is the distance from the centre to a vertex. */
  radius: number;
  /** 0 is a plain circular arc; 1 trades all of it for the flanking curves. */
  smoothing?: number;
}

export type ShapeTransform = { rotate: number } | { scale: [number, number] };

interface WithTransforms {
  /** Applied in order, after the shape is built and before it is normalised. */
  readonly transforms?: readonly ShapeTransform[];
}

export interface CircleDescriptor extends WithTransforms {
  readonly kind: 'circle';
  readonly numVertices: number;
}

export interface RegularDescriptor extends WithTransforms {
  readonly kind: 'regular';
  readonly numVertices: number;
  readonly rounding?: CornerRounding;
  readonly perVertexRounding?: readonly CornerRounding[];
}

export interface RectangleDescriptor extends WithTransforms {
  readonly kind: 'rectangle';
  readonly width: number;
  readonly height: number;
  readonly rounding?: CornerRounding;
  readonly perVertexRounding?: readonly CornerRounding[];
}

export interface StarDescriptor extends WithTransforms {
  readonly kind: 'star';
  readonly numVerticesPerRadius: number;
  readonly innerRadius: number;
  readonly rounding?: CornerRounding;
  readonly innerRounding?: CornerRounding;
}

export interface CustomDescriptor extends WithTransforms {
  readonly kind: 'custom';
  /** One section of the outline, repeated and optionally mirrored around the centre. */
  readonly points: readonly { readonly x: number; readonly y: number; readonly radius: number; readonly smoothing: number }[];
  readonly reps: number;
  readonly mirroring: boolean;
  readonly center: readonly [number, number];
}

export type ShapeDescriptor =
  | CircleDescriptor
  | RegularDescriptor
  | RectangleDescriptor
  | StarDescriptor
  | CustomDescriptor;
