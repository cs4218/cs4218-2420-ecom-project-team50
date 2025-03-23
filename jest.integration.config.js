export default {
  // display name
  displayName: "integration",

  // when testing backend
  testEnvironment: "node",

  // setup env variables
  setupFiles: ['./jest.integration.setup.js'],

  // only run these tests
  // which test to run
  testMatch: [
    "<rootDir>/tests/integration/*.test.js"
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/productController.js",
    "controllers/authController.js",
    "routes/productRoutes.js",
    "routes/authRoute.js",
    "models/userModel.js",
    "models/categoryModel.js",
    "models/orderModel.js",
    "models/productModel.js",
    "models/userModel.js",
    "models/categoryModel.js",
    "models/orderModel.js",
  ],
  coverageThreshold: {
    global: {
      lines: 25,
      functions: 25,
    },
  },
};
