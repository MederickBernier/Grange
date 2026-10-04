import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  type: string;
}

/**
 * The stories to shoot, read from Storybook's own index rather than listed here, so a new story
 * is covered the moment it exists.
 */
function stories(): StoryEntry[] {
  let index: { entries: Record<string, StoryEntry> };
  try {
    index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8'));
  } catch {
    throw new Error('No storybook-static/index.json. Run `pnpm build-storybook` first, or `pnpm visual`.');
  }
  return Object.values(index.entries).filter((entry) => entry.type === 'story');
}

/**
 * Stories that cannot be compared against a picture, with the reason.
 *
 * Empty, and deliberately kept: reduced motion plus disabled animations turned out to cover
 * everything, including the indeterminate progress indicators, the morphing loading indicator and
 * the motion playground, each of which was checked over three runs before being left in. A story
 * driven by a timer or a random value would belong here, with the reason beside it.
 */
const UNSHOOTABLE: Array<[prefix: string, why: string]> = [];

const skipReason = (id: string) => UNSHOOTABLE.find(([prefix]) => id.startsWith(prefix))?.[1];

/** Both colour schemes, which the preview sets from a Storybook global. */
const THEMES = ['light', 'dark'] as const;

for (const story of stories()) {
  for (const theme of THEMES) {
    test(`${story.id} (${theme})`, async ({ page }) => {
      const why = skipReason(story.id);
      test.skip(Boolean(why), why);

      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);

      /*
       * Storybook renders asynchronously, so wait for the story rather than for the document.
       * Not `not.toBeEmpty()`: that reads an element's text, and plenty of stories here draw only
       * icons, which would make the root look empty forever.
       *
       * The second half of the selector is for a story whose whole output is portalled — a
       * window, a dialog opened on mount. React Aria's Overlay portals straight into `body`
       * with no wrapper, so the story root stays empty and waiting only on it times out.
       *
       * It matches one of this library's own hook classes rather than "any div in body", which
       * is what it said first and which also matched Storybook's loading spinner: the wait then
       * passed immediately and the baseline was a picture of the spinner.
       */
      await expect(
        page.locator('#storybook-root > *, body > [class*="grange-"]').first(),
      ).toBeAttached();
      // A story whose first paint is in a fallback font would otherwise be shot mid-swap.
      await page.evaluate(() => document.fonts.ready);

      await expect(page).toHaveScreenshot(`${story.id}-${theme}.png`, { fullPage: true });
    });
  }
}
