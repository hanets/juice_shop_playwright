import { HomePage } from '../../page-objects/HomePage';
import { AppConfig } from '../../utils/config/AppConfig';
import { expect, test } from '../baseTest';

test.describe('Guest User - Unauthorized Access', () => {
  let homePage: HomePage;
  const baseUrl = AppConfig.baseUrl;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate(baseUrl);
    await homePage.dismissPopupAndCookies();
  });

  test('Guest should see products but not basket options', async ({ page }) => {
    // 1. Verify "All Products" is visible
    await expect(page.getByText('All Products')).toBeVisible();

    // 2. Verify products are listed
    const productsCount = await homePage.getVisibleProductsCount();
    expect(productsCount).toBeGreaterThan(0);

    // 3. Verify 'Your Basket' is hidden
    await homePage.verifyUserNotLoggedIn();

    // 4. Verify 'Add to Basket' buttons are hidden on product cards
    const addToBasketButtons = page.getByLabel('Add to Basket');
    await expect(addToBasketButtons).toHaveCount(0);
  });

  test('Guest should see Login option in Account menu', async ({ page }) => {
    await homePage.accountMenu.click();
    const loginMenuItem = page.getByRole('menuitem', { name: 'Go to login page' });
    await expect(loginMenuItem).toBeVisible();

    // Verify Logout is NOT visible
    const logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
    await expect(logoutMenuItem).toBeHidden();
  });

  test('Guest can access About Us and Contact Us pages', async ({ page }) => {
    // Check Contact Us
    await homePage.navigateToFeedback();
    await expect(page).toHaveURL(/.*contact/);
    await expect(page.getByText('Customer Feedback')).toBeVisible();

    // Go back and check About Us
    await homePage.navigate(baseUrl);
    await homePage.navigateToAboutUs();
    await expect(page).toHaveURL(/.*about/);
    await expect(page.getByText('About Us')).toBeVisible();
  });
});
