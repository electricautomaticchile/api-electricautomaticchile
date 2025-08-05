module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "controllers/**/*.ts",
    "middleware/**/*.ts",
    "services/**/*.ts",
    "!**/*.d.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  verbose: true,
};
