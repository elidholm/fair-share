/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverage: true,
  coverageProvider: "v8",
  testEnvironment: "node",
  moduleFileExtensions: ["js"],
  testMatch: ["**/src/**/*.test.js"],
  collectCoverageFrom: ["**/src/**/*.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/src/test/"],
};

export default config;
