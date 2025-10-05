# Recipe Printer

A lightweight static app to load recipe JSON and render printable cards.

## Quick Start
- Open `index.html` directly, or run `python -m http.server` and visit `http://localhost:8000`.
- Click "Load Sample" to load `recipes/sample.json` (when opened via `file://`, use a local server so the fetch can read the file), upload your own JSON, or use "Paste JSON" to paste raw JSON text.
- Print via the on-page button or your browser.

## Deploy to GitHub Pages
This repo includes a GitHub Actions workflow that deploys the static site to GitHub Pages on every push to `main`.

Steps:
- Rename the repository to `recipe-printer` (or your preferred name) on GitHub.
- In your GitHub repo, go to Settings → Pages and set "Source" to "GitHub Actions".
- Push to `main` (or use the "Run workflow" button). The workflow at `.github/workflows/gh-pages.yml` uploads the repository as an artifact and publishes it to Pages.

Notes:
- The app uses relative paths, so it works whether hosted at a custom domain or under `/REPO-NAME/`.
- If using project pages (default), the site URL will be `https://<user>.github.io/<repo>/`.

## Use with the Custom GPT
You can generate compatible recipe JSON using this GPT: https://chatgpt.com/g/g-68e29cdf78e48191840c2823eaa319bf-recipe-generator

- Open the link and start a chat.
- Set the System Prompt from this README (or use the GPT’s built-in instructions).
- Send your user prompt (see example below) and wait for JSON output.
- Copy the JSON to a file like `my-recipes.json` and load it via "Load Recipe JSON".
- For bulk cards, ask the GPT to return an array or `{ "recipes": [...] }`.

## JSON Input
- Accepts a single recipe object, an array of recipes, or `{ "recipes": [...] }`.
- Required fields per recipe: `title`, `ingredients` (array of strings or `{ item, quantity }`), `steps`.
- Optional: `id`, `time`, `servings`, `badges`, `nutrition` (object), `notes` or `chickenPair`, `theme` or `color`.

## Copyable System Prompt
Use this as a system prompt in an LLM to generate valid payloads for this app. Paste the model’s JSON output into a `.json` file and load it.

```
You are generating JSON for a recipe card app.
Output ONLY valid JSON, no prose. Use ASCII quotes.

Top-level may be:
- A single recipe object, OR
- An array of recipe objects, OR
- An object { "recipes": [ ... ] }.

Each recipe MUST include:
- title: string
- ingredients: array of strings OR objects { item: string, quantity: string }
- steps: array of strings (concise, imperative)

Optional fields (include when useful):
- id: kebab-case string (e.g., "sweet-potato-bowls")
- time: string (e.g., "25–30 min")
- servings: string (e.g., "Serves 4")
- badges: array of short strings (e.g., ["Vegetarian", "Gluten-Free"])
- nutrition: object with keys like calories, carbs, protein, fat
- notes: string (tips, pairings) OR chickenPair: string
- theme: one of ["sunset", "ocean", "forest"] OR tailwind-like gradient tokens (e.g., "from-amber-200 to-rose-100")

Example single recipe object:
{
  "id": "buddha-bowls",
  "title": "Sweet Potato & Chickpea Buddha Bowls",
  "time": "25–30 min",
  "servings": "Serves 4",
  "badges": ["Gluten-Free", "Dairy-Free", "Vegetarian"],
  "ingredients": [
    { "item": "Sweet potatoes", "quantity": "2 medium, peeled & cubed" },
    "Salt, pepper, smoked paprika"
  ],
  "steps": [
    "Heat oven to 425°F (220°C).",
    "Roast vegetables ~20 min, flipping once."
  ],
  "nutrition": { "calories": "580 kcal" },
  "notes": "Great with garlic-herb grilled chicken.",
  "theme": "sunset"
}
```

## Example User Prompt
Copy/paste this as your user message after setting the system prompt above:

```
create 20 veggitarian, gluten free recipes which can be cooked in 30 minutes or less, make enough servings for a weekly meal prep, use a minimal amount of processed ingredients, and nicely can have an add-in of baked chicken cooked with plain salt and pepper
```
