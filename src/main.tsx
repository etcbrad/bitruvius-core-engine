import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {BUILD_ID} from './buildInfo';
import './index.css';

document.documentElement.dataset.buildId = BUILD_ID;
console.info('[bitruvius] buildId:', BUILD_ID);

async function ensureLatestBuild() {
  try {
    const res = await fetch('/build-meta.json', {cache: 'no-store'});
    if (!res.ok) return;
    const meta = (await res.json()) as {buildId?: unknown};
    const serverBuildId = meta?.buildId;
    if (typeof serverBuildId !== 'string') return;
    if (serverBuildId === BUILD_ID) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('v') !== serverBuildId) {
      url.searchParams.set('v', serverBuildId);
      console.warn('[bitruvius] build mismatch; reloading to latest buildId:', serverBuildId);
      window.location.replace(url.toString());
    }
  } catch {
    // Ignore network errors (e.g. dev server without build-meta.json).
  }
}

void ensureLatestBuild();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
