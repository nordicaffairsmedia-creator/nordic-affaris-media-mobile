// Creates and configures the native Android / iOS projects for the chosen APP_VARIANT.
//   node scripts/native.mjs add [android|ios|all]        – run `cap add` if the platform is missing
//   node scripts/native.mjs configure [android|ios|all]  – permissions, version, signing, icons
// The native folders (android/, ios/) are generated in CI and are git-ignored.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getVariant } from './variants.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [, , cmd = 'configure', which = 'all'] = process.argv
const platforms = which === 'all' ? ['android', 'ios'] : [which]
const v = getVariant()
const run = (bin, args) => execFileSync(bin, args, { cwd: root, stdio: 'inherit', env: process.env })
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const edit = (file, fn) => {
  const before = readFileSync(file, 'utf8')
  const after = fn(before)
  if (after !== before) writeFileSync(file, after)
}

const VERSION_NAME = process.env.VERSION_NAME || '1.0.0'
const VERSION_CODE = String(process.env.VERSION_CODE || process.env.GITHUB_RUN_NUMBER || '1')

run('node', ['scripts/write-config.mjs'])

if (cmd === 'add') {
  for (const p of platforms) {
    if (!existsSync(path.join(root, p))) run(npx, ['cap', 'add', p])
  }
} else if (cmd === 'configure') {
  run(npx, ['capacitor-assets', 'generate', ...platforms.flatMap((p) => ['--' + p]), '--assetPath', 'assets'])
  if (platforms.includes('android')) configureAndroid()
  if (platforms.includes('ios')) configureIos()
  run(npx, ['cap', 'sync', ...(which === 'all' ? [] : [which])])
} else {
  throw new Error(`unknown command ${cmd}`)
}

function configureAndroid() {
  const manifest = path.join(root, 'android/app/src/main/AndroidManifest.xml')
  edit(manifest, (x) => {
    if (!v.camera || x.includes('android.permission.CAMERA')) return x
    return x.replace(
      /<\/manifest>\s*$/,
      `    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />\n</manifest>\n`,
    )
  })

  const gradle = path.join(root, 'android/app/build.gradle')
  edit(gradle, (g) => {
    g = g.replace(/versionCode\s+\d+/, `versionCode ${VERSION_CODE}`)
    g = g.replace(/versionName\s+"[^"]*"/, `versionName "${VERSION_NAME}"`)
    // Release signing is read from environment variables so no secret is ever written to git.
    if (!g.includes('NAM_KEYSTORE_PATH')) {
      // 1) point the release build type at the signing config (before we add that config)
      g = g.replace(
        /(buildTypes\s*\{\s*release\s*\{)/,
        `$1\n            if (System.getenv("NAM_KEYSTORE_PATH")) { signingConfig signingConfigs.release }`,
      )
      // 2) define the signing config, reading everything from environment variables
      g = g.replace(
        /buildTypes\s*\{/,
        `signingConfigs {
        release {
            if (System.getenv("NAM_KEYSTORE_PATH")) {
                storeFile file(System.getenv("NAM_KEYSTORE_PATH"))
                storePassword System.getenv("NAM_KEYSTORE_PASSWORD")
                keyAlias System.getenv("NAM_KEY_ALIAS")
                keyPassword System.getenv("NAM_KEY_PASSWORD")
            }
        }
    }
    buildTypes {`,
      )
    }
    return g
  })
}

function configureIos() {
  const plist = path.join(root, 'ios/App/App/Info.plist')
  edit(plist, (x) => {
    const add = (key, xml) => (x.includes(`<key>${key}</key>`) ? x : x.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>${key}</key>\n\t${xml}\n</dict>\n</plist>\n`))
    x = add('ITSAppUsesNonExemptEncryption', '<false/>')
    if (v.camera) x = add('NSCameraUsageDescription', `<string>${v.cameraText}</string>`)
    return x
  })
}
