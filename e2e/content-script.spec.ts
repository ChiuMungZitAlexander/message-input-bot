import { expect, test } from './fixtures';
import {
  openPanelFor,
  panelField,
  panelHost,
  startRepeating,
  triggerButton,
  waitForContentScript,
} from './helpers';

test.describe('content script', () => {
  test.beforeEach(async ({ page, extensionContext }) => {
    await waitForContentScript(page, extensionContext);
  });

  test('shows trigger button when an input is focused', async ({ page }) => {
    await page.locator('input[type="text"]').first().focus();
    await expect(triggerButton(page)).toBeVisible();
  });

  test('opens panel when trigger button is clicked', async ({ page }) => {
    await openPanelFor(page, 'textarea');

    await expect(panelHost(page).locator('h3')).toHaveText('重复输入');
    await expect(panelField(page, 'text')).toBeFocused();
  });

  test('validates empty repeat text', async ({ page }) => {
    await openPanelFor(page, 'textarea');
    await panelHost(page).locator('[data-action="start"]').click();

    await expect(panelHost(page).locator('[data-role="error"]')).toHaveText(
      '请输入重复内容',
    );
  });

  test('repeats input in plain text field', async ({ page }) => {
    const input = page.locator('section input[type="text"]').first();
    await openPanelFor(page, 'section input[type="text"]');
    await startRepeating(page, {
      text: 'hello-bot',
      count: 1,
      intervalSeconds: 0.1,
    });

    await expect(input).toHaveValue('hello-bot');
    await expect(panelHost(page).locator('[data-role="progress"]')).toHaveText(
      '已完成',
    );
  });

  test('repeats input in chat box and submits messages', async ({ page }) => {
    await openPanelFor(page, '#chat-input');
    await startRepeating(page, {
      text: '666',
      count: 3,
      intervalSeconds: 0.2,
    });

    const messages = page.locator('#chat-messages .msg');
    await expect(messages).toHaveCount(3, { timeout: 10_000 });
    await expect(messages).toHaveText(['666', '666', '666']);
    await expect(page.locator('#chat-input')).toHaveText('');
  });

  test('can stop an in-progress repeat run', async ({ page }) => {
    await openPanelFor(page, '#chat-input');
    await startRepeating(page, {
      text: 'stop-me',
      count: 20,
      intervalSeconds: 0.5,
    });

    await panelHost(page).locator('[data-action="stop"]').click();

    const messages = page.locator('#chat-messages .msg');
    await expect(messages).not.toHaveCount(20, { timeout: 15_000 });
    expect(await messages.count()).toBeLessThan(20);
  });
});
