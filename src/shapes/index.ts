/**
 * The M3 Expressive shape library.
 *
 * Google publishes 35 named shapes. The token file only ever listed their names, because they
 * are not token values: they are `RoundedPolygon`s in androidx.graphics.shapes, built from vertex
 * lists with a radius and a smoothing per corner. `pnpm capture-shapes` reads those definitions
 * out of MaterialShapes.kt, and this is the port that turns one into curves.
 *
 * What is not here is `Morph`. Morphing two arbitrary shapes needs the feature-matching half of
 * that library, which decides which corner of one shape becomes which corner of the other; the
 * loading indicator interpolates resampled outlines instead, which is cheaper and good enough for
 * a shape that is 38px across.
 */
export { shape, shapeNames, shapeDescriptors, buildShape, type ShapeName } from './library';
export {
  roundedPolygon,
  regularPolygon as regularRoundedPolygon,
  regularVertices,
  circle,
  rectangle,
  star,
  normalized,
  rotated,
  scaled,
  transformPolygon,
  type RoundedPolygon,
  type PolygonOptions,
} from './polygon';
export { shapePath, polylinePath, flatten, pointOn, type PathOptions } from './path';
export { bounds, cubic, straightLine, circularArc, type Cubic, type Point as ShapePoint } from './geometry';
export type {
  CornerRounding,
  ShapeDescriptor,
  ShapeTransform,
  CircleDescriptor,
  RegularDescriptor,
  RectangleDescriptor,
  StarDescriptor,
  CustomDescriptor,
} from './descriptor';
