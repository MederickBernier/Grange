/**
 * Token pipeline: tokens/m3-expressive.json (Google's M3E values) + tokens/theme.json (our brand)
 *   -> src/tokens/generated/tokens.css  (CSS custom properties, light + dark)
 *   -> src/tokens/generated/tokens.ts   (typed values for JS: springs, shapes, durations)
 *
 * Run with: pnpm tokens
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Hct,
  SchemeTonalSpot,
  TonalPalette,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(resolve(root, 'tokens/m3-expressive.json'), 'utf8'));
const theme = JSON.parse(readFileSync(resolve(root, 'tokens/theme.json'), 'utf8'));
/*
 * The spacing scale, which is ours rather than Google's: Material publishes no spacing tokens.
 * Kept in its own file and emitted under --grange-space-* rather than --md-sys-*, so a reader
 * can tell at a glance which values came from androidx and which this project chose.
 */
const spacing = JSON.parse(readFileSync(resolve(root, 'tokens/grange-spacing.json'), 'utf8'));
const spacePx: Record<string, number> = Object.fromEntries(
  Object.entries<{ px: number }>(spacing.scale).map(([k, v]) => [k, v.px]),
);
const outDir = resolve(root, 'src/tokens/generated');
mkdirSync(outDir, { recursive: true });

// ---------- Color ----------
// Palettes come from the seed (Tonal Spot, the M3 default scheme variant).
// Roles map to palette tones exactly as Google's ColorLightTokens / ColorDarkTokens do.
const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(theme.seed)), false, theme.contrastLevel ?? 0);
const palettes: Record<string, TonalPalette> = {
  Primary: scheme.primaryPalette,
  Secondary: scheme.secondaryPalette,
  Tertiary: scheme.tertiaryPalette,
  Neutral: scheme.neutralPalette,
  NeutralVariant: scheme.neutralVariantPalette,
  Error: scheme.errorPalette,
};

function resolveTone(ref: string): string {
  const match = /^(NeutralVariant|Neutral|Primary|Secondary|Tertiary|Error)(\d+)$/.exec(ref);
  if (!match) throw new Error(`Unknown palette tone reference: ${ref}`);
  return hexFromArgb(palettes[match[1]].tone(Number(match[2])));
}

type Mode = 'light' | 'dark';
function colorRoles(mode: Mode): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [role, refs] of Object.entries<Record<Mode, string>>(spec.colorRoles)) {
    out[role] = resolveTone(refs[mode]);
  }
  out['shadow'] = resolveTone('Neutral0');
  out['surface-tint'] = out['primary'];
  return { ...out, ...(theme.overrides?.[mode] ?? {}) };
}

