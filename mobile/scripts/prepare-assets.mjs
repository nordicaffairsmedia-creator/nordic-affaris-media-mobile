// Builds assets/icon-only.png, icon-foreground/background and splash images for @capacitor/assets
// from the website's own icon, so the apps match the brand without extra design files.
import { mkdir, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'
import { getVariant } from './variants.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.resolve(root, '../apps/web/public/icons/icon-512.png')
const out = path.join(root, 'assets')
const v = getVariant()
await mkdir(out, { recursive: true })

const SIZE = 1024
const bg = v.background

// Solid brand-coloured square with the logo centred (80% of the canvas).
async function plate(logoRatio, withRibbon) {
  const logo = await sharp(src).resize(Math.round(SIZE * logoRatio)).toBuffer()
  const layers = [{ input: logo, gravity: 'center' }]
  if (withRibbon && v.ribbon) {
    // Green bar along the bottom marks the staff (gate) app at a glance.
    const bar = await sharp({
      create: { width: SIZE, height: 110, channels: 4, background: v.ribbon },
    })
      .png()
      .toBuffer()
    layers.push({ input: bar, top: SIZE - 110, left: 0 })
  }
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: bg } })
    .composite(layers)
    .png()
}

await (await plate(0.8, true)).toFile(path.join(out, 'icon-only.png'))

// Adaptive icon layers for Android: logo inside the 66% safe zone on a transparent layer.
const fg = await sharp(src).resize(Math.round(SIZE * 0.55)).toBuffer()
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: fg, gravity: 'center' }])
  .png()
  .toFile(path.join(out, 'icon-foreground.png'))
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: bg } })
  .png()
  .toFile(path.join(out, 'icon-background.png'))

// Splash: 2732² brand colour with the logo in the middle (light + dark share it).
const SP = 2732
const logo = await sharp(src).resize(640).toBuffer()
const splash = sharp({ create: { width: SP, height: SP, channels: 4, background: bg } }).composite([
  { input: logo, gravity: 'center' },
])
await splash.clone().png().toFile(path.join(out, 'splash.png'))
await copyFile(path.join(out, 'splash.png'), path.join(out, 'splash-dark.png'))
console.log(`assets ready for variant "${v.name}"`)
