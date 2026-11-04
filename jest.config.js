/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts', '**/*.spec.ts'],
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    // apps/* are standalone projects with their own test runners (e.g. apps/silvr uses vitest/Playwright).
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/apps/']
};
