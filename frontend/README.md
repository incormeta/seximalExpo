# Seximal app

This directory contains the Expo Router source for the Seximal PWA and native app.
See the [repository README](../README.md) for Vercel deployment, iPhone Home Screen
installation, offline behavior, and timer limitations.

From this directory:

```bash
npm ci
npm run web       # development server
npm run build     # production website + offline cache in dist/
npm run preview   # production preview on localhost:4173
npm run typecheck
npm run lint
npm test
```

Use npm and the committed `package-lock.json`. `app/+html.tsx` defines web metadata;
`public/manifest.webmanifest` defines the installed app; `scripts/build-pwa.cjs`
generates icons and the revisioned service worker after Expo exports the routes.
Native builds keep using Expo and EAS.
