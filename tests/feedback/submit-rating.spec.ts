import { FeedbackPage } from '../../page-objects/FeedbackPage';
import { test } from '../fixtures/auth';

// This test follows the Customer Feedback plan: 5.1 Submit Customer Feedback with 3-Star Rating

test.describe('Customer Feedback System Tests', () => {
  test('Submit Customer Feedback with 3-Star Rating', async ({ page, testData }) => {
    const feedbackPage = new FeedbackPage(page);
    const comment = 'Loving the app usability; a few UX tweaks would help.';
    const rating = 3;

    await testData.homePage.navigateToFeedback();
    await feedbackPage.submitCompleteFeedback(comment, rating);
    await testData.homePage.navigateToAboutUs();
  });
});
