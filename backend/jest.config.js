module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|js)$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