const light = colorRoles('light');
const dark = colorRoles('dark');
const colorBlock = (roles: Record<string, string>) =>
  Object.entries(roles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  --md-sys-color-${k}: ${v};`)
    .join('\n');

// ---------- Typography ----------
const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`;
const typeLines: string[] = [
  `  --md-ref-typeface-brand: ${theme.typeface.brand};`,
  `  --md-ref-typeface-plain: ${theme.typeface.plain};`,
];
const typeClasses: string[] = [];
for (const [style, t] of Object.entries<any>(spec.typescale)) {
  const p = `--md-sys-typescale-${style}`;
  typeLines.push(
    `  ${p}-font: var(--md-ref-typeface-${t.font});`,
    `  ${p}-size: ${rem(t.size)};`,
    `  ${p}-line-height: ${rem(t.lineHeight)};`,
    `  ${p}-tracking: ${t.tracking}px;`,
    `  ${p}-weight: ${t.weight};`,
  );
  typeClasses.push(
    `.md-typescale-${style} {\n  font-family: var(${p}-font);\n  font-size: var(${p}-size);\n  line-height: var(${p}-line-height);\n  letter-spacing: var(${p}-tracking);\n  font-weight: var(${p}-weight);\n}`,
  );
}

// ---------- Shape ----------
const shapePx: Record<string, number> = {};
const shapeLines: string[] = [];
for (const [name, v] of Object.entries<any>(spec.shape)) {
  if (name === 'full') continue;
  shapePx[name] = v;
  shapeLines.push(`  --md-sys-shape-corner-${name}: ${v}px;`);
}
// "full" is a pill or circle; 9999px gives that on any box size without the ellipse artifacts of 50%.
shapeLines.push(`  --md-sys-shape-corner-full: 9999px;`);

// ---------- Motion ----------
const motionLines: string[] = [];
for (const [name, ms] of Object.entries<number>(spec.motion.duration)) {
  motionLines.push(`  --md-sys-motion-duration-${name.replace(/-(\d)$/, '$1')}: ${ms}ms;`);
}
for (const [name, b] of Object.entries<number[]>(spec.motion.easing)) {
  motionLines.push(`  --md-sys-motion-easing-${name}: cubic-bezier(${b.join(', ')});`);
}

// ---------- State + elevation ----------
const stateLines = Object.entries<number>(spec.stateLayerOpacity).map(
  ([k, v]) => `  --md-sys-state-${k}-state-layer-opacity: ${v};`,
);
const elevationLines = Object.entries<number>(spec.elevation).map(
  ([k, v]) => `  --md-sys-elevation-level${k.replace('Level', '')}: ${v};`,
);

// ---------- Spacing (ours, not Google's — hence the namespace) ----------
const spaceLines = Object.entries(spacePx).map(([k, v]) => `  --grange-space-${k}: ${v}px;`);

// ---------- Write CSS ----------
const css = `/* GENERATED by scripts/build-tokens.mts from tokens/m3-expressive.json + tokens/theme.json. Do not edit. */
/* Seed: ${theme.seed} */

:root {
  color-scheme: light dark;
${colorBlock(light)}
${typeLines.join('\n')}
${shapeLines.join('\n')}
${motionLines.join('\n')}
${stateLines.join('\n')}
${elevationLines.join('\n')}
${spaceLines.join('\n')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${colorBlock(dark).replace(/^/gm, '  ')}
  }
}

:root[data-theme='light'], [data-theme='light'] {
  color-scheme: light;
${colorBlock(light)}
}

:root[data-theme='dark'], [data-theme='dark'] {
  color-scheme: dark;
${colorBlock(dark)}
}

${typeClasses.join('\n\n')}
`;
writeFileSync(resolve(outDir, 'tokens.css'), css);

// ---------- Write TS ----------
const springs = (s: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(s).map(([k, v]) => [
      k.replace(/-(\w)/g, (_, c) => c.toUpperCase()),
      { stiffness: v.stiffness, damping: v.motionDamping, mass: 1, dampingRatio: v.dampingRatio },
    ]),
  );
const ts = `/* GENERATED by scripts/build-tokens.mts. Do not edit. */

export interface SpringToken {
  /** Spring stiffness (same value as Compose). */
  stiffness: number;
  /** Absolute damping for Motion, converted from dampingRatio: 2 * ratio * sqrt(stiffness * mass). */
  damping: number;
  mass: number;
  /** Original M3 damping ratio, kept for reference. */
  dampingRatio: number;
}

export type SpringName =
  | 'fastSpatial'
  | 'defaultSpatial'
  | 'slowSpatial'
  | 'fastEffects'
  | 'defaultEffects'
  | 'slowEffects';

export type MotionSchemeName = 'expressive' | 'standard';

export const springs: Record<MotionSchemeName, Record<SpringName, SpringToken>> = ${JSON.stringify(
  { expressive: springs(spec.motion.expressive), standard: springs(spec.motion.standard) },
  null,
  2,
)};

/** Corner radii in px. "full" is handled by components as height / 2. */
export const shapeCorner = ${JSON.stringify(
  Object.fromEntries(Object.entries(shapePx).map(([k, v]) => [k.replace(/-(\w)/g, (_, c) => c.toUpperCase()), v])),
  null,
  2,
)} as const;

export type ShapeCornerName = keyof typeof shapeCorner;

export const durationMs = ${JSON.stringify(
  Object.fromEntries(
    Object.entries<number>(spec.motion.duration).map(([k, v]) => [k.replace(/-(\w)/g, (_, c) => c.toUpperCase()), v]),
  ),
  null,
  2,
)} as const;

export const easing = ${JSON.stringify(
  Object.fromEntries(
    Object.entries<number[]>(spec.motion.easing).map(([k, v]) => [k.replace(/-(\w)/g, (_, c) => c.toUpperCase()), v]),
  ),
  null,
  2,
)} as const;

export const stateLayerOpacity = ${JSON.stringify(spec.stateLayerOpacity, null, 2)} as const;

/**
 * The spacing scale, in px. Chosen for this library rather than captured: Material publishes no
 * spacing tokens. Every step is a multiple of the 4dp grid, and the middle of the scale is made
 * of ListTokens values, so a layout agrees with the components it holds.
 */
export const space = ${JSON.stringify(spacePx, null, 2)} as const;

export type SpaceName = keyof typeof space;

export const colorSchemes = ${JSON.stringify({ light, dark }, null, 2)} as const;
`;
writeFileSync(resolve(outDir, 'tokens.ts'), ts);

console.log(
  `tokens: ${Object.keys(light).length} color roles x2, ${Object.keys(spec.typescale).length} type styles, ${
    Object.keys(shapePx).length + 1
  } corners, 12 springs -> src/tokens/generated/`,
);

// ---------- Write the shape library ----------
/*
 * tokens/m3-shapes.json is captured separately, by `pnpm capture-shapes`, because it comes from
 * MaterialShapes.kt rather than from a generated token object. It is emitted as a module here so
 * the descriptors are typed and the declaration build never has to emit a JSON import.
 */
const shapesPath = resolve(root, 'tokens/m3-shapes.json');
const shapeSpec = JSON.parse(readFileSync(shapesPath, 'utf8')) as {
  shapes: Record<string, unknown>;
};
const shapesTs = `/* Generated by scripts/build-tokens.mts from tokens/m3-shapes.json. Do not edit. */
/* The 35 M3 Expressive shapes, as descriptors. src/shapes turns one into cubics. */
import type { ShapeDescriptor } from '../descriptor';

export const shapeDescriptors = ${
  // One line per shape: indenting every vertex would triple the size of a file nobody edits.
  `{\n${Object.entries(shapeSpec.shapes)
    .map(([name, descriptor]) => `  ${name}: ${JSON.stringify(descriptor)},`)
    .join('\n')}\n}`
} as const satisfies Record<
  string,
  ShapeDescriptor
>;

export type ShapeName = keyof typeof shapeDescriptors;
`;
const shapesDir = resolve(root, 'src/shapes/generated');
mkdirSync(shapesDir, { recursive: true });
writeFileSync(resolve(shapesDir, 'shapes.ts'), shapesTs);
console.log(`shapes: ${Object.keys(shapeSpec.shapes).length} descriptors -> src/shapes/generated/`);

// ---------- Write SCSS ----------
// Values only. The hand-written public Sass API in src/scss/ `@use`s this partial, so the
// generated file stays pure data and the ergonomics live in versioned source.
const scssDir = resolve(root, 'src/scss');
mkdirSync(scssDir, { recursive: true });

type Entry = [string, string | number];
const sassMap = (entries: Entry[], indent = '  ') =>
  `(\n${entries.map(([k, v]) => `${indent}"${k}": ${v},`).join('\n')}\n${indent.slice(2)})`;
const byKey = (a: Entry, b: Entry) => a[0].localeCompare(b[0]);

const typescaleEntries: Entry[] = Object.entries<any>(spec.typescale).map(([style, t]) => [
  style,
  sassMap(
    [
      ['font', t.font],
      ['size', rem(t.size)],
      ['line-height', rem(t.lineHeight)],
      ['tracking', `${t.tracking}px`],
      ['weight', t.weight],
    ],
    '    ',
  ),
]);

const scss = `// GENERATED by scripts/build-tokens.mts. Do not edit.
// Seed: ${theme.seed}
//
// Token values only. The public API (functions, the theme() mixin) is in src/scss/_api.scss.

$colors-light: ${sassMap(Object.entries(light).sort(byKey))};

$colors-dark: ${sassMap(Object.entries(dark).sort(byKey))};

$shape: ${sassMap([
  ...Object.entries(shapePx).map(([k, v]): Entry => [k, `${v}px`]),
  ['full', '9999px'],
])};

$durations: ${sassMap(
  Object.entries<number>(spec.motion.duration).map(([k, v]): Entry => [k.replace(/-(\d)$/, '$1'), `${v}ms`]),
)};

$easings: ${sassMap(
  Object.entries<number[]>(spec.motion.easing).map(([k, v]): Entry => [k, `cubic-bezier(${v.join(', ')})`]),
)};

$state-layer-opacity: ${sassMap(Object.entries<number>(spec.stateLayerOpacity).sort(byKey))};

$elevation: ${sassMap(
  Object.entries<number>(spec.elevation).map(([k, v]): Entry => [k.replace('Level', 'level'), v]),
)};

$typescale: ${sassMap(typescaleEntries)};

// Ours, not Google's: Material publishes no spacing tokens.
$spacing: ${sassMap(Object.entries(spacePx).map(([k, v]): Entry => [k, `${v}px`]))};
`;
writeFileSync(resolve(scssDir, '_data.scss'), scss);
console.log(`scss:   src/scss/_data.scss`);
