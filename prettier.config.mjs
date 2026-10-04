/**
 * Prettier, configured to match the code that already exists rather than to reformat it.
 *
 * The one setting that matters is the width. This codebase was written to roughly 100–110
 * columns by hand: the 99th percentile line is 106 characters, and only 283 of 46,000 lines are
 * over 110. Picking 110 therefore reflows almost nothing, which keeps the diff that introduces
 * formatting small enough to read.
 *
 * Markdown is left alone — see .prettierignore. The prose in the README and the roadmap is
 * wrapped by hand to say what it means, and the catalog's tables would be realigned wholesale
 * for no gain.
 */
export default {
  printWidth: 110,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};
