# Mobile apps (Android + iOS)

Two separate apps, each built for Android and iOS by GitHub Actions:

| App | `APP_VARIANT` | Name | Bundle / package id | Opens |
|---|---|---|---|---|
| Ticketing | `tickets` | Nordic Affairs | `com.nordicaffairs.media` | `/en/events` – browse, book, My bookings, QR e-tickets |
| Gate scanner | `gate` | NAM Gate Scanner | `com.nordicaffairs.media.gate` | `/staff/scan` – staff sign-in, camera QR scanner, live check-in counter |

Both are [Capacitor](https://capacitorjs.com) shells around the live website, so website releases reach
the apps instantly and the existing staff login / check-in logic is reused unchanged. The `android/`
and `ios/` folders are generated in CI (git-ignored). `www/index.html` is the offline fallback page.

## Repository settings (Settings → Secrets and variables → Actions)

**Variables (optional):** `SITE_URL` (default `https://nordicaffairsmedia.com` – set to the real live address),
`BUNDLE_ID_BASE`, `APP_VERSION`.

**Android secrets (for signed release + Play):** `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON`.
Create the key once: `keytool -genkeypair -v -keystore release.keystore -alias nam -keyalg RSA -keysize 2048 -validity 10000`
then `base64 -w0 release.keystore`. **Keep this key safe – Google Play needs the same one for every update.**

**iOS secrets (for signed .ipa + TestFlight):** `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`,
`ASC_KEY_P8` (the App Store Connect API key, full text of the `.p8` file, role *App Manager*).
Create both apps in App Store Connect with the bundle ids above first.

Without secrets the workflows still run: Android gives debug APKs, iOS compiles for the Simulator.

## Running

- Push to `main` touching `mobile/**` → both apps, both platforms.
- Actions → *Android* / *iOS* → *Run workflow* → pick `tickets`, `gate` or `both`.
- Push a tag `mobile-v1.0.0` → signed builds are also sent to Google Play (internal track) and TestFlight.

## Local try-out

```bash
cd mobile && npm ci
APP_VARIANT=gate npm run prepare:assets
APP_VARIANT=gate node scripts/native.mjs add android && APP_VARIANT=gate node scripts/native.mjs configure android
npx cap open android   # needs Android Studio
```
