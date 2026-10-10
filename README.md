# Seximal PWA

The `mainPWA` branch builds Seximal as an installable, offline-capable web app. The
existing Expo/React Native screens are exported as a static website; no Expo Go,
backend, account, or environment variables are needed to use the PWA.

## Run and build

Use Node.js 22 LTS or 24 LTS and npm. From the repository root:

```bash
npm run install:app
npm run web
```

To build and preview the production PWA:

```bash
npm run build
npm run preview
```

Open <http://localhost:4173>. Offline support is enabled in production builds,
not the Expo development server. The complete deployable website is generated in
`frontend/dist/`. The npm lockfile in `frontend/` pins dependencies for deployment;
use `npm --prefix frontend ci` for a reproducible installation.

## Host with Vercel

1. Push `mainPWA` to your Git repository and import the repository in Vercel.
2. Keep **Root Directory** set to the repository root, not `frontend`.
3. Select **Other** as the framework preset and Node.js **22.x** or **24.x**.
4. Deploy `mainPWA`. For a stable public app, set `mainPWA` as the Production Branch.

The root `vercel.json` supplies the install command (`npm --prefix frontend ci --include=dev`),
build command (`npm run build`), output directory (`frontend/dist`), clean route
URLs, and service-worker cache headers. No Vercel functions are required. Use the
production HTTPS URL on your phone; disable Deployment Protection for a public
app. No deployment or remote branch push is performed by these local scripts.

Other static hosts work too: publish the contents of `frontend/dist` at the domain
root over HTTPS, serve `/convert`, `/time`, and `/learn` from their corresponding
HTML files, and avoid long-lived HTTP caching of `sw.js` and the manifest. This
configuration assumes the app is hosted at `/`, not beneath a subdirectory.

## Install on an iPhone

1. Open the deployed HTTPS URL in **Safari** and let it finish loading online.
2. Tap **Share**, then **Add to Home Screen** (it may be inside **More**).
3. Leave **Open as Web App** enabled if Safari offers that option, then tap **Add**.
4. Launch **Seximal** from the new Home Screen icon.

The app opens in its own window and works offline after the service worker has
cached the first successful load. Install it from the stable production URL so
updates and locally saved calculator history use the same origin. Other browsers
can use their **Install app** option when available.

## Offline use and updates

The production build generates an app manifest, regular and maskable icons, an
Apple touch icon, and a Workbox service worker. It caches all exported screens,
JavaScript, fonts, icons, and the alarm sound. The Learn screen uses a local
gradient instead of a remote image. Calculator history stays in browser storage.

New deployments download a revised cache when opened online. Close all open
Seximal windows/tabs and reopen to activate an update. Browser/iOS storage eviction
or clearing website data can remove offline files and history; open online again
to restore the app cache.

**Timer limitation:** iOS can suspend a PWA when it is backgrounded or the screen
locks. Keep the app visible and the screen awake to hear an alarm. The Start and
Resume buttons authorize browser audio, but device sound settings and browser
policies still apply. The PWA does not schedule native local notifications or
provide a guaranteed background alarm.

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

With the production preview open, check Calc, Convert, Time, and Learn. Wait for
`/sw.js` to activate in browser developer tools, switch the browser to offline,
then reload and visit each tab, including direct URLs such as `/time`. Verify
calculator history survives a reload. Test Home Screen installation and notch/home
indicator spacing on a physical iPhone after deploying over HTTPS.

## Native Expo builds

Expo remains the source framework, so native development is still available with
`npm start`, `npm run ios`, and `npm run android`. Native app configuration and
EAS profiles remain in `frontend/app.json` and `frontend/eas.json`. Run EAS commands
from `frontend/`; production native builds require Expo project setup and platform
signing credentials. The PWA does not require those credentials.
