import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook is this library's documentation, not only its workbench.
 *
 * Every component and every story carries a written explanation of what it does and why it is
 * built the way it is — which rendered nowhere until `addon-docs` was turned on. With it, the
 * prose in the source becomes the reference published at the project's GitHub Pages site, so
 * there is one copy of the documentation and it lives next to the code it describes.
 */
const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    // Autodocs: a Docs page per component group, built from the JSDoc above `meta` and each story.
    '@storybook/addon-docs',
    /*
     * axe, in a panel beside every story. It is not a substitute for the behaviour tests —
     * axe cannot tell whether a menu's arrow keys work — but it catches contrast and labelling
     * regressions while a component is being built, which is the cheapest time to find them.
     */
    '@storybook/addon-a11y',
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  /*
   * The site is served from a subpath on GitHub Pages (`/Grange/`), which Vite needs told at
   * build time or every asset resolves against the domain root.
   */
  viteFinal: (config) => ({ ...config, base: process.env.STORYBOOK_BASE_PATH ?? config.base }),
};
export default config;
