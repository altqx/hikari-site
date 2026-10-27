// Renders the static image of every <AssPreview> into public/previews/still/, from the
// live AkariSub output, and deletes stills no preview uses any more. The site shows a
// still with reduced motion or without WebAssembly; the link check fails when one is missing.
//
//   VITE_SHOW_DRAFTS=1 bun run build && bun scripts/render-stills.ts
//
// It serves the build with wrangler dev and visits every page in a headless browser.
import { glob, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const out = '.output/public';
const stillDir = 'public/previews/still';
const port = 8788;
const base = `http://localhost:${port}`;

const server = Bun.spawn(['bunx', 'wrangler', 'dev', '--port', String(port)], {
  stdout: 'ignore',
  stderr: 'ignore',
});
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${base}/en`)).ok) break;
    } catch {}
    if (i > 60) throw new Error('wrangler dev did not start');
    await Bun.sleep(500);
  }

  const pages: string[] = [];
  for await (const file of glob('en/**/*.html', { cwd: out })) {
    pages.push(`/${file.replace(/(\/)?index\.html$/, '').replace(/\.html$/, '')}`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const used = new Set<string>();
  await mkdir(stillDir, { recursive: true });

  for (const path of pages) {
    await page.goto(base + path);
    const previews = page.locator('figure[data-ass-preview]');
    const count = await previews.count();
    for (let i = 0; i < count; i++) {
      const figure = previews.nth(i);
      await figure.scrollIntoViewIfNeeded();
      const still = await figure.getAttribute('data-still');
      if (!still) continue;
      await figure.locator('xpath=self::*[@data-ass-preview="live"]').waitFor({ timeout: 30000 });
      await page.waitForTimeout(800);
      const dataUrl = await figure.evaluate(async (element) => {
        const frame = element.querySelector('img') as HTMLImageElement;
        const canvas = element.querySelector('canvas') as HTMLCanvasElement;
        await frame.decode();
        const target = document.createElement('canvas');
        target.width = 1280;
        target.height = 720;
        const context = target.getContext('2d') as CanvasRenderingContext2D;
        context.drawImage(frame, 0, 0, 1280, 720);
        context.drawImage(canvas, 0, 0, 1280, 720);
        return target.toDataURL('image/webp', 0.82);
      });
      const name = still.split('/').pop() as string;
      used.add(name);
      await writeFile(`${stillDir}/${name}`, Buffer.from(dataUrl.split(',')[1], 'base64'));
      console.log(`${path}: ${name}`);
    }
  }
  await browser.close();

  for (const name of await readdir(stillDir)) {
    if (!used.has(name)) {
      await rm(`${stillDir}/${name}`);
      console.log(`removed unused ${name}`);
    }
  }
} finally {
  server.kill();
}
