import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = 'http://localhost:8787'
const OUT = '/tmp/claude-0/-home-user/8a30d838-ba0f-57e0-9322-dbbfce3451de/scratchpad/shots'
await mkdir(OUT, { recursive: true })
const device = { viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ ...device, colorScheme: 'dark' })
const page = await ctx.newPage()
const shot = async (f) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${f}.png` }) }
const click = (name) => page.getByRole('button', { name, exact: false }).first().click()

// Onboarding schnell durch
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
for (let i = 0; i < 5; i++) { await click('Weiter'); await page.waitForTimeout(220) }
await click('Plan erstellen')
await page.waitForSelector('.dash', { timeout: 5000 })

// Mail
await page.goto(BASE + '/mail', { waitUntil: 'networkidle' })
await page.waitForSelector('.mail-card-full', { timeout: 5000 })
await shot('p3-mail')

// Mail reclassify sheet
await page.locator('.mail-card-full').first().click()
await shot('p3-mail-reclass')
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

// Coach — Nachricht senden
await page.goto(BASE + '/coach', { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.locator('.coach-field').fill('Wie sieht mein Tag aus und was soll ich zuerst machen?')
await page.locator('.coach-send').click()
await page.waitForTimeout(1200)
await shot('p3-coach')

console.log('done')
await browser.close()
