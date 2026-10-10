// Run after Expo's web export. All PWA resources stay on the same origin.
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { generateSW } = require('workbox-build');

async function buildPwa() {
  const dist = path.join(__dirname, '..', 'dist');
  const icons = path.join(dist, 'icons');
  const source = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
  await mkdir(icons, { recursive: true });

  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await sharp(source).resize(size, size).flatten({ background: '#09090B' }).png().toFile(path.join(icons, name));
  }
  // Keep the existing artwork inside the maskable icon's safe area.
  await sharp(source).resize(320, 320).extend({ top: 96, bottom: 96, left: 96, right: 96, background: '#09090B' })
    .flatten({ background: '#09090B' }).png().toFile(path.join(icons, 'icon-maskable-512.png'));

  const { count, size, warnings } = await generateSW({
    globDirectory: dist,
    globPatterns: ['**/*'],
    globIgnores: ['**/*.map', '_expo/static/js/server/**'],
    swDest: path.join(dist, 'sw.js'),
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
    modifyURLPrefix: { '': '/' },
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/(?:_expo|assets|icons)(?:\/|$)/, /\.[^/]+$/],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    // Activate updates after all open app windows close, avoiding mixed builds.
    skipWaiting: false,
    sourcemap: false,
  });
  if (warnings.length) throw new Error(warnings.join('\n'));
  console.log(`PWA ready: ${count} offline assets (${(size / 1024 / 1024).toFixed(2)} MB).`);
}

buildPwa().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
