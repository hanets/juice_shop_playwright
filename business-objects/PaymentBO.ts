import { Page, APIRequestContext } from '@playwright/test';
import { PaymentPage, PaymentCardData } from '../page-objects/PaymentPage';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'other';
  lastFourDigits?: string;
  cardholderName?: string;
}

export class PaymentBO {
  private readonly paymentPage: PaymentPage;
  private readonly request?: APIRequestContext;

  constructor(page: Page, request?: APIRequestContext) {
    this.paymentPage = new PaymentPage(page);
    this.request = request;
  }

  /**
   * Navigate to payment options page
   */
  async navigateToPaymentOptions(): Promise<void> {
    await this.paymentPage.waitForPaymentPage();
  }

  /**
   * Add a new payment card
   */
  async addPaymentCard(cardData: PaymentCardData): Promise<PaymentMethod> {
    await this.paymentPage.waitForPaymentPage();
    await this.paymentPage.clickAddNewCard();
    await this.paymentPage.fillCardDetails(cardData);
    await this.paymentPage.submitCard();

    // Verify card was added successfully
    const lastFourDigits = cardData.number.slice(-4);
    await this.paymentPage.verifyCardAdded(lastFourDigits);

    return {
      id: `card-${lastFourDigits}`,
      type: 'card',
      lastFourDigits,
      cardholderName: cardData.name,
    };
  }

  /**
   * Create a test payment card with default values
   */
  static createTestCard(overrides: Partial<PaymentCardData> = {}): PaymentCardData {
    return {
      name: 'John Tester',
      number: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2088',
      ...overrides,
    };
  }

  /**
   * Select the last added payment method
   */
  async selectLastPaymentMethod(): Promise<void> {
    await this.paymentPage.selectLastPaymentMethod();
  }

  /**
   * Select a specific payment method by its identifier
   */
  async selectPaymentMethod(paymentMethod: PaymentMethod): Promise<void> {
    // For now, just use the last payment method since we just added it
    // This can be enhanced later if needed to select specific methods
    await this.paymentPage.selectLastPaymentMethod();
  }

  /**
   * Proceed to order review after payment method selection
   */
  async proceedToReview(): Promise<void> {
    await this.paymentPage.proceedToReview();
  }

  /**
   * Complete payment setup flow with a new card
   */
  async setupPaymentWithCard(cardData?: PaymentCardData): Promise<PaymentMethod> {
    const card = cardData || PaymentBO.createTestCard();
    const paymentMethod = await this.addPaymentCard(card);
    // Simply select the last payment method since we just added it
    await this.selectLastPaymentMethod();
    return paymentMethod;
  }

  /**
   * Verify payment method appears in order review
   */
  async verifyPaymentMethodInReview(paymentMethod: PaymentMethod): Promise<void> {
    if (paymentMethod.type === 'card' && paymentMethod.lastFourDigits) {
      await this.paymentPage.verifyPaymentMethodInReview(paymentMethod.lastFourDigits);
    }
  }

  /**
   * Get available payment methods (if API integration is available)
   */
  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    // This could be expanded to use API calls if available
    // For now, return methods visible on the UI using PaymentPage
    const methods: PaymentMethod[] = [];

    const cardCount = await this.paymentPage.getAvailablePaymentMethodsCount();

    for (let i = 0; i < cardCount; i++) {
      methods.push({
        id: `existing-card-${i}`,
        type: 'card',
      });
    }

    return methods;
  }
}
