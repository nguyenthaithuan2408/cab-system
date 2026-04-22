module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"]
};
