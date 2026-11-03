// Writes capacitor.config.json for the chosen APP_VARIANT (JSON is the one format every
// Capacitor CLI version reads without a TypeScript/ESM loader).
//
// The apps are thin native shells around the live website (Next.js + Payload):
//  - tickets → /en/events   (browse, book, My bookings, e-tickets with QR)
//  - gate    → /staff/scan  (staff sign in, camera QR scanner, live check-in counter)
// Because the real site is loaded, every website release reaches the apps immediately and
// sign-in cookies / server actions behave exactly as in a browser. `www/` is only the
// offline fallback page.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SITE_URL, getVariant } from './variants.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const v = getVariant()
const host = new URL(SITE_URL).hostname

const config = {
  appId: v.appId,
  appName: v.appName,
  webDir: 'www',
  backgroundColor: v.background,
  appendUserAgent: v.userAgent,
  server: {
    url: `${SITE_URL}${v.startPath}`,
    cleartext: false,
    errorPath: 'index.html',
    // Hosts the app may open inside the WebView (everything else opens in the system browser).
    allowNavigation: [host, `*.${host}`, '*.stripe.com', 'stripe.com', '*.onrender.com', '*.vercel.app'],
  },
  ios: { contentInset: 'always' },
  android: { allowMixedContent: false },
}

writeFileSync(path.join(root, 'capacitor.config.json'), JSON.stringify(config, null, 2) + '\n')
console.log(`capacitor.config.json → ${v.name}: ${v.appId} → ${config.server.url}`)
