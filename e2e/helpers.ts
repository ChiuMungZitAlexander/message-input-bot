import type { BrowserContext, Locator, Page } from '@playwright/test';

const FIXTURES_PATH = '/input-fixtures.html';

export const FIXTURES_URL = `http://localhost:8787${FIXTURES_PATH}`;

export function triggerHost(page: Page): Locator {
  return page.locator('[data-message-input-bot-ui="trigger"]');
}

export function triggerButton(page: Page): Locator {
  return triggerHost(page).locator('button.trigger-btn');
}

export function panelHost(page: Page): Locator {
  return page.locator('[data-message-input-bot-ui="panel"]');
}

export function panelField(page: Page, field: string): Locator {
  return panelHost(page).locator(`[data-field="${field}"]`);
}

async function waitForRegisteredContentScript(
  context: BrowserContext,
): Promise<void> {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }

  await serviceWorker.evaluate(async () => {
    const deadline = Date.now() + 15_000;

    while (Date.now() < deadline) {
      const scripts = await chrome.scripting.getRegisteredContentScripts({
        ids: ['message-input-bot'],
      });

      if (
        scripts.length > 0 &&
        scripts[0]?.matches?.some((pattern) => pattern.includes('localhost'))
      ) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error('Timed out waiting for content script registration');
  });
}

export async function waitForContentScript(
  page: Page,
  context: BrowserContext,
): Promise<void> {
  await waitForRegisteredContentScript(context);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.goto(FIXTURES_URL);

    try {
      await triggerHost(page).waitFor({ state: 'attached', timeout: 3_000 });
      return;
    } catch {
      if (attempt === 4) {
        throw new Error('Content script UI did not attach to the test page');
      }
    }
  }
}

export async function openPanelFor(
  page: Page,
  selector: string,
): Promise<void> {
  await page.locator(selector).focus();
  await triggerButton(page).waitFor({ state: 'visible' });
  await triggerButton(page).click();
  await panelHost(page).locator('.panel.visible').waitFor({ state: 'visible' });
}

export async function startRepeating(
  page: Page,
  config: {
    text: string;
    count: number;
    intervalSeconds: number;
    jitter?: boolean;
  },
): Promise<void> {
  await panelField(page, 'text').fill(config.text);
  await panelField(page, 'count').fill(String(config.count));
  await panelField(page, 'interval').fill(String(config.intervalSeconds));

  if (config.jitter) {
    await panelField(page, 'jitter').check();
  } else {
    await panelField(page, 'jitter').uncheck();
  }

  await panelHost(page).locator('[data-action="start"]').click();
}
