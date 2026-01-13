import { expect, Locator, Page } from '@playwright/test';
import { extractAndCalculateCaptcha } from '../utils/captcha-calculator';

export class FeedbackPage {
  readonly page: Page;

  // Feedback form elements
  readonly heading: Locator;
  readonly authorInput: Locator;
  readonly commentInput: Locator;
  readonly ratingSlider: Locator;
  readonly captchaQuestion: Locator;
  readonly captchaInput: Locator;
  readonly submitButton: Locator;

  // Success message
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Feedback form elements
    this.heading = page.getByRole('heading', { name: /customer feedback/i });
    this.authorInput = page.getByLabel(/author/i);
    this.commentInput = page.getByLabel(/comment/i);
    this.ratingSlider = page.getByRole('slider');
    this.captchaQuestion = page.locator('code#captcha');
    this.captchaInput = page.getByRole('textbox', {
      name: /field for the result of the captcha code/i,
    });
    this.submitButton = page.locator('button', { hasText: /submit/i });

    // Success message
    this.successMessage = page.getByText('Thank you for your feedback.');
  }

  /**
   * Verify that the author field is populated (user is logged in)
   */
  async verifyAuthorFieldPopulated() {
    await expect(this.authorInput).toBeVisible();
    await expect(this.authorInput).not.toBeEmpty();
  }

  /**
   * Fill in the comment field
   */
  async fillComment(comment: string) {
    await this.commentInput.fill(comment);
  }

  /**
   * Set the rating by moving the slider using arrow keys
   * @param rating - The desired rating (1-5)
   */
  async setRating(rating: number) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    await this.ratingSlider.focus();

    // Slider starts at 1, so we need to press ArrowRight (rating - 1) times
    for (let i = 1; i < rating; i++) {
      await this.page.keyboard.press('ArrowRight');
    }

    await this.ratingSlider.blur();
  }

  /**
   * Solve the CAPTCHA challenge by extracting and calculating the mathematical expression
   */
  async solveCaptcha() {
    const questionText = await this.captchaQuestion.textContent();
    const captchaResult = extractAndCalculateCaptcha(questionText || '');

    if (captchaResult === null) {
      throw new Error(`Unable to solve CAPTCHA: ${questionText}`);
    }

    await this.captchaInput.fill(String(captchaResult));
  }

  /**
   * Submit the feedback form
   */
  async submitFeedback() {
    await this.submitButton.click();
  }

  /**
   * Verify that the feedback submission was successful
   */
  async verifySubmissionSuccess() {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Complete the feedback submission flow (assumes user is already on feedback page)
   * @param comment - The feedback comment to submit
   * @param rating - The star rating (1-5)
   */
  async submitCompleteFeedback(comment: string, rating: number) {
    await expect(this.heading).toBeVisible();
    await this.verifyAuthorFieldPopulated();
    await this.fillComment(comment);
    await this.setRating(rating);
    await this.solveCaptcha();
    await this.submitFeedback();
    await this.verifySubmissionSuccess();
  }
}
