module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.ts'],

  silent: true,
  verbose: true,

  // Typescipt compiler configuration.
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json',
    },
  },

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['clover', 'lcov', 'text'],
  collectCoverageFrom: ['./src/**/*.ts', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: -10,
    },
  },
};
