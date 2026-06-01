import { expect, test } from './fixtures';

test.describe('popup', () => {
  test('renders whitelist UI and supports manual domain management', async ({
    extensionContext,
    extensionId,
  }) => {
    const popup = await extensionContext.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(popup.locator('h1.name')).toHaveText('MessageInputBot');
    await expect(popup.locator('.domain-list .domain')).toContainText([
      'localhost',
      '127.0.0.1',
    ]);

    await popup.locator('input[name="domain"]').fill('example.com');
    await popup.locator('form[data-action="manual-add"]').press('Enter');

    await expect(popup.locator('.notice')).toHaveText(
      '已加入白名单，刷新页面后生效',
    );
    await expect(
      popup.locator('.domain-list .domain', { hasText: 'example.com' }),
    ).toBeVisible();

    await popup
      .locator('button[data-action="remove"][data-domain="example.com"]')
      .click();

    await expect(popup.locator('.notice')).toHaveText('已删除，刷新页面后生效');
    await expect(
      popup.locator('button[data-action="remove"][data-domain="example.com"]'),
    ).toHaveCount(0);
  });
});
