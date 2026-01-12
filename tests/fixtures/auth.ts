import base, { Page, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { authenticate } from '../../utils/api/AuthService';
import { registerUser } from '../../utils/api/UserService';
import { createRegisterUserRequest } from '../../utils/models/user';
import { HomePage } from '../../page-objects/HomePage';

export interface TestData {
  email: string;
  password: string;
  homePage: HomePage;
}

type LoginNewUserFixture = {
  testData: TestData;
};

export const test = base.extend<LoginNewUserFixture>({
  // Creates a brand new user via API, authenticates, and injects token into localStorage for UI session
  testData: async ({ request, page }, use) => {
    dotenv.config();
    const email = `user_${Date.now()}@example.com`;
    const password = 'Test@1234';

    await registerUser(request, createRegisterUserRequest(email, password));
    const loginRes = await authenticate(request, { email, password });
    const token = loginRes.authentication.token;
    const bid = loginRes.authentication.bid;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await injectTokenIntoUI(page, token, bid.toString(), baseUrl);

    // Navigate and verify the UI session is active
    const home = new HomePage(page);
    await home.navigate(baseUrl);
    await home.dismissPopupAndCookies();
    await home.verifyUserLoggedIn();

    await use({ email, password, homePage: home });
  },
});

async function injectTokenIntoUI(page: Page, token: string, bid: string, baseUrl: string) {
  // Derive origin to satisfy Playwright cookie requirements
  let origin = baseUrl;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    origin = baseUrl.startsWith('http') ? baseUrl : `http://${baseUrl}`;
  }

  // Set auth token as cookie on the target origin
  await page.context().addCookies([
    {
      name: 'token',
      value: token,
      url: origin,
      httpOnly: true,
      secure: origin.startsWith('https://'),
      sameSite: 'Lax',
    },
  ]);

  // Ensure token is available in storage before any page scripts run
  await page.addInitScript(
    ([t, b]) => {
      window.localStorage.setItem('token', t);
      window.sessionStorage.setItem('bid', b);
    },
    [token, bid],
  );
}

export { expect };
