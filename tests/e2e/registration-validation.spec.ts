import * as dotenv from 'dotenv';
import { HomePage } from '../../page-objects/HomePage';
import { expect, test } from '../baseTest';

dotenv.config();

test.describe('Registration Form Validation', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate(process.env.BASE_URL || 'http://localhost:3000/');
    await homePage.dismissPopupAndCookies();
  });

  test('Should show error messages for empty required fields', async ({ page }) => {
    const loginPage = await homePage.openLoginPage();
    const signUpPage = await loginPage.navigateToSignUp();

    // Focus and blur fields to trigger validation
    await signUpPage.emailInput.click();
    await signUpPage.passwordInput.click();
    await signUpPage.repeatPasswordInput.click();
    await signUpPage.securityAnswerInput.click();
    await signUpPage.emailInput.click(); // Blur the last field

    await expect(signUpPage.emailError).toContainText('Please provide an email address.');
    await expect(signUpPage.passwordError).toContainText('Please provide a password.');
    await expect(signUpPage.repeatPasswordError).toContainText('Please repeat your password.');
    await expect(signUpPage.securityAnswerError).toContainText(
      'Please provide an answer to your security question.',
    );
    await expect(signUpPage.signUpButton).toBeDisabled();
  });

  test('Should show error for invalid email format', async ({ page }) => {
    const loginPage = await homePage.openLoginPage();
    const signUpPage = await loginPage.navigateToSignUp();

    await signUpPage.emailInput.fill('invalid-email');
    await signUpPage.passwordInput.click(); // Trigger blur

    await expect(signUpPage.emailError).toContainText('Email address is not valid.');
    await expect(signUpPage.signUpButton).toBeDisabled();
  });

  test('Should show error for short password', async ({ page }) => {
    const loginPage = await homePage.openLoginPage();
    const signUpPage = await loginPage.navigateToSignUp();

    await signUpPage.passwordInput.fill('123');
    await signUpPage.repeatPasswordInput.click(); // Trigger blur

    await expect(signUpPage.passwordError).toContainText('Password must be 5-40 characters long.');
    await expect(signUpPage.signUpButton).toBeDisabled();
  });

  test('Should show error for mismatched passwords', async ({ page }) => {
    const loginPage = await homePage.openLoginPage();
    const signUpPage = await loginPage.navigateToSignUp();

    await signUpPage.passwordInput.fill('P@ssword123');
    await signUpPage.repeatPasswordInput.fill('P@ssword321');
    await signUpPage.securityAnswerInput.click(); // Trigger blur

    await expect(signUpPage.repeatPasswordError).toContainText('Passwords do not match');
    await expect(signUpPage.signUpButton).toBeDisabled();
  });

  test('Should enable Register button when form is valid', async ({ page }) => {
    const loginPage = await homePage.openLoginPage();
    const signUpPage = await loginPage.navigateToSignUp();

    const email = `testuser_${Date.now()}@example.com`;
    await signUpPage.emailInput.fill(email);
    await signUpPage.passwordInput.fill('P@ssword123');
    await signUpPage.repeatPasswordInput.fill('P@ssword123');

    await signUpPage.securityQuestionDropdown.click();
    await page.getByRole('option').first().click();
    await signUpPage.securityAnswerInput.fill('MySecretAnswer');

    await expect(signUpPage.signUpButton).toBeEnabled();
  });
});
