import { test, expect } from '@playwright/test';

import * as dotenv from 'dotenv';
import { HomePage } from '../../page-objects/HomePage';

dotenv.config();

test.describe.parallel("Login Tests", () => {
    let homePage: HomePage
    test.beforeEach(async ({ page }, testInfo) => {
        homePage = new HomePage(page);
        await homePage.navigate(process.env.BASE_URL || '');
        await homePage.dismissPopupAndCookies();
        console.log(`Running test: ${testInfo.title}`);
    });

    test("Login negative", async ({ page }) => {
        const email = `user@example.com`;
        const password = "Test@1234";

        const loginPage = await homePage.openLoginPage();
        await loginPage.login(email, password);
        await loginPage.verifyLoginFailed();
        await homePage.verifyUserNotLoggedIn();
        expect(await page.screenshot()).toMatchSnapshot("login-failed.png");
    });

    test("Register user", async ({ page }) => {
        const email = `user${Date.now()}@example.com`;
        const password = "Test@1234";

        const loginPage = await homePage.openLoginPage();
        const signUpPage = await loginPage.navigateToSignUp();
        await signUpPage.signUp(email, password);
        await loginPage.login(email, password);
        await homePage.verifyUserLoggedIn();
    
    });
});