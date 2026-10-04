import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

/**
 * ESLint, flat config.
 *
 * Three things are being asked of it, in order of how much they are worth here:
 *
 * **Accessibility.** This library's whole argument is that the behaviour is right, so
 * `jsx-a11y` is the plugin that earns its place: it catches a label pointing at nothing, a
 * role on an element that cannot carry it, a handler on a `div`. Several of its rules are
 * turned off below, each with the reason, because they are wrong about a component library
 * that builds its own controls out of hooks.
 *
 * **Correctness that types alone miss.** The type-aware rules are on — a floating promise and
 * an async function passed where a void one is expected are both real bugs that `tsc` is happy
 * with. They cost a type-check's worth of time per run, which is why `lint` is its own script
 * rather than part of `test`.
 *
 * **Hooks.** `react-hooks` is not optional in a codebase this full of them.
 *
 * Formatting is Prettier's; `eslint-config-prettier` comes last and switches off every rule
 * that would argue with it.
 */
export default tseslint.config(
  {
    ignores: [
      'dist',
      'storybook-static',
      'test-results',
      'playwright-report',
      'src/tokens/generated',
      'src/shapes/generated',
      'src/scss/_data.scss',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          /*
           * The build scripts and the config files are in no tsconfig — `tsconfig.json` covers
           * src, stories and .storybook, and the scripts are run through tsx. Listing them
           * here lints them against the default project rather than leaving nine files
           * unparsed, which is the state they were in before this config existed.
           */
          allowDefaultProject: [
            // vite.config.ts only: playwright.config.ts is already in tsconfig.json.
            'vite.config.ts',
            '*.config.mjs',
            '.storybook/*.ts',
            '.storybook/*.tsx',
            'scripts/*.mts',
          ],
          /*
           * The default is eight and there are nine of them. The flag shouts because a large
           * default project is slow; nine files is not, and the alternative — putting the
           * build scripts into tsconfig.json — would typecheck them under
           * `noUncheckedIndexedAccess`, which they were deliberately written outside of.
           */
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 12,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    /*
     * The React version is stated rather than detected. Detection reads package.json off the
     * filesystem through an ESLint API that moved, which is also why `eslint` is pinned to 9
     * here: eslint-plugin-react does not run on 10 yet.
     */
    settings: { react: { version: '19.0' } },
    rules: {
      /*
       * An unused argument that is there to document a signature — a render prop's second
       * parameter, a handler's event — is written with a leading underscore and meant.
       */
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],

      /*
       * The non-null assertion is how this codebase reads an array under
       * `noUncheckedIndexedAccess` once it has already checked the length. Banning it would
       * mean either turning that compiler flag off or writing a guard that cannot fail.
       */
      '@typescript-eslint/no-non-null-assertion': 'off',

      /*
       * React Aria hands back prop objects typed as broad DOM attribute bags, and spreading
       * them is the entire pattern. `no-unsafe-assignment` and its relatives would fire on
       * every component in the library and say nothing true about any of them.
       */
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // The two type-aware rules worth the run time: both are bugs tsc accepts.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        // A handler returning a promise is ordinary React; an `if (promise)` is not.
        { checksVoidReturn: false },
      ],

      /*
       * Prop types are the TypeScript interface above each component. The plugin cannot see
       * them through the config helpers, and would ask for a runtime copy of every one.
       */
      'react/prop-types': 'off',

      /*
       * Several components deliberately put a role on an element that is not its default:
       * a `span` that `useButton` has made into a button, a `li` that is a drop indicator.
       * The hooks supply the keyboard handling these rules are checking for, and they cannot
       * see that.
       */
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',

      /*
       * Every `autoFocus` in this library is a React Aria component's prop — a `FocusScope`,
       * a `Calendar` in a popover, a `Menu` opened at a pointer — and not the HTML attribute
       * the rule is about. An overlay that does not take focus when it opens is an overlay
       * whose Escape and arrow keys do nothing, which is a worse accessibility outcome than
       * the one the rule is guarding against. The plugin cannot tell the two apart.
       */
      'jsx-a11y/no-autofocus': 'off',

      /*
       * A focusable separator is the window-splitter pattern, and a focusable group is how a
       * scroll container is made scrollable from the keyboard. Both are deliberate here —
       * the splitter's bar, the bottom sheet's drag handle, the carousel's viewport — so the
       * roles are allowed rather than disabled one site at a time. Anything with no role at
       * all still has to say why, at the line.
       */
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['separator', 'group', 'tabpanel'] }],
    },
  },

  {
    // Tests say what they mean about types; the strictness that helps the library hinders here.
    files: ['**/*.test.ts', '**/*.test.tsx', 'visual/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      /*
       * `screen.getByRole(...) as HTMLElement` is how a test narrows a query's result. The
       * rule would rather the generic were written out at each call; in a test that reads
       * worse and proves nothing.
       */
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',

      /*
       * An `async` test body with no `await` left in it is usually one that had one a moment
       * ago. Harmless, and not worth a rule that fires while a test is being written.
       */
      '@typescript-eslint/require-await': 'off',
    },
  },

  {
    // Build scripts run in Node and are allowed to say so.
    files: ['scripts/**/*.mts', '*.config.ts', '*.config.mjs', '.storybook/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  prettier,
);
