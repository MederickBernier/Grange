import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression over the Storybook stories.
 *
 * The point is the thing no other test here catches: a change to a token, a stylesheet or a
 * shape redraws a component without failing a single assertion. These tests take a picture of
 * every story and compare it with the one in `visual/__screenshots__`.
 *
 * Determinism is the whole game, so:
 *
 * - `reducedMotion: 'reduce'` is on for every test. Components that animate on mount settle
 *   immediately, and the loading indicator holds a single shape instead of morphing, because it
 *   reads the same media query.
 * - `animations: 'disabled'` stops CSS animations and transitions at their end state.
 * - The viewport and the device scale factor are pinned, because a screenshot is only comparable
 *   against another one taken the same size.
 *
 * What is not pinned is the font. Nothing here loads a webfont — the typeface tokens fall back to
 * the system sans — so the baselines are specific to the machine that took them. Playwright
 * already suffixes them with the platform; on a machine with different fonts installed, run
 * `pnpm visual:update` and expect a large diff. A container image is the real fix and is not set
 * up here.
 */
export default defineConfig({
  testDir: './visual',
  snapshotPathTemplate: 'visual/__screenshots__/{arg}{-platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://127.0.0.1:6007',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  },

  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Subpixel text rendering moves a handful of pixels between runs on the same machine; a
      // real visual change moves far more than this.
      maxDiffPixelRatio: 0.002,
    },
  },

  webServer: {
    // `npx`, not `pnpm`: this also runs inside the Playwright container, where the pnpm shim is
    // not necessarily on PATH. The pnpm script stays for people.
    // `--host 127.0.0.1`, because vite's default `localhost` resolves to IPv6 only inside the
    // Playwright container, where nothing then answers on 127.0.0.1.
    command: 'npx vite preview --outDir storybook-static --port 6007 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:6007/iframe.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
