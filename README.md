<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0c0c8992-66c7-4184-9507-be4702f7ef9e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Troubleshooting

- If you see `Failed to load resource ... 401 (Unauthorized)` for `/src/main.tsx` and a `___vscode_livepreview_injected_script` WebSocket error, you’re likely opening `index.html` with VS Code “Live Preview” (a static file server). This project needs the Vite dev server to compile TS/TSX.
- Fix: run `npm run dev` and open `http://localhost:3000/` in your browser. If you need a static preview, run `npm run build` and preview `dist/` (e.g. `npm run preview`).

## Deploy/cache notes (avoids “stuck on old version”)

- Builds embed a `buildId` and write `dist/build-meta.json` (check DevTools console for `[bitruvius] buildId:`).
- For static hosts that support it (e.g. Netlify/Cloudflare Pages), `public/_headers` disables caching for `index.html` and keeps `/assets/*` immutable so deploys update correctly.
