import { expect, Locator, Page } from '@playwright/test';
import { LoginPage } from './LoginPage';

export class HomePage {
  readonly page: Page;
  readonly dismissButton: Locator;
  readonly dismissCookieButton: Locator;
  readonly accountMenu: Locator;
  readonly loginButton: Locator;
  readonly basketLink: Locator;
  readonly productCards: Locator;
  readonly homeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dismissButton = page.locator('text=Dismiss');
    this.dismissCookieButton = page.locator("[aria-label='dismiss cookie message']");
    this.accountMenu = page.locator('#navbarAccount');
    this.loginButton = page.locator('#navbarLoginButton');
    this.basketLink = page.getByText('Your Basket');
    this.homeButton = page.locator('#homeButton');
    // Product cards on the homepage grid
    this.productCards = page.locator('mat-card');
  }

  async navigate(url: string) {
    await this.page.goto(url);
  }

  async goToHomePage() {
    await this.homeButton.click();
  }

  async dismissPopupAndCookies() {
    await this.dismissButton.click();
    await this.dismissCookieButton.click();
  }

  async openLoginPage(): Promise<LoginPage> {
    await this.page.getByRole('button', { name: 'Show/hide account menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Go to login page' }).click();
    return new LoginPage(this.page);
  }

  async verifyUserLoggedIn() {
    await expect(this.basketLink).toBeVisible();
    await this.accountMenu.click();
    await expect(this.page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
    // close menu - cdk-overlay-connected-position-bounding-box
    await this.page.keyboard.press('Escape');
  }

  async verifyUserNotLoggedIn() {
    await expect(this.basketLink).toBeHidden();
  }

  async getVisibleProductsCount(): Promise<number> {
    return await this.productCards.count();
  }

  async verifyVisibleProductsCount(expectedCount: number) {
    await expect(this.productCards).toHaveCount(expectedCount);
  }

  async verifyBasketItemsCount(expectedCount: number) {
    const basketRoot = this.page.locator('.mdc-button__label', { hasText: 'Your Basket' });
    await expect(basketRoot.locator('.warn-notification')).toHaveText(expectedCount.toString());
  }

  async addProductToBasket(productName: string): Promise<void> {
    const productCard = this.page.locator('mat-card').filter({ hasText: productName });
    await productCard.getByLabel('Add to Basket').click();
    await expect(this.page.getByText(`Placed ${productName} into basket.`)).toBeVisible();
  }

  async openBasket(): Promise<void> {
    await this.page.getByRole('button', { name: 'Show the shopping cart' }).click();
  }

  async verifyLoggedIn(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Show the shopping cart' })).toBeVisible();
    await expect(this.page.getByText('Your Basket')).toBeVisible();
  }
}
