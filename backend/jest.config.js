module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  clearMocks: true,
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/middleware/**/*.js',
    '!src/services/matching/**/node_modules/**',
  ],
};
