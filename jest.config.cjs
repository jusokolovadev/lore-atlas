/* global module */

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['fake-indexeddb/auto'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@ui-kit/core$': '<rootDir>/node_modules/@ui-kit/core/dist/index.js',
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.(css)$': '<rootDir>/src/test/styleMock.cjs',
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
        useESM: false,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.pnpm|@ui-kit/core)',
    'node_modules/.pnpm/(?!(?:@ui-kit\\+core)@)',
  ],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  clearMocks: true,
};
