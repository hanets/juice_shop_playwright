import { expect, Locator, Page } from '@playwright/test';

export class SignUpPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly securityQuestionDropdown: Locator;
  readonly securityAnswerInput: Locator;
  readonly signUpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: 'Email address field' });
    this.passwordInput = page.getByRole('textbox', { name: 'Field for the password' });
    this.repeatPasswordInput = page.getByRole('textbox', { name: 'Field to confirm the password' });
    this.securityQuestionDropdown = page.getByRole('combobox', { name: 'Selection list for the' });
    this.securityAnswerInput = page.getByRole('textbox', { name: 'Field for the answer to the' });
    this.signUpButton = page.getByRole('button', { name: 'Button to complete the' });
  }

  async signUp(email: string, password: string, securityAnswer: string = 'Fluffy') {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.repeatPasswordInput.fill(password);

    // Select security question
    await this.securityQuestionDropdown.click();
    await this.page.getByRole('option', { name: 'Name of your favorite pet?' }).click();
    await this.securityAnswerInput.fill(securityAnswer);

    await this.signUpButton.click();
    await expect(
      this.page.getByText('Registration completed successfully. You can now log in.'),
    ).toBeVisible();
  }

  async navigateToSignUp() {
    await this.page.getByRole('link', { name: 'Not yet a customer?' }).click();
  }
}
