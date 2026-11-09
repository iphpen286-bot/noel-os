// Generiert die PWA-/iOS-Icons aus einem S/W-Vektor-Mark (Disziplin-Ring).
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
await mkdir(out, { recursive: true })

const ring = (bgRound) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" ${bgRound ? 'rx="112"' : ''} fill="#000000"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#ffffff" stroke-width="34"
    stroke-linecap="round" stroke-dasharray="772 942" transform="rotate(-90 256 256)"/>
</svg>`

const jobs = [
  { file: 'pwa-192.png', size: 192, svg: ring(false) },
  { file: 'pwa-512.png', size: 512, svg: ring(false) },
  // maskable: voll ausgefüllt, Mark in der Safe-Zone
  { file: 'pwa-maskable-512.png', size: 512, svg: ring(false) },
  // apple-touch-icon: iOS maskiert selbst, voll-bleed, keine Transparenz
  { file: 'apple-touch-icon.png', size: 180, svg: ring(false) },
]

for (const j of jobs) {
  await sharp(Buffer.from(j.svg)).resize(j.size, j.size).png().toFile(join(out, j.file))
  console.log('✓', j.file)
}
