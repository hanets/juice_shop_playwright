import { expect, Locator, Page } from '@playwright/test';

export class AboutUsPage {
  private readonly page: Page;
  readonly root: Locator;
  readonly content: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('article', {
      has: page.getByRole('heading', { name: /about us/i }),
    });
    this.content = page.getByRole('region', { name: /customer feedback/i });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.content).toBeVisible();
  }

  async expectFeedbackVisible(comment: string): Promise<void> {
    const exactMatch = this.page.getByText(comment, { exact: false });
    const nextButton = this.page.getByRole('button', { name: 'Next' });
    // Navigate through feedback entries if necessary
    for (let i = 0; i < 100; i++) {
      if (await exactMatch.isVisible()) {
        return;
      }
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        // await exactMatch.waitFor({ state: 'visible', timeout: 100 });
      } else {
        break; // No more pages to navigate
      }
    }
    await expect(exactMatch).toBeVisible();
  }
}
