/**
 * Rounded polygons, ported from androidx.graphics.shapes (Apache 2.0, see NOTICE).
 *
 * A vertex list plus a `CornerRounding` per corner becomes a closed list of cubics: three per
 * rounded corner — a run-in curve, the arc, a run-out curve — and a straight run along each side
 * between them. The fiddly part, and the reason this is a port rather than a rewrite, is that a
 * corner's cut has to be negotiated with its neighbours: two generous radii on a short side would
 * each want more of it than there is, so the side is shared out, rounding first and smoothing
 * only with what is left.
 */
import {
  add,
  bounds,
  circularArc,
  cubic,
  direction,
  distance,
  dot,
  interpolate,
  isZeroLength,
  rotate90,
  scale,
  straightLine,
  subtract,
  transformCubic,
  type Cubic,
  type Point,
  DISTANCE_EPSILON,
} from './geometry';
import type { CornerRounding } from './descriptor';

/** A closed outline, with the centre the shape was built around. */
export interface RoundedPolygon {
  cubics: Cubic[];
  centre: Point;
}

const UNROUNDED: CornerRounding = { radius: 0 };

/** One corner's geometry, before its neighbours have had their say about the shared sides. */
class Corner {
  readonly d1: Point;
  readonly d2: Point;
  readonly radius: number;
  readonly smoothing: number;
  readonly cosAngle: number;
  readonly sinAngle: number;
  /** How far along each side the arc has to start for the requested radius. */
  readonly expectedRoundCut: number;

  constructor(
    readonly p0: Point,
    readonly p1: Point,
    readonly p2: Point,
    rounding: CornerRounding,
  ) {
    const v01 = subtract(p0, p1);
    const v21 = subtract(p2, p1);
    const d01 = distance(v01);
    const d21 = distance(v21);

    if (d01 <= 0 || d21 <= 0) {
      // A side with no length: there is nothing to round against.
      this.d1 = { x: 0, y: 0 };
      this.d2 = { x: 0, y: 0 };
      this.radius = 0;
      this.smoothing = 0;
      this.cosAngle = 0;
      this.sinAngle = 0;
      this.expectedRoundCut = 0;
      return;
    }

    this.d1 = scale(v01, 1 / d01);
    this.d2 = scale(v21, 1 / d21);
    this.radius = rounding.radius;
    this.smoothing = rounding.smoothing ?? 0;
    this.cosAngle = dot(this.d1, this.d2);
    this.sinAngle = Math.sqrt(1 - this.cosAngle * this.cosAngle);
    // From tan(A/2) = sinA / (1 + cosA), where tan(A/2) is radius over cut.
    this.expectedRoundCut = this.sinAngle > 1e-3 ? (this.radius * (this.cosAngle + 1)) / this.sinAngle : 0;
  }

  /** Smoothing at 0 is the arc alone; at 1 it asks for twice the cut. */
  get expectedCut(): number {
    return (1 + this.smoothing) * this.expectedRoundCut;
  }

  /** How much smoothing fits once rounding has taken what it needs. */
  private actualSmoothing(allowedCut: number): number {
    if (allowedCut > this.expectedCut) return this.smoothing;
    if (allowedCut > this.expectedRoundCut) {
      return (
        (this.smoothing * (allowedCut - this.expectedRoundCut)) / (this.expectedCut - this.expectedRoundCut)
      );
    }
    return 0;
  }

  cubics(allowedCut0: number, allowedCut1: number): Cubic[] {
    // The radius is set by the tighter of the two sides; the looser one can spend what is left on
    // smoothing.
    const allowedCut = Math.min(allowedCut0, allowedCut1);
    if (
      this.expectedRoundCut < DISTANCE_EPSILON ||
      allowedCut < DISTANCE_EPSILON ||
      this.radius < DISTANCE_EPSILON
    ) {
      // A plain corner: a zero-length cubic at the vertex, which the edges then join up to.
      return [straightLine(this.p1, this.p1)];
    }

    const actualRoundCut = Math.min(allowedCut, this.expectedRoundCut);
    const smoothing0 = this.actualSmoothing(allowedCut0);
    const smoothing1 = this.actualSmoothing(allowedCut1);
    const actualRadius = (this.radius * actualRoundCut) / this.expectedRoundCut;

    const centreDistance = Math.sqrt(actualRadius * actualRadius + actualRoundCut * actualRoundCut);
    const centre = add(this.p1, scale(direction(scale(add(this.d1, this.d2), 0.5)), centreDistance));
    const onSide1 = add(this.p1, scale(this.d1, actualRoundCut));
    const onSide2 = add(this.p1, scale(this.d2, actualRoundCut));

    const flank0 = this.flank(actualRoundCut, smoothing0, this.p0, onSide1, onSide2, centre, actualRadius);
    const flank2 = reverse(
      this.flank(actualRoundCut, smoothing1, this.p2, onSide2, onSide1, centre, actualRadius),
    );

    return [flank0, circularArc(centre, flank0.anchor1, flank2.anchor0), flank2];
  }

