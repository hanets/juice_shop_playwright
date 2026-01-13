import { Locator, Page, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;

  // Address page elements
  readonly addressPageHeading: Locator;
  readonly addNewAddressButton: Locator;
  readonly countryInput: Locator;
  readonly nameInput: Locator;
  readonly mobileInput: Locator;
  readonly zipCodeInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly submitAddressButton: Locator;
  readonly addressRadioButton: Locator;
  readonly proceedToPaymentButton: Locator;

  // Delivery method elements
  readonly deliveryPageHeading: Locator;
  readonly standardDeliveryRadio: Locator;
  readonly proceedToDeliveryButton: Locator;

  // Order review elements
  readonly orderReviewHeading: Locator;
  readonly completePurchaseButton: Locator;

  // Order confirmation elements
  readonly orderConfirmationHeading: Locator;
  readonly trackOrdersLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Address page
    this.addressPageHeading = page.getByRole('heading', { name: 'Select an address' });
    this.addNewAddressButton = page.getByRole('button', { name: 'Add a new address' });
    this.countryInput = page.getByRole('textbox', { name: 'Country' });
    this.nameInput = page.getByRole('textbox', { name: 'Name' });
    this.mobileInput = page.getByRole('spinbutton', { name: 'Mobile Number' });
    this.zipCodeInput = page.getByRole('textbox', { name: 'ZIP Code' });
    this.addressInput = page.getByRole('textbox', { name: 'Address' });
    this.cityInput = page.getByRole('textbox', { name: 'City' });
    this.stateInput = page.getByRole('textbox', { name: 'State' });
    this.submitAddressButton = page.getByRole('button', { name: 'Submit' });
    this.addressRadioButton = page.locator('input[type="radio"]').first();
    this.proceedToPaymentButton = page.getByRole('button', {
      name: 'Proceed to payment selection',
    });

    // Delivery method
    this.deliveryPageHeading = page.getByRole('heading', { name: 'Choose a delivery speed' });
    this.standardDeliveryRadio = page
      .getByRole('row', { name: 'Standard Delivery 0.00¤ 5 Days' })
      .locator('input[type="radio"]');
    this.proceedToDeliveryButton = page.getByRole('button', { name: 'Proceed to delivery method' });

    // Order review
    this.orderReviewHeading = page.getByRole('heading', { name: /Your Basket/ });
    this.completePurchaseButton = page.getByRole('button', { name: 'Complete your purchase' });

    // Order confirmation
    this.orderConfirmationHeading = page.getByRole('heading', {
      name: 'Thank you for your purchase!',
    });
    this.trackOrdersLink = page.getByRole('link', { name: 'Track Orders' });
  }

  async addDeliveryAddress(addressData: {
    country: string;
    name: string;
    mobile: string;
    zipCode: string;
    address: string;
    city: string;
    state: string;
  }): Promise<void> {
    await expect(this.addressPageHeading).toBeVisible();
    await this.addNewAddressButton.click();

    await this.countryInput.fill(addressData.country);
    await this.nameInput.fill(addressData.name);
    await this.mobileInput.fill(addressData.mobile);
    await this.zipCodeInput.fill(addressData.zipCode);
    await this.addressInput.fill(addressData.address);
    await this.cityInput.fill(addressData.city);
    await this.stateInput.fill(addressData.state);

    await this.submitAddressButton.click();

    // Verify address was added
    await expect(
      this.page.getByText(
        `The address at ${addressData.city} has been successfully added to your addresses.`,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(addressData.name)).toBeVisible();
    await expect(
      this.page.getByText(
        `${addressData.address}, ${addressData.city}, ${addressData.state}, ${addressData.zipCode}`,
      ),
    ).toBeVisible();
  }

  async selectFirstAddress(): Promise<void> {
    await this.addressRadioButton.click();
  }

  async proceedToPaymentSelection(): Promise<void> {
    await this.proceedToPaymentButton.click();
  }

  async selectStandardDelivery(): Promise<void> {
    await expect(this.deliveryPageHeading).toBeVisible();
    await this.standardDeliveryRadio.click();
  }

  async proceedToDeliveryMethod(): Promise<void> {
    await this.proceedToDeliveryButton.click();
  }

  async verifyOrderReview(
    userEmail: string,
    expectedTotal: string,
    paymentMethodDigits?: string,
  ): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: `Your Basket (${userEmail})` }),
    ).toBeVisible();
    await expect(this.page.getByText('Delivery Address')).toBeVisible();
    await expect(this.page.getByText('Payment Method')).toBeVisible();

    if (paymentMethodDigits) {
      await expect(this.page.getByText(`Card ending in ${paymentMethodDigits}`)).toBeVisible();
    }

    await expect(this.page.getByText('Order Summary')).toBeVisible();
    await expect(this.page.getByText('Total Price')).toBeVisible();
    await expect(
      this.page.locator('tr', { hasText: 'Total Price' }).getByText(expectedTotal),
    ).toBeVisible();
  }

  async completePurchase(): Promise<void> {
    await this.completePurchaseButton.click();
  }

  async verifyOrderConfirmation(productNames: string[]): Promise<void> {
    await expect(this.orderConfirmationHeading).toBeVisible();
    await expect(
      this.page.getByText('Your order has been placed and is being processed.'),
    ).toBeVisible();
    await expect(this.page.getByText('Your order will be delivered in 5 days.')).toBeVisible();

    // Verify all products in confirmation
    for (const productName of productNames) {
      await expect(this.page.getByText(productName)).toBeVisible();
    }
  }

  async getOrderIdFromUrl(): Promise<string> {
    // Wait for URL to navigate to the order-completion page
    await this.page.waitForURL(/.*#\/order-completion\/.*/, { timeout: 10000 });

    const url = this.page.url();
    // Extract order ID from /order-completion/ORDER_ID pattern
    const orderId = url.match(/#\/order-completion\/(.+)$/)?.[1];

    expect(orderId, `Could not extract order ID from URL: ${url}`).toBeTruthy();
    return orderId!;
  }

  async trackOrder(orderId: string, productNames: string[]): Promise<void> {
    await this.trackOrdersLink.click();

    // Verify order tracking page
    await expect(
      this.page.getByRole('heading', { name: `Search Results - ${orderId}` }),
    ).toBeVisible();
    await expect(this.page.getByText('Expected Delivery')).toBeVisible();
    await expect(this.page.getByText('5 Days')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Ordered products' })).toBeVisible();

    // Verify all ordered products in tracking
    for (const productName of productNames) {
      await expect(this.page.getByText(productName)).toBeVisible();
    }
  }
}
