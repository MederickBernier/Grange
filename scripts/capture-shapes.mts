/**
 * Captures the M3 Expressive shape library into tokens/m3-shapes.json.
 *
 * The 35 shapes are `RoundedPolygon`s defined in androidx's MaterialShapes.kt (Apache 2.0, see
 * NOTICE). The token file only ever held their names — `shapeLibrary` is a list of 35 strings and
 * no geometry — so this reads the real definitions out of the source, the same way
 * `pnpm capture-tokens` reads the generated token objects.
 *
 * What it emits is a descriptor per shape rather than a path: the vertex list with its per-corner
 * rounding, plus which factory built it and any transform applied. `src/shapes` turns a
 * descriptor into cubics, which is the part that is a port rather than a capture.
 *
 * Run with: pnpm capture-shapes
 *
 * Needs network. Deliberately not part of `pnpm build`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = resolve(root, 'tokens/m3-shapes.json');
const SOURCE =
  'https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt';

type Rounding = { radius: number; smoothing?: number };
type Transform = { rotate: number } | { scale: [number, number] };

type Descriptor =
  | { kind: 'circle'; numVertices: number; transforms?: Transform[] }
  | { kind: 'regular'; numVertices: number; rounding?: Rounding; perVertexRounding?: Rounding[]; transforms?: Transform[] }
  | { kind: 'rectangle'; width: number; height: number; rounding?: Rounding; perVertexRounding?: Rounding[]; transforms?: Transform[] }
  | { kind: 'star'; numVerticesPerRadius: number; innerRadius: number; rounding?: Rounding; innerRounding?: Rounding; transforms?: Transform[] }
  | {
      kind: 'custom';
      points: Array<{ x: number; y: number; radius: number; smoothing: number }>;
      reps: number;
      mirroring: boolean;
      center: [number, number];
      transforms?: Transform[];
    };

const num = (text: string) => Number(text.trim().replace(/f$/, ''));

/** `CornerRounding(0.189f, 0.811f)` and the named constants at the top of the file. */
function parseRounding(text: string | undefined, named: Record<string, Rounding>): Rounding | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (trimmed in named) return named[trimmed];
  const call = /^CornerRounding\(\s*(?:radius\s*=\s*)?([-\d.f]+)\s*(?:,\s*(?:smoothing\s*=\s*)?([-\d.f]+)\s*)?\)$/.exec(
    trimmed,
  );
  if (!call) throw new Error(`unrecognised CornerRounding: ${trimmed}`);
  const rounding: Rounding = { radius: num(call[1]!) };
  if (call[2] !== undefined) rounding.smoothing = num(call[2]);
  return rounding;
}

/** Splits a Kotlin argument list on top-level commas, so nested calls survive. */
function splitArgs(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth -= 1;
    if (char === ',' && depth === 0) {
      out.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) out.push(current);
  return out.map((part) => part.trim()).filter(Boolean);
}

/** The body of a `listOf(...)` / `floatArrayOf(...)` call starting at `from`. */
function balanced(source: string, from: number): { body: string; end: number } {
  const open = source.indexOf('(', from);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '(') depth += 1;
    else if (source[i] === ')') {
      depth -= 1;
      if (depth === 0) return { body: source.slice(open + 1, i), end: i };
    }
  }
  throw new Error('unbalanced parentheses');
}

function named(arg: string): [string | null, string] {
  const match = /^([A-Za-z]\w*)\s*=\s*([\s\S]+)$/.exec(arg);
  return match ? [match[1]!, match[2]!] : [null, arg];
}

function argMap(args: string[]): { byName: Record<string, string>; positional: string[] } {
  const byName: Record<string, string> = {};
  const positional: string[] = [];
  for (const arg of args) {
    const [key, value] = named(arg);
    if (key) byName[key] = value;
    else positional.push(value);
  }
  return { byName, positional };
}