  /**
   * The run-in curve: it leaves the straight side and arrives on the arc, tangent to both.
   *
   * With no smoothing it collapses onto the point where the side meets the arc. With smoothing it
   * starts further back along the side and lands further round the arc, which is what turns a
   * rounded corner into a squircle.
   */
  private flank(
    actualRoundCut: number,
    smoothing: number,
    sideStart: Point,
    onThisSide: Point,
    onOtherSide: Point,
    centre: Point,
    radius: number,
  ): Cubic {
    const sideDirection = direction(subtract(sideStart, this.p1));
    const curveStart = add(this.p1, scale(sideDirection, actualRoundCut * (1 + smoothing)));

    // Takes a share of the arc proportional to the smoothing: none of it at 0, all of it at 1.
    const towardsMiddle = interpolate(onThisSide, interpolate(onThisSide, onOtherSide, 0.5), smoothing);
    const curveEnd = add(centre, scale(direction(subtract(towardsMiddle, centre)), radius));

    // The far control point is where the side meets the tangent to the circle at that end.
    const tangent = rotate90(subtract(curveEnd, centre));
    const anchorEnd = lineIntersection(sideStart, sideDirection, curveEnd, tangent) ?? onThisSide;
    // Two thirds of the way along, which is what the design tools use.
    const anchorStart = scale(add(curveStart, scale(anchorEnd, 2)), 1 / 3);

    return cubic(curveStart, anchorStart, anchorEnd, curveEnd);
  }
}

const reverse = (c: Cubic): Cubic => cubic(c.anchor1, c.control1, c.control0, c.anchor0);

/** Where two lines meet, or null when they are parallel. */
function lineIntersection(p0: Point, d0: Point, p1: Point, d1: Point): Point | null {
  const rotated = rotate90(d1);
  const denominator = dot(d0, rotated);
  if (Math.abs(denominator) < DISTANCE_EPSILON) return null;
  const numerator = dot(subtract(p1, p0), rotated);
  if (Math.abs(denominator) < DISTANCE_EPSILON * Math.abs(numerator)) return null;
  return add(p0, scale(d0, numerator / denominator));
}

export interface PolygonOptions {
  rounding?: CornerRounding;
  perVertexRounding?: readonly CornerRounding[];
  centre?: Point;
}

/** Builds a rounded polygon from an ordered vertex list. */
export function roundedPolygon(vertices: readonly Point[], options: PolygonOptions = {}): RoundedPolygon {
  const n = vertices.length;
  if (n < 3) throw new Error('A polygon needs at least three vertices');
  if (options.perVertexRounding && options.perVertexRounding.length !== n) {
    throw new Error('perVertexRounding must have one entry per vertex');
  }

  const at = (i: number) => vertices[((i % n) + n) % n]!;
  const corners = vertices.map(
    (_, i) =>
      new Corner(
        at(i - 1),
        at(i),
        at(i + 1),
        options.perVertexRounding?.[i] ?? options.rounding ?? UNROUNDED,
      ),
  );

  /*
   * Every side is shared by two corners, and each wants to cut into it. Work out, per side, what
   * fraction of each corner's rounding and smoothing actually fits: rounding gets first call on
   * the space, and smoothing only gets what is left over.
   */
  const shares = vertices.map((_, i) => {
    const next = (i + 1) % n;
    const wantedRound = corners[i]!.expectedRoundCut + corners[next]!.expectedRoundCut;
    const wantedTotal = corners[i]!.expectedCut + corners[next]!.expectedCut;
    const side = distance(subtract(at(i), at(next)));

    if (wantedRound > side) return { round: side / wantedRound, smooth: 0 };
    if (wantedTotal > side) return { round: 1, smooth: (side - wantedRound) / (wantedTotal - wantedRound) };
    return { round: 1, smooth: 1 };
  });

  const cornerCubics = vertices.map((_, i) => {
    // One allowance per side: the one arriving at this corner and the one leaving it.
    const allowed = [0, 1].map((delta) => {
      const share = shares[(i + n - 1 + delta) % n]!;
      const corner = corners[i]!;
      return (
        corner.expectedRoundCut * share.round + (corner.expectedCut - corner.expectedRoundCut) * share.smooth
      );
    });
    return corners[i]!.cubics(allowed[0]!, allowed[1]!);
  });

  // Corner curves, then the straight run from each corner's end to the next corner's start.
  const all: Cubic[] = [];
  for (let i = 0; i < n; i += 1) {
    const current = cornerCubics[i]!;
    const next = cornerCubics[(i + 1) % n]!;
    all.push(...current);
    all.push(straightLine(current[current.length - 1]!.anchor1, next[0]!.anchor0));
  }

  const centre = options.centre ?? averageOf(vertices);
  return { cubics: contiguous(all), centre };
}

/**
 * Drops the zero-length curves and makes the outline close exactly.
 *
 * A corner with no rounding contributes a zero-length cubic at its vertex; leaving those in means
 * a renderer can show artefacts, and dropping them without carrying the anchor forward leaves
 * gaps. Upstream does the same thing for the same reason.
 */
