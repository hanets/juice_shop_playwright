import { Page, expect, Locator } from '@playwright/test';

export interface PaymentCardData {
    name: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
}

export class PaymentPage {
    readonly page: Page;
    
    // Payment page elements
    readonly paymentPageHeading: Locator;
    readonly addNewCardButton: Locator;
    readonly cardNameInput: Locator;
    readonly cardNumberInput: Locator;
    readonly expiryMonthSelect: Locator;
    readonly expiryYearSelect: Locator;
    readonly submitCardButton: Locator;
    readonly cardRadioButton: Locator;
    readonly proceedToReviewButton: Locator;

    constructor(page: Page) {
        this.page = page;
        
        this.paymentPageHeading = page.getByRole('heading', { name: 'My Payment Options' });
        this.addNewCardButton = page.getByRole('button', { name: 'Add new card Add a credit or' });
        this.cardNameInput = page.getByRole('textbox', { name: 'Name' });
        this.cardNumberInput = page.getByRole('spinbutton', { name: 'Card Number' });
        this.expiryMonthSelect = page.getByLabel('Expiry Month');
        this.expiryYearSelect = page.getByLabel('Expiry Year');
        this.submitCardButton = page.getByRole('button', { name: 'Submit' });
        this.cardRadioButton = page.locator('input[type="radio"]').last();
        this.proceedToReviewButton = page.getByRole('button', { name: 'Proceed to review' });
    }

    async waitForPaymentPage(): Promise<void> {
        await expect(this.paymentPageHeading).toBeVisible();
    }

    async clickAddNewCard(): Promise<void> {
        await this.addNewCardButton.click();
    }

    async fillCardDetails(cardData: PaymentCardData): Promise<void> {
        await this.cardNameInput.fill(cardData.name);
        await this.cardNumberInput.fill(cardData.number);
        await this.expiryMonthSelect.selectOption([cardData.expiryMonth]);
        await this.expiryYearSelect.selectOption([cardData.expiryYear]);
    }

    async submitCard(): Promise<void> {
        await this.submitCardButton.click();
    }

    async verifyCardAdded(lastFourDigits: string): Promise<void> {
        await expect(this.page.getByText(`Your card ending with ${lastFourDigits} has been saved for your convenience.`)).toBeVisible();
        await expect(this.page.getByText(`************${lastFourDigits}`)).toBeVisible();
    }

    async selectLastPaymentMethod(): Promise<void> {
        await this.cardRadioButton.click();
    }

    async proceedToReview(): Promise<void> {
        await this.proceedToReviewButton.click();
    }

    async verifyPaymentMethodInReview(lastFourDigits: string): Promise<void> {
        await expect(this.page.getByText('Payment Method')).toBeVisible();
        await expect(this.page.getByText(`Card ending in ${lastFourDigits}`)).toBeVisible();
    }

    async getAvailablePaymentMethodsCount(): Promise<number> {
        const cardElements = this.page.locator('input[type="radio"]').locator('..', { 
            hasText: /\*{12}\d{4}/ 
        });
        return await cardElements.count();
    }
}