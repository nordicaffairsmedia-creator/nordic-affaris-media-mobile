// One place that describes the two apps. Everything reads APP_VARIANT (tickets | gate).
export const SITE_URL = (process.env.SITE_URL || 'https://nordicaffairsmedia.com').replace(/\/$/, '')

const base = process.env.BUNDLE_ID_BASE || 'com.nordicaffairs.media'

export const VARIANTS = {
  tickets: {
    appId: process.env.TICKETS_APP_ID || base,
    appName: 'Nordic Affairs',
    startPath: '/en/events',
    userAgent: 'NAMApp/tickets',
    background: '#0e2440',
    ribbon: null,
    camera: false,
    cameraText: '',
  },
  gate: {
    appId: process.env.GATE_APP_ID || `${base}.gate`,
    appName: 'NAM Gate Scanner',
    startPath: '/staff/scan',
    userAgent: 'NAMApp/gate',
    background: '#0e2440',
    ribbon: '#1e7a46',
    camera: true,
    cameraText: 'The camera is used to scan ticket QR codes at the gate.',
  },
}

export function getVariant() {
  const name = process.env.APP_VARIANT || 'tickets'
  const v = VARIANTS[name]
  if (!v) throw new Error(`APP_VARIANT must be one of: ${Object.keys(VARIANTS).join(', ')} (got "${name}")`)
  return { name, ...v }
}