function contiguous(cubics: readonly Cubic[]): Cubic[] {
  const kept: Cubic[] = [];
  for (const c of cubics) {
    if (isZeroLength(c)) {
      const last = kept[kept.length - 1];
      // Carry the anchor forward so the next curve still starts where this one would have ended.
      if (last) last.anchor1 = c.anchor1;
      continue;
    }
    kept.push({ ...c });
  }
  if (kept.length === 0) return [];
  // The last curve ends exactly where the first begins, so the path closes without a seam.
  kept[kept.length - 1]!.anchor1 = kept[0]!.anchor0;
  return kept;
}

function averageOf(points: readonly Point[]): Point {
  const total = points.reduce((sum, p) => add(sum, p), { x: 0, y: 0 });
  return scale(total, 1 / points.length);
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

/** The vertices of a regular polygon, starting at three o'clock, as upstream does. */
export function regularVertices(count: number, radius = 1, centre: Point = { x: 0, y: 0 }): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((Math.PI * 2) / count) * i;
    return { x: centre.x + Math.cos(angle) * radius, y: centre.y + Math.sin(angle) * radius };
  });
}

export function regularPolygon(
  count: number,
  options: PolygonOptions & { radius?: number } = {},
): RoundedPolygon {
  const { radius = 1, ...rest } = options;
  return roundedPolygon(regularVertices(count, radius), { centre: { x: 0, y: 0 }, ...rest });
}

/**
 * A circle, as a polygon whose corners are rounded all the way.
 *
 * The polygon has to be a little larger than the circle it draws, because its vertices sit
 * outside the arc that passes through the middle of each side: hence the radius over cos(theta).
 */
export function circle(numVertices = 8, radius = 1): RoundedPolygon {
  const theta = Math.PI / numVertices;
  return regularPolygon(numVertices, { radius: radius / Math.cos(theta), rounding: { radius } });
}

export function rectangle(width = 2, height = 2, options: PolygonOptions = {}): RoundedPolygon {
  const right = width / 2;
  const bottom = height / 2;
  return roundedPolygon(
    [
      { x: right, y: bottom },
      { x: -right, y: bottom },
      { x: -right, y: -bottom },
      { x: right, y: -bottom },
    ],
    { centre: { x: 0, y: 0 }, ...options },
  );
}

/** A polygon with every other vertex pulled in, which is what makes the cookies and the suns. */
export function star(
  numVerticesPerRadius: number,
  options: {
    radius?: number;
    innerRadius?: number;
    rounding?: CornerRounding;
    innerRounding?: CornerRounding;
  } = {},
): RoundedPolygon {
  const { radius = 1, innerRadius = 0.5, rounding, innerRounding } = options;
  const vertices: Point[] = [];
  const perVertex: CornerRounding[] = [];
  const step = Math.PI / numVerticesPerRadius;

  for (let i = 0; i < numVerticesPerRadius; i += 1) {
    const outerAngle = step * 2 * i;
    vertices.push({ x: Math.cos(outerAngle) * radius, y: Math.sin(outerAngle) * radius });
    perVertex.push(rounding ?? UNROUNDED);
    const innerAngle = outerAngle + step;
    vertices.push({ x: Math.cos(innerAngle) * innerRadius, y: Math.sin(innerAngle) * innerRadius });
    // The inner corners take their own rounding when given one, which is what softens a burst.
    perVertex.push(innerRounding ?? rounding ?? UNROUNDED);
  }

  return roundedPolygon(vertices, { perVertexRounding: perVertex, centre: { x: 0, y: 0 } });
}

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

export function transformPolygon(polygon: RoundedPolygon, f: (p: Point) => Point): RoundedPolygon {
  return { cubics: polygon.cubics.map((c) => transformCubic(c, f)), centre: f(polygon.centre) };
}

export function rotated(polygon: RoundedPolygon, degrees: number): RoundedPolygon {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return transformPolygon(polygon, ({ x, y }) => ({ x: x * cos - y * sin, y: x * sin + y * cos }));
}

export function scaled(polygon: RoundedPolygon, x: number, y: number): RoundedPolygon {
  return transformPolygon(polygon, (p) => ({ x: p.x * x, y: p.y * y }));
}

/**
 * Moves and resizes a shape so it fills the unit square, centred on whichever axis has room left.
 *
 * Every shape in the library is published normalised, which is why they can all be drawn into the
 * same box regardless of the units their vertices were written in.
 */
export function normalized(polygon: RoundedPolygon): RoundedPolygon {
  const box = bounds(polygon.cubics);
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  const side = Math.max(width, height);
  if (side === 0) return polygon;
  const offsetX = (side - width) / 2 - box.left;
  const offsetY = (side - height) / 2 - box.top;
  return transformPolygon(polygon, (p) => ({ x: (p.x + offsetX) / side, y: (p.y + offsetY) / side }));
}
