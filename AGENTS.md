# Repository Guidelines

## Project Structure & Module Organization

- Repository root: React Native 2048 app (`App.js`, `index.js`, `package.json`, `android/`, `ios/`).
- `web/`: Standalone browser version in `web/index.html` with inline styles and game logic.
- `rn/`: Legacy React Native project kept for reference; new work should target the root app.

## Build, Test & Development Commands

- Install JS dependencies: `npm install` from the repository root.
- React Native dev: `npm run start` to start Metro, `npm run android` / `npm run ios` to run on device or simulator.
- Android packaging (from repo root): `cd android && ./gradlew assembleDebug` or `./gradlew assembleRelease`.
- Web version: open `web/index.html` directly in a browser, or serve it with any static server (for example `cd web && npx serve .`).
- There is currently no automated test suite or build pipeline configured in this repo.

## Coding Style & Naming Conventions

- Use modern JavaScript (ES2015+), React function components, and hooks as shown in `rn/App.js`.
- Prefer 2-space indentation, single quotes, semicolons, and descriptive camelCase names for variables and functions.
- Use UPPER_SNAKE_CASE for shared constants (for example `GRID_SIZE`, `BOARD_PADDING`), and keep platform-specific logic (`Platform.OS` checks) localized.

## Testing Guidelines

- When adding tests, prefer Jest and React Native Testing Library for `rn/`, and small pure helpers extracted from game logic.
- Place tests under `rn/__tests__/` or beside the module as `*.test.js`, and keep scenarios focused (movement, merge rules, scoring, and persistence).
- For manual checks, verify swipe/keyboard controls, score and best-score persistence, and correct game-over behavior for both RN and web versions.

## Commit & Pull Request Guidelines

- Write concise, imperative commit messages (for example `Add swipe history panel`, `Refactor move logic`), consistent with the existing short English subjects.
- Keep each pull request scoped to a coherent change set; avoid mixing large refactors with behavioral changes without explanation.
- In PR descriptions, summarize the intent, list key changes, note any breaking behavior, and include screenshots or short recordings for UI changes when possible.

## Security & Configuration Tips

- This project is fully client-side; never hard-code secrets, tokens, or private endpoints into `web/index.html` or React Native code.
- Keep local configuration (emulators, keystores, API keys) in untracked files or environment variables rather than committing them to the repository.
