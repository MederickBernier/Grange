import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Read the stylesheets as text rather than importing them: an import hands back the compiled
 * class map, which is the output this is trying to check the input of.
 */
function filesUnder(dir: string, suffix: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path, suffix));
    else if (entry.name.endsWith(suffix)) found.push(path);
  }
  return found;
}

/**
 * Every class in a `*.module.scss` is scoped, including one named after another component's
 * stable hook class: `.grange-navigation-item` compiles to `grange-grange-navigation-item-xxxx`
 * and matches nothing. The stylesheet still builds and the rule silently never applies, which is
 * exactly the kind of thing no other test would catch. A hook class in a module stylesheet has
 * to be wrapped in `:global()`.
 */
describe('module stylesheets', () => {
  const sheets = filesUnder('src', '.module.scss');

  it('finds the stylesheets to check', () => {
    expect(sheets.length).toBeGreaterThan(20);
  });

  it('wraps every hook class in :global, so it is not scoped out of existence', () => {
    const unscoped: string[] = [];
    for (const path of sheets) {
      const source = readFileSync(path, 'utf8');
      source.split('\n').forEach((line, index) => {
        // Only selectors: a hook class also appears in comments and in keyframes names.
        if (!line.includes('{')) return;
        for (const match of line.matchAll(/(:global\()?\.grange-[\w-]+/g)) {
          if (!match[1]) unscoped.push(`${path}:${index + 1} ${match[0]}`);
        }
      });
    }
    expect(unscoped).toEqual([]);
  });
});