/** `val m = Matrix().apply { scale(1f, 0.64f) }`, declared inside the shape that uses it. */
function localMatrices(body: string): Record<string, Transform> {
  const found: Record<string, Transform> = {};
  for (const match of body.matchAll(/val (\w+) = Matrix\(\)\.apply \{ scale\(([-\d.f]+)\s*,\s*([-\d.f]+)\) \}/g)) {
    found[match[1]!] = { scale: [num(match[2]!), num(match[3]!)] };
  }
  for (const match of body.matchAll(/val (\w+) = Matrix\(\)\.apply \{ rotateZ\(([-\d.f]+)\) \}/g)) {
    found[match[1]!] = { rotate: num(match[2]!) };
  }
  return found;
}

function transformsIn(body: string, matrices: Record<string, Transform>): Transform[] {
  const found: Transform[] = [];
  for (const match of body.matchAll(/\.transformed\((\w+)\)/g)) {
    const matrix = matrices[match[1]!];
    if (!matrix) throw new Error(`unknown matrix: ${match[1]}`);
    found.push(matrix);
  }
  return found;
}

async function main() {
  const source = await fetch(SOURCE).then((response) => {
    if (!response.ok) throw new Error(`${SOURCE} -> ${response.status}`);
    return response.text();
  });

  // The shared CornerRounding constants, e.g. `private val cornerRound15 = CornerRounding(radius = .15f)`.
  const roundingConstants: Record<string, Rounding> = { 'CornerRounding.Unrounded': { radius: 0 } };
  for (const match of source.matchAll(/private val (cornerRound\w+) = (CornerRounding\([^)]*\))/g)) {
    roundingConstants[match[1]!] = parseRounding(match[2]!, {})!;
  }

  // The file-level rotations. The scales are declared inside the shape that uses them, and both
  // of those locals are called `m`, so they are read per shape rather than here.
  const matrices: Record<string, Transform> = {};
  for (const match of source.matchAll(/private val (\w+) = Matrix\(\)\.apply \{ rotateZ\(([-\d.f]+)\) \}/g)) {
    matrices[match[1]!] = { rotate: num(match[2]!) };
  }

  // Each shape is one `internal fun name(): RoundedPolygon { ... }`.
  const shapes: Record<string, Descriptor> = {};
  const order: string[] = [];

  for (const match of source.matchAll(/internal fun (\w+)\((?:[^)]*)\): RoundedPolygon \{([\s\S]*?)\n        \}/g)) {
    const name = match[1]!;
    const body = match[2]!;
    const scoped = { ...matrices, ...localMatrices(body) };
    const transforms = transformsIn(body, scoped);
    const add = (descriptor: Descriptor) => {
      if (transforms.length > 0) descriptor.transforms = transforms;
      shapes[name] = descriptor;
      order.push(name);
    };

    if (body.includes('RoundedPolygon.circle(')) {
      const { byName } = argMap(splitArgs(balanced(body, body.indexOf('RoundedPolygon.circle')).body));
      /*
       * `circle(numVertices = numVertices)` forwards the helper's own parameter, so the number is
       * that parameter's default rather than a literal. Shapes.circle defaults to 8 when nothing
       * is passed at all, which is the other case here.
       */
      const forwarded = byName.numVertices?.trim();
      const literal = forwarded !== undefined && /^[-\d.f]+$/.test(forwarded);
      const fromSignature = /internal fun \w+\(numVertices: Int = (\d+)\)/.exec(match[0]!)?.[1];
      add({
        kind: 'circle',
        numVertices: literal ? num(forwarded) : fromSignature ? Number(fromSignature) : 8,
      });
      continue;
    }

    if (body.includes('RoundedPolygon.rectangle(')) {
      const { byName } = argMap(splitArgs(balanced(body, body.indexOf('RoundedPolygon.rectangle')).body));
      add({
        kind: 'rectangle',
        width: byName.width ? num(byName.width) : 2,
        height: byName.height ? num(byName.height) : 2,
        ...roundingArgs(byName, roundingConstants),
      });
      continue;
    }

    if (body.includes('RoundedPolygon.star(')) {
      const { byName } = argMap(splitArgs(balanced(body, body.indexOf('RoundedPolygon.star')).body));
      add({
        kind: 'star',
        numVerticesPerRadius: num(byName.numVerticesPerRadius!),
        innerRadius: byName.innerRadius ? num(byName.innerRadius) : 0.5,
        rounding: parseRounding(byName.rounding, roundingConstants),
        innerRounding: parseRounding(byName.innerRounding, roundingConstants),
      });
      continue;
    }

    if (body.includes('customPolygon(')) {
      const { body: inner } = balanced(body, body.indexOf('customPolygon'));
      const args = splitArgs(inner);
      const { byName, positional } = argMap(args);
      const list = args.find((arg) => named(arg)[1].startsWith('listOf('))!;
      const points = [...named(list)[1].matchAll(/PointNRound\(\s*Offset\(([-\d.f]+)\s*,\s*([-\d.f]+)\)\s*(?:,\s*(CornerRounding\([^)]*\)))?\s*\)/g)].map(
        (point) => {
          const rounding = parseRounding(point[3], roundingConstants) ?? { radius: 0 };
          return {
            x: num(point[1]!),
            y: num(point[2]!),
            radius: rounding.radius,
            smoothing: rounding.smoothing ?? 0,
          };
        },
      );
      // `reps` is named in some shapes and the second positional argument in others.
      const reps = byName.reps ?? positional[1];
      const centre = byName.center
        ? (splitArgs(balanced(byName.center, 0).body).map(num) as [number, number])
        : ([0.5, 0.5] as [number, number]);
      add({
        kind: 'custom',
        points,
        reps: num(reps!),
        mirroring: byName.mirroring?.trim() === 'true',
        center: centre,
      });
      continue;
    }

    if (body.includes('RoundedPolygon(')) {
      const { byName } = argMap(splitArgs(balanced(body, body.indexOf('RoundedPolygon(')).body));
      add({
        kind: 'regular',
        numVertices: num(byName.numVertices!),
        ...roundingArgs(byName, roundingConstants),
      });
      continue;
    }

    throw new Error(`unrecognised shape definition: ${name}`);
  }

  // The public names, which are what the token file lists, in the order the source declares them.
  const publicNames = [...source.matchAll(/public val (\w+): RoundedPolygon\n\s*get\(\) = _\w+ \?: (\w+)\(\)/g)].map(
    (match) => ({ name: match[1]!, from: match[2]! }),
  );

  const library: Record<string, Descriptor> = {};
  for (const { name, from } of publicNames) {
    const descriptor = shapes[from];
    if (!descriptor) throw new Error(`${name} is built by ${from}(), which was not parsed`);
    library[name] = descriptor;
  }

  const previous = (() => {
    try {
      return JSON.parse(readFileSync(outPath, 'utf8')) as { shapes?: Record<string, Descriptor> };
    } catch {
      return {};
    }
  })();

  const out = {
    $meta: {
      source: SOURCE,
      license: 'Apache-2.0, see NOTICE',
      captured: new Date().toISOString().slice(0, 10),
      note:
        'Every public shape is normalized() in the source, so each one is scaled and centred into ' +
        'the unit square. src/shapes does the same.',
    },
    // Merged rather than replaced, so a shape that disappears upstream is not lost here.
    shapes: { ...previous.shapes, ...library },
  };

  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`shapes: ${Object.keys(library).length} captured -> tokens/m3-shapes.json`);
}

function roundingArgs(
  byName: Record<string, string>,
  constants: Record<string, Rounding>,
): { rounding?: Rounding; perVertexRounding?: Rounding[] } {
  const out: { rounding?: Rounding; perVertexRounding?: Rounding[] } = {};
  const rounding = parseRounding(byName.rounding, constants);
  if (rounding) out.rounding = rounding;
  if (byName.perVertexRounding) {
    const inner = balanced(byName.perVertexRounding, 0).body;
    out.perVertexRounding = splitArgs(inner).map((part) => parseRounding(part, constants)!);
  }
  return out;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
