import { AppConfig } from '../../utils/config/AppConfig';
import { expect, test } from '../baseTest';

test.describe('AI Analyzer Verification', () => {
  test('locator failure should have screenshot @verify', async ({ page }) => {
    await page.goto(AppConfig.baseUrl);
    // Try to click an element that doesn't exist to trigger a locator timeout
    const dismissCookieButton = page.locator("[aria-label='dismiss cookie label']");
    await dismissCookieButton.click({ timeout: 1000 });
  });

  test('assertion failure should NOT have screenshot @verify', async ({ page }) => {
    await page.goto(AppConfig.baseUrl);
    // Simple assertion failure
    expect(await page.title()).toBe('Wrong Title Indeed');
  });

  test('soft assertion failures should be analyzed @verify', async ({ page }) => {
    await page.goto(AppConfig.baseUrl);
    // Multiple soft assertions
    expect.soft(await page.title(), 'Title check failed').toBe('Wrong Title 1');
    expect.soft(page.url(), 'URL check failed').toContain('wrong-url');

    // Explicitly fail to trigger analysis
    expect(true).toBe(false);
  });
});
