export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js", 
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js"
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**"
  ],
  coverageThreshold: {
    global: {
      lines: 25,
      functions: 25,
    },
  },
};
