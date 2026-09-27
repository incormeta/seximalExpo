import { ExpoRoot } from "./frontend/node_modules/expo-router";

// Expo falls back to node_modules/expo/AppEntry when the CLI is started from
// this repository's root. Point that fallback at the real file-based routes so
// both `npx expo start` and the preferred `npm start` command launch the app.
const routes = require.context("./frontend/app");

export default function App() {
  return <ExpoRoot context={routes} />;
}
