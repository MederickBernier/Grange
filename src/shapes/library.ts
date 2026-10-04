/**
 * The 35 M3 Expressive shapes.
 *
 * The descriptors come from `tokens/m3-shapes.json`, captured out of MaterialShapes.kt by
 * `pnpm capture-shapes`; this builds one into an outline. Every shape upstream is published
 * normalised, so each one here fills the unit square too.
 */
import { shapeDescriptors, type ShapeName } from './generated/shapes';
import type { CornerRounding, CustomDescriptor, ShapeDescriptor } from './descriptor';
import {
  circle,
  normalized,
  rectangle,
  regularPolygon,
  rotated,
  roundedPolygon,
  scaled,
  star,
  type RoundedPolygon,
} from './polygon';
import type { Point } from './geometry';

export type { ShapeName };
export { shapeDescriptors };

/** The names, in the order the source declares them. */
export const shapeNames = Object.keys(shapeDescriptors) as ShapeName[];

/** Builds the outline a descriptor describes, normalised into the unit square. */
export function buildShape(descriptor: ShapeDescriptor): RoundedPolygon {
  let polygon: RoundedPolygon;

  switch (descriptor.kind) {
    case 'circle':
      polygon = circle(descriptor.numVertices);
      break;
    case 'regular':
      polygon = regularPolygon(descriptor.numVertices, {
        rounding: descriptor.rounding,
        perVertexRounding: descriptor.perVertexRounding,
      });
      break;
    case 'rectangle':
      polygon = rectangle(descriptor.width, descriptor.height, {
        rounding: descriptor.rounding,
        perVertexRounding: descriptor.perVertexRounding,
      });
      break;
    case 'star':
      polygon = star(descriptor.numVerticesPerRadius, {
        innerRadius: descriptor.innerRadius,
        rounding: descriptor.rounding,
        innerRounding: descriptor.innerRounding,
      });
      break;
    case 'custom':
      polygon = customPolygon(descriptor);
      break;
  }

  for (const transform of descriptor.transforms ?? []) {
    polygon =
      'rotate' in transform
        ? rotated(polygon, transform.rotate)
        : scaled(polygon, transform.scale[0], transform.scale[1]);
  }

  return normalized(polygon);
}

const cache = new Map<ShapeName, RoundedPolygon>();

/** One of the library's shapes, built once and kept. */
export function shape(name: ShapeName): RoundedPolygon {
  const cached = cache.get(name);
  if (cached) return cached;
  const built = buildShape(shapeDescriptors[name]);
  cache.set(name, built);
  return built;
}

/**
 * The irregular shapes are written as one section of the outline, repeated around the centre.
 *
 * Without mirroring the section is simply rotated into place, which is how the clovers and
 * bursts are built. With it, every other copy is reflected, so the section and its mirror image
 * meet along a line of symmetry: that is what makes a heart or a pill, where the two halves are
 * the same shape facing opposite ways. The point the two copies share is dropped, or the outline
 * would double back on itself.
 */
function customPolygon(descriptor: CustomDescriptor): RoundedPolygon {
  const centre: Point = { x: descriptor.center[0], y: descriptor.center[1] };
  const section = descriptor.points;
  const vertices: Point[] = [];
  const rounding: CornerRounding[] = [];

  const push = (point: Point, from: { radius: number; smoothing: number }) => {
    vertices.push(point);
    rounding.push({ radius: from.radius, smoothing: from.smoothing });
  };

  if (!descriptor.mirroring) {
    for (let rep = 0; rep < descriptor.reps; rep += 1) {
      const angle = ((rep * 360) / descriptor.reps) * (Math.PI / 180);
      for (const point of section) {
        push(rotateAbout(point, centre, angle), point);
      }
    }
    return roundedPolygon(vertices, { perVertexRounding: rounding, centre });
  }

  // Each section covers half of a repeat, since its mirror image covers the other half.
  const angles = section.map((p) => (Math.atan2(p.y - centre.y, p.x - centre.x) * 180) / Math.PI);
  const distances = section.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y));
  const copies = descriptor.reps * 2;
  const sectionAngle = 360 / copies;

  for (let copy = 0; copy < copies; copy += 1) {
    const forwards = copy % 2 === 0;
    for (let i = 0; i < section.length; i += 1) {
      // Odd copies walk the section backwards, which is the reflection.
      const index = forwards ? i : section.length - 1 - i;
      // The shared point at the join belongs to the forward copy only.
      if (index === 0 && !forwards) continue;
      const degrees = forwards
        ? sectionAngle * copy + angles[index]!
        : sectionAngle * copy + sectionAngle - angles[index]! + 2 * angles[0]!;
      const radians = (degrees * Math.PI) / 180;
      push(
        {
          x: centre.x + Math.cos(radians) * distances[index]!,
          y: centre.y + Math.sin(radians) * distances[index]!,
        },
        section[index]!,
      );
    }
  }

  return roundedPolygon(vertices, { perVertexRounding: rounding, centre });
}

function rotateAbout(point: { x: number; y: number }, centre: Point, radians: number): Point {
  const x = point.x - centre.x;
  const y = point.y - centre.y;
  return {
    x: centre.x + x * Math.cos(radians) - y * Math.sin(radians),
    y: centre.y + x * Math.sin(radians) + y * Math.cos(radians),
  };
}
