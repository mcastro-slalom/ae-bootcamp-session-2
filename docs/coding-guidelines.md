# Coding Guidelines

These guidelines help keep the TODO app understandable, secure, and straightforward to extend. Follow established patterns in the relevant package and keep changes focused on the requested behavior.

## Core Principles

- **DRY (Don't Repeat Yourself):** Reuse existing helpers and components when they represent the same behavior. Extract shared logic when duplication is meaningful, but do not create abstractions for one-off code without a clear benefit.
- **KISS (Keep It Simple):** Prefer the simplest implementation that satisfies the requirements. Avoid unnecessary layers, configuration, dependencies, and clever control flow.
- **YAGNI (You Aren't Gonna Need It):** Implement current functional requirements rather than speculative features. Expand scope only when requirements call for it.
- **Separation of concerns:** Keep UI rendering, user interaction, API behavior, and data access understandable and appropriately separated. Avoid coupling unrelated responsibilities in one large component or route handler.
- **Consistency:** Match the language, naming, file organization, and formatting conventions already used in the package being changed. Backend code uses CommonJS; frontend code uses React and ES module imports.

## JavaScript and Structure

- Use descriptive names for variables, functions, components, and files. Prefer names that explain intent over abbreviations or one-letter names.
- Keep functions and React components focused. Extract a helper or component when it improves clarity or enables meaningful reuse, not merely to reduce line count.
- Prefer clear early returns and straightforward control flow. Avoid deeply nested conditionals and duplicated branches.
- Use `const` by default and `let` when reassignment is needed. Avoid mutable shared state unless the behavior requires it.
- Handle asynchronous operations explicitly. Surface failures through the established error path instead of silently ignoring them.
- Add comments only when they explain non-obvious reasoning or constraints. Keep comments accurate as code changes.

## React and Frontend

- Build on the existing React setup and component patterns. Keep state close to the components that own it, and do not mutate state values directly.
- Use stable keys when rendering task collections and keep UI updates consistent with the result of API operations.
- Prefer semantic HTML and native controls. Ensure controls have clear labels and remain usable with a keyboard and assistive technology.
- Keep presentation rules in the existing CSS files and reuse shared styles or tokens where appropriate. Refer to [UI Guidelines](ui-guidelines.md) for visual, responsive, and accessibility requirements.
- Do not add a dependency when the current platform or project utilities can solve the problem cleanly.

## Backend and Data

- Keep Express routes focused on HTTP concerns and return meaningful status codes and response bodies consistent with the existing API contract.
- Validate all client-provided input on the server; frontend validation is helpful feedback, not a security boundary.
- Use parameterized SQL statements for values. Never concatenate untrusted input into a query.
- Keep errors useful to callers without exposing internal stack traces or implementation details in API responses.
- Read configuration, including ports, from environment variables with sensible defaults; avoid embedding environment-specific values in application logic.

## Scope and Maintenance

- Preserve existing public behavior and interfaces unless the requested change requires changing them. Avoid unrelated refactors in feature work.
- Update relevant documentation when behavior, configuration, or developer workflows change.
- Add or update appropriate tests for new behavior and bug fixes. Follow [Testing Guidelines](testing-guidelines.md) for test types, locations, and conventions.
- Before finishing, run the narrowest relevant checks and address errors introduced by the change.