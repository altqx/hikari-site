// Renders the mockups to PNG, light and dark: node mockups/shoot.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const browser = await chromium.launch();
for (const name of ['home', 'visual-tools']) {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(`file://${dir}${name}.html?theme=${theme}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}shots/${name}-${theme}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
