/**
 * Captures Compose Material 3 token files into tokens/m3-expressive.json.
 *
 * The component token values in that file are Google's, read out of the generated token objects
 * in androidx (Apache 2.0, see NOTICE). Doing it with a script rather than by hand means the
 * values are verbatim, the provenance is recorded, and adding the next component is one line.
 *
 * Run with: pnpm capture-tokens FabSmall SplitButtonMedium ...
 * Names are the Compose object name without the "Tokens" suffix, which is also the key used in
 * the JSON. With no arguments it refreshes everything already captured.
 *
 * Needs network. Deliberately not part of `pnpm build`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = resolve(root, 'tokens/m3-expressive.json');
const BASE =
  'https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens';

/**
 * Rewrites a Kotlin value into the shape this file already stores: a dp or float literal stays
 * as it is, a shape key loses its holder, and the other kinds carry a short tag so a colour role
 * is never mistaken for a shape name.
 */
const KINDS: Array<[RegExp, string]> = [
  [/^ColorSchemeKeyTokens\./, 'color:'],
  [/^ElevationTokens\./, 'elevation:'],
  [/^TypographyKeyTokens\./, 'type:'],
  [/^MotionSchemeKeyTokens\./, 'motion:'],
  [/^ShapeKeyTokens\./, ''],
  [/^ShapeTokens\./, ''],
];

function normalise(value: string): string {
  const raw = value.trim().replace(/,$/, '');
  for (const [pattern, tag] of KINDS) {
    if (pattern.test(raw)) return raw.replace(pattern, tag);
  }
  return raw;
}

/** Pulls every token out of one generated Kotlin object, in the three forms they are declared in. */
function parse(source: string): Record<string, string> {
  const out: Record<string, string> = {};

  // inline val Name: Type \n get() = value
  for (const m of source.matchAll(/inline val (\w+)\s*:[^\n]*\n\s*get\(\) = ([^\n]+)/g)) {
    out[m[1]!] = normalise(m[2]!);
  }
  // val Name = value  /  const val Name = value
  for (const m of source.matchAll(/^[ \t]*(?:const )?val (\w+) = ([^\n]+)$/gm)) {
    out[m[1]!] = normalise(m[2]!);
  }
  return out;
}

async function capture(name: string) {
  const url = `${BASE}/${name}Tokens.kt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} for ${url}`);
  const source = await res.text();

  const tokens = parse(source);
  if (Object.keys(tokens).length === 0)
    throw new Error(`${name}: parsed no tokens, the upstream format may have changed`);

  const version = /\/\/ VERSION: ([\w_]+)/.exec(source)?.[1];
  return { tokens, version };
}

const json = JSON.parse(readFileSync(tokensPath, 'utf8'));
json.components ??= {};
json.$meta ??= {};

const names: string[] = process.argv.slice(2);
const targets = names.length > 0 ? names : Object.keys(json.components);
const versions = new Set<string>();

for (const name of targets) {
  const { tokens, version } = await capture(name);
  const existing: Record<string, string> = json.components[name] ?? {};

  // Merged, not replaced. Some values are commented out upstream behind a TODO (FabMedium's
  // ContainerShape is, with Google's intended value right there in the comment), and a capture
  // must not quietly delete one of those and leave us inventing a number.
  const kept = Object.keys(existing).filter((key) => !(key in tokens));
  const merged = { ...existing, ...tokens };

  const changed = JSON.stringify(existing) !== JSON.stringify(merged);
  json.components[name] = merged;
  if (version) versions.add(version);

  const note = kept.length > 0 ? `  (kept local: ${kept.join(', ')})` : '';
  console.log(
    `${changed ? 'updated' : '   same'}  ${name.padEnd(28)} ${Object.keys(tokens).length} upstream${note}`,
  );
}

json.$meta.componentTokensVersion = [...versions].sort().join(', ');
json.$meta.componentTokensSource = 'androidx-main compose/material3 tokens';
writeFileSync(tokensPath, `${JSON.stringify(json, null, 2)}\n`);
console.log(
  `\n${targets.length} objects -> tokens/m3-expressive.json (upstream VERSION ${json.$meta.componentTokensVersion})`,
);
