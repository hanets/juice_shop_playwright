import { test } from '../baseTest';
import dotenv from 'dotenv';
import { HomePage } from '../../page-objects/HomePage';
import { registerUser } from '../../utils/api/UserService';
import { ProductSearchResponse } from '../../utils/models/product';
import { createRandomRegisterUserRequest } from '../../utils/models/user';

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
    const user = createRandomRegisterUserRequest();

    await registerUser(request, user);

    const loginPage = await homePage.openLoginPage();
    await loginPage.login(user.email, user.password);
    await homePage.verifyUserLoggedIn();

    await homePage.verifyVisibleProductsCount(0);
  });
});
