# Repository Guidelines

## Project Structure & Module Organization
- `index.html`: Main UI and layout.
- `styles.css`: Screen and print styles for the recipe card.
- `script.js`: JSON parsing, validation, and card rendering.
- `recipes/sample.json`: Example recipe payload you can load via the UI.

## Build, Test, and Development Commands
- Open locally: double‑click `index.html` or serve via `python -m http.server`.
- Print: use the on‑page Print button or your browser’s print dialog.
- No build step or external deps; it’s a static app.

## Coding Style & Naming Conventions
- HTML/CSS/JS only; no frameworks.
- Indentation: 2 spaces; prefer const/let over var.
- Filenames: lowercase with hyphens, e.g., `recipe-card` if adding modules.
- Linting is manual; keep functions small and pure where possible.

## Testing Guidelines
- Manual test with `recipes/sample.json` via the file picker.
- Validate errors: try removing required fields (`title`, `ingredients`, `steps`).
- Cross‑browser sanity: Chrome, Firefox, and Safari for layout/print.

## Commit & Pull Request Guidelines
- Commit messages: concise imperative subject, e.g., "Add nutrition panel".
- Scope small changes; reference issues with `#id` when applicable.
- PRs must include: brief description, before/after screenshots (print view), and test notes (JSON used, browser).

## Security & Data Tips
- The app parses local files only; no network transfer on upload.
- Validate inputs defensively; ignore unknown fields and handle arrays/strings for ingredients gracefully.

## Recipe JSON Shape (Example)
- Required: `title`, `ingredients`, `steps`.
- Optional: `time`, `servings`, `badges`, `hero.image`, `hero.alt`, `nutrition`, `notes`, `theme`.
