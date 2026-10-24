# Testing Guidelines

All new features and bug fixes should include appropriate tests. Tests should be maintainable, deterministic, isolated, and focused on observable behavior. Choose the narrowest test level that verifies the behavior, adding broader coverage when a change crosses component or service boundaries.

## Unit Tests

- Use Jest to test individual backend functions and React components in isolation.
- Name unit test files `*.test.js` or `*.test.ts` and name each file for the implementation it covers (for example, `app.test.js` for `app.js`).
- Place backend unit tests in `packages/backend/__tests__/`.
- Place frontend unit tests in `packages/frontend/src/__tests__/`.
- Keep tests focused on one behavior or outcome. For React, prefer assertions about rendered, user-observable behavior over implementation details.
- Mock or stub external dependencies at the boundary when needed so unit tests remain isolated and predictable.

## Integration Tests

- Use Jest and Supertest to exercise backend API endpoints with HTTP requests against the Express application.
- Place integration tests in `packages/backend/__tests__/integration/`.
- Name integration test files `*.test.js` or `*.test.ts` and use a clear name for the API or behavior under test (for example, `todos-api.test.js`).
- Verify successful responses and relevant validation, missing-resource, and error cases. Assert status codes and response data that form part of the API contract.
- Give each test its own data and clean up resources it creates. Do not depend on the in-memory database or state left by another test.

## End-to-End Tests

- Use Playwright as the required browser automation framework to verify complete user workflows through the UI.
- Place E2E tests in `tests/e2e/` and name files `*.spec.js` or `*.spec.ts` after the user journey (for example, `todo-workflow.spec.js`).
- Use one browser only and follow the Page Object Model (POM) pattern to keep page interactions reusable and tests readable.
- Keep the suite to 5-8 critical user journeys. Prioritize happy paths and key edge cases instead of repeating lower-level coverage or attempting exhaustive combinations.
- Keep each journey independent: create its own data and do not rely on test order or state from a previous run.

## Test Isolation and Lifecycle

- Every test must be isolated and independently runnable. Set up the data and state it needs; do not make one test depend on another test's execution or output.
- Use appropriate setup and teardown hooks to initialize and release resources, reset mocks, and remove test data. Tests must continue to pass across repeated runs.
- Avoid shared mutable fixtures. When shared setup is necessary, ensure it is reset between tests and cannot make results order-dependent.
- Prefer deterministic assertions and avoid arbitrary timeouts. Wait for observable conditions when testing asynchronous behavior.

## Port Configuration

- Read server ports from the `PORT` environment variable and provide sensible defaults. Do not hardcode a port in test configuration or browser URLs.
- The backend default is `3030`:

  ```js
  const PORT = process.env.PORT || 3030;
  ```

- The React development server defaults to `3000`; it can be overridden through `PORT`.
- Configure test runners and Playwright to use the selected port or a configured base URL so local and CI/CD environments can allocate ports dynamically.

## Maintainability

- Keep tests concise and name them for the behavior they verify.
- Reuse existing helpers and fixtures when they improve clarity, while keeping each test's required setup apparent.
- Test public behavior and meaningful contracts; avoid coupling tests to private implementation details or incidental markup.
- When behavior changes, update or replace assertions that no longer describe the intended behavior. Do not weaken tests just to make them pass.
- Run the relevant test suite after changes, and run the broader suite when shared behavior or cross-layer workflows are affected.