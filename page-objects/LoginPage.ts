import { expect, Locator, Page } from '@playwright/test';
import { SignUpPage } from './SignUpPage';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: 'Text field for the login email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Text field for the login password' });
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    this.signUpLink = page.getByRole('link', { name: 'Not yet a customer?' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async verifyLoginFailed() {
    await expect(this.page.locator('text=Invalid email or password.')).toBeVisible();
  }

  async navigateToSignUp(): Promise<SignUpPage> {
    await this.signUpLink.click();
    return new SignUpPage(this.page);
  }
}
