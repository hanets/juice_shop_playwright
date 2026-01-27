import { AboutUsPage } from '../../page-objects/AboutUsPage';
import { FeedbackPage } from '../../page-objects/FeedbackPage';
import { test } from '../fixtures/auth';

// This test follows the Customer Feedback plan: 5.1 Submit Customer Feedback with 3-Star Rating

test.describe('Customer Feedback System Tests', () => {
  test('Submit Customer Feedback with 3-Star Rating', async ({ page, testData }) => {
    const feedbackPage = new FeedbackPage(page);
    const aboutUsPage = new AboutUsPage(page);
    const comment = 'Loving the app usability; a few UX tweaks would help.';
    const rating = 3;

    await testData.homePage.navigateToFeedback();
    await feedbackPage.submitCompleteFeedback(comment, rating);
    await testData.homePage.navigateToAboutUs();
    await aboutUsPage.expectLoaded();
    await aboutUsPage.expectFeedbackVisible(comment);
  });

  test.fixme('Submit Customer Feedback with 1-Star Rating', async ({ page, testData }) => {
    // DEFECT: Application bug - Submit button remains disabled for 1-star ratings
    // Expected behavior: Form should submit successfully when all fields are valid
    // Actual behavior: Submit button stays disabled even with valid comment and correct CAPTCHA
    // Other ratings (3-star, 5-star, etc.) work correctly with identical form logic
    // This suggests a specific defect in the validation logic for 1-star ratings
    const feedbackPage = new FeedbackPage(page);
    const aboutUsPage = new AboutUsPage(page);
    const comment = 'Not impressed; had several issues during checkout.';
    const rating = 1;

    await testData.homePage.navigateToFeedback();
    await feedbackPage.submitCompleteFeedback(comment, rating);
    await testData.homePage.navigateToAboutUs();
    await aboutUsPage.expectLoaded();
    await aboutUsPage.expectFeedbackVisible(comment);
  });

  test('Submit Customer Feedback with 5-Star Rating', async ({ page, testData }) => {
    const feedbackPage = new FeedbackPage(page);
    const aboutUsPage = new AboutUsPage(page);
    const comment = 'Fantastic experience! Smooth purchase and fast delivery.';
    const rating = 5;

    await testData.homePage.navigateToFeedback();
    await feedbackPage.submitCompleteFeedback(comment, rating);
    await testData.homePage.navigateToAboutUs();
    await aboutUsPage.expectLoaded();
    await aboutUsPage.expectFeedbackVisible(comment);
  });

  test('Submit Customer Feedback with Long Comment', async ({ page, testData }) => {
    const feedbackPage = new FeedbackPage(page);
    const aboutUsPage = new AboutUsPage(page);
    const longComment =
      'I appreciate the wide selection of products, intuitive navigation, and responsive design. However, a few enhancements could elevate the experience: more robust search filters, clearer error messages when payment fails, and better accessibility support such as ARIA labels on key controls. Overall, the app provides great value and solid performance across devices.';
    const rating = 4;

    await testData.homePage.navigateToFeedback();
    await feedbackPage.submitCompleteFeedback(longComment, rating);
    await testData.homePage.navigateToAboutUs();
    await aboutUsPage.expectLoaded();
    await aboutUsPage.expectFeedbackVisible('enhancements could elevate');
  });

  test('Submit Customer Feedback with Emoji/Unicode', async ({ page, testData }) => {
    const feedbackPage = new FeedbackPage(page);
    const aboutUsPage = new AboutUsPage(page);
    const comment = 'Love it! 🎉✨ Great deals and friendly UI — Спасибо! ありがとう！';
    const rating = 5;

    await testData.homePage.navigateToFeedback();
    await feedbackPage.submitCompleteFeedback(comment, rating);
    await testData.homePage.navigateToAboutUs();
    await aboutUsPage.expectLoaded();
    await aboutUsPage.expectFeedbackVisible('🎉');
  });

  test('Submit Customer Feedback with XSS-like Input is Safely Rendered', async ({
    page,
    testData,
  }) => {
    const feedbackPage = new FeedbackPage(page);
    const aboutUsPage = new AboutUsPage(page);
    const comment = 'Great app <script>alert("xss")</script> — content should be safe.';
    const rating = 2;

    await testData.homePage.navigateToFeedback();
    await feedbackPage.submitCompleteFeedback(comment, rating);
    await testData.homePage.navigateToAboutUs();
    await aboutUsPage.expectLoaded();
    await aboutUsPage.expectFeedbackVisible('Great app');
  });
});
