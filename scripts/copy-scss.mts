/**
 * Copies the public Sass API into dist/ after `vite build` has emptied it.
 *
 * Consumers reach it as `@use 'grange-react/scss' as grange;`. The directory layout is kept
 * flat and identical to src/scss/, so the `@use 'data'` and `@use 'api'` references inside
 * resolve the same whether Sass is compiling from source or from the published package.
 *
 * Run with: pnpm copy-scss (part of pnpm build)
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'src/scss');
const to = resolve(root, 'dist/scss');
mkdirSync(to, { recursive: true });

const files = readdirSync(from).filter((f) => f.endsWith('.scss'));
if (!files.includes('_data.scss')) {
  throw new Error('src/scss/_data.scss is missing. Run `pnpm tokens` before copying.');
}
for (const file of files) copyFileSync(resolve(from, file), resolve(to, file));

console.log(`scss:   ${files.length} files -> dist/scss/`);
