import { test } from '@playwright/test';
import { ProductSearchResponse } from '../../utils/models/product';
import { registerUser } from '../../utils/api/UserService';
import { createRegisterUserRequest } from '../../utils/models/user';
import { HomePage } from '../../page-objects/HomePage';
import dotenv from 'dotenv';

test.describe('Products - Not available', () => {
  test('No products available', async ({ page, request }) => {
    await page.route('**/rest/products/search**', async (route) => {
      const response: ProductSearchResponse = {
        data: [],
        status: 'success',
      };
      await route.fulfill({ json: response });
    });

    dotenv.config();
    const homePage = new HomePage(page);
    await homePage.navigate(process.env.BASE_URL || '');
    await homePage.dismissPopupAndCookies();
    const email = `user_${Date.now()}@example.com`;
    const password = 'Test@1234';

    await registerUser(request, createRegisterUserRequest(email, password));

    const loginPage = await homePage.openLoginPage();
    // const signUpPage = await loginPage.navigateToSignUp();
    // await signUpPage.signUp(email, password);
    await loginPage.login(email, password);
    await homePage.verifyUserLoggedIn();

    await homePage.verifyVisibleProductsCount(0);
  });
});
