import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.join(__dirname, '../.output/chrome-mv3');

const ciLinuxArgs =
  process.env.CI && process.platform === 'linux'
    ? ['--no-sandbox', '--disable-setuid-sandbox']
    : [];

export const test = base.extend<{
  extensionContext: BrowserContext;
  extensionId: string;
}>({
  extensionContext: [
    async (_fixtures, use) => {
      const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        headless: false,
        args: [
          `--disable-extensions-except=${EXTENSION_PATH}`,
          `--load-extension=${EXTENSION_PATH}`,
          ...ciLinuxArgs,
        ],
      });

      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  extensionId: [
    async ({ extensionContext }, use) => {
      let [serviceWorker] = extensionContext.serviceWorkers();
      if (!serviceWorker) {
        serviceWorker = await extensionContext.waitForEvent('serviceworker');
      }

      const extensionId = serviceWorker.url().split('/')[2];
      if (!extensionId) {
        throw new Error('Failed to resolve extension id from service worker');
      }

      await use(extensionId);
    },
    { scope: 'worker' },
  ],

  page: async ({ extensionContext }, use) => {
    const page = await extensionContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
