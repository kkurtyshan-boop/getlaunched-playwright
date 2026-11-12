const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      // `browser` globals cover code passed to page.evaluate()/waitForFunction()
      // (e.g. `location`, `document`), which runs in the browser, not Node.
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Playwright's fixture signature is `({ neededFixture }, use) => {}` —
      // destructuring `{}` when a fixture requests none is the documented,
      // idiomatic pattern (see tests/fixtures/project.fixture.js), not a mistake.
      'no-empty-pattern': 'off',
    },
  },
  {
    files: ['scripts/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'test-reports/', '.playwright-mcp/', 'tests/.auth/', 'tmp/'],
  },
];
