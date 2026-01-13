import { Locator, Page, expect } from '@playwright/test';

export class ProductCardPageComponent {
  readonly root: Locator;
  readonly name: Locator;
  readonly price: Locator;
  readonly addToBasket: Locator;
  readonly ribbon: Locator;

  constructor(page: Page, productName: string) {
    this.root = page.locator('.mat-grid-tile', { hasText: productName });
    this.name = this.root.locator('.item-name');
    this.price = this.root.locator('.item-price span');
    this.addToBasket = this.root.getByRole('button', { name: 'Add to Basket' });
    this.ribbon = this.root.locator('.ribbon');
  }

  async validate(expectedPrice: string): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.name).toHaveText(/.+/);
    await expect(this.price).toContainText(expectedPrice);
  }

  async clickAddToBasket(): Promise<void> {
    await this.addToBasket.click();
  }

  async validateRibbon(expectedText: string): Promise<void> {
    await expect(this.ribbon).toHaveText(expectedText);
  }

  async validateNoRibbon(): Promise<void> {
    await expect(this.ribbon).toHaveCount(0);
  }
}
