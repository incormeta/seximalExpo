# Seximal Expo

The Expo application lives in [`frontend/`](frontend). A small root `package.json`
provides convenience commands so the common workflow can be run from the repository
root without moving or duplicating any application code.

## Prerequisites

- Node.js 20.19.4 or newer (the minimum supported by this Expo/React Native setup)
- npm, or Yarn 1.22 if working directly in `frontend/`
- The [Expo Go](https://expo.dev/go) app for testing on a physical device
- An Expo account and platform developer credentials only when creating cloud builds

## Run locally with Expo Go

From the repository root:

```bash
npm run install:app
npm start
```

Scan the QR code with Expo Go. If the phone cannot reach the computer over the local
network, run `npm start -- --tunnel` instead. Android, iOS, and web shortcuts are also
available as `npm run android`, `npm run ios`, and `npm run web`.

The earlier `package.json does not exist` error occurred because the Expo project and
its package file are under `frontend/`, not at the repository root. The new root
package file makes `npm start` work from the root. To invoke the Expo CLI itself, first
change directories:

```bash
cd frontend
npx expo start
```

Do not use `npx expo start` at the repository root: unlike an npm script, the Expo CLI
does not redirect to a nested project.

## Validate before building

```bash
npm run doctor
npm run lint
npm test
```

`expo-doctor` checks package compatibility and app configuration. No backend or
environment variables are required by the current mobile app.

## Build with EAS

EAS commands must run with `frontend/` as their project directory. The included
[`frontend/eas.json`](frontend/eas.json) defines these profiles:

- `development`: an internal development-client build (this is separate from Expo Go)
- `preview`: an internal installable build for testers
- `production`: a store build with remotely managed, automatically incremented build numbers

For the first build, authenticate and link this checkout to an Expo project:

```bash
npx eas-cli login
cd frontend
npx eas-cli init
npx eas-cli build --platform all --profile preview
```

`eas init` adds the Expo project ID to `app.json`; commit that generated identifier so
CI and other developers build the same Expo project. EAS will prompt for or generate
Android/iOS signing credentials. Apple App Store distribution requires an Apple
Developer account, and Google Play submission requires a Play Console account and
service-account key.

After initialization, builds may also be started from the repository root:

```bash
npm run eas:build -- --platform android --profile preview
npm run eas:build -- --platform ios --profile production
```

Submit an existing production build with:

```bash
npm run eas:submit -- --platform android --profile production
# or
npm run eas:submit -- --platform ios --profile production
```

Before a public release, verify the display name, slug, Android package name, iOS
bundle identifier, icons, screenshots, store descriptions, privacy disclosures, and
notification behavior. The existing identifiers in `frontend/app.json` were retained
to avoid changing application identity or functionality.
