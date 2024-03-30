export default {
  preset: 'ts-jest',
  verbose: true,
  rootDir: '../',
  roots: ['<rootDir>'],
  globals: {
    'ts-jest': {
      isolatedModules: true, // Avoid type checking to speed up tests
    },
  },
  maxWorkers: 1,
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^@verdzie/server/(.*)$': '<rootDir>/src/$1',
    '^@verdzie/test/(.*)$': '<rootDir>/test/$1',
    '^@verdzie/scripts/(.*)$': '<rootDir>/scripts/$1',
  },
  testRegex: '.e2e.spec.ts$',
  reporters: ['default'],
  testLocationInResults: true,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/src/testing/test-env.ts'],
};
