import { Page, expect, APIRequestContext } from '@playwright/test';
import { CheckoutPage } from '../page-objects/CheckoutPage';
import { PaymentBO, PaymentMethod } from './PaymentBO';
import { PaymentCardData } from '../page-objects/PaymentPage';
import { BasketPage } from '../page-objects/BasketPage';
import { Product } from '../utils/models/product';
import { getTotalPriceOfProducts } from './ProductsApiBO';

export interface DeliveryAddress {
    country: string;
    name: string;
    mobile: string;
    zipCode: string;
    address: string;
    city: string;
    state: string;
}

export interface CheckoutOptions {
    deliveryAddress?: DeliveryAddress;
    paymentCard?: PaymentCardData;
    deliveryMethod?: 'standard' | 'express' | 'next-day';
}

export interface OrderResult {
    orderId: string;
    total: string;
    products: Product[];
    paymentMethod: PaymentMethod;
}

export class CheckoutBO {
    private readonly page: Page;
    private readonly checkoutPage: CheckoutPage;
    private readonly basketPage: BasketPage;
    private readonly paymentBO: PaymentBO;
    private readonly request?: APIRequestContext;

    constructor(page: Page, request?: APIRequestContext) {
        this.page = page;
        this.checkoutPage = new CheckoutPage(page);
        this.basketPage = new BasketPage(page);
        this.paymentBO = new PaymentBO(page, request);
        this.request = request;
    }

    /**
     * Create default delivery address for testing
     */
    static createDefaultAddress(overrides: Partial<DeliveryAddress> = {}): DeliveryAddress {
        return {
            country: 'United States',
            name: 'John Tester',
            mobile: '5551234567',
            zipCode: '12345',
            address: '123 Main Street',
            city: 'Anytown',
            state: 'CA',
            ...overrides
        };
    }

    /**
     * Proceed from basket to checkout
     */
    async proceedToCheckout(): Promise<void> {
        await this.basketPage.proceedToCheckout();
    }

    /**
     * Complete address setup step
     */
    async setupDeliveryAddress(addressData?: DeliveryAddress): Promise<void> {
        const address = addressData || CheckoutBO.createDefaultAddress();
        
        await this.checkoutPage.addDeliveryAddress(address);
        await this.checkoutPage.selectFirstAddress();
        await this.checkoutPage.proceedToPaymentSelection();
    }

    /**
     * Complete delivery method selection step
     */
    async setupDeliveryMethod(method: 'standard' | 'express' | 'next-day' = 'standard'): Promise<void> {
        // For now, only standard delivery is implemented in CheckoutPage
        if (method === 'standard') {
            await this.checkoutPage.selectStandardDelivery();
        }
        // TODO: Add other delivery methods as needed
        
        await this.checkoutPage.proceedToDeliveryMethod();
    }

    /**
     * Complete payment setup step
     */
    async setupPayment(paymentCard?: PaymentCardData): Promise<PaymentMethod> {
        const paymentMethod = await this.paymentBO.setupPaymentWithCard(paymentCard);
        await this.paymentBO.proceedToReview();
        return paymentMethod;
    }

    /**
     * Verify order review and complete the purchase
     */
    async completeOrder(userEmail: string, expectedTotal: string, paymentMethod: PaymentMethod): Promise<void> {
        // Verify order summary
        await this.checkoutPage.verifyOrderReview(userEmail, expectedTotal, paymentMethod.lastFourDigits);
        await this.paymentBO.verifyPaymentMethodInReview(paymentMethod);
        
        // Complete purchase
        await this.checkoutPage.completePurchase();
    }

    /**
     * Get order ID after purchase completion
     */
    async getOrderId(): Promise<string> {
        return await this.checkoutPage.getOrderIdFromUrl();
    }

    /**
     * Verify order confirmation
     */
    async verifyOrderConfirmation(products: string[]): Promise<void> {
        await this.checkoutPage.verifyOrderConfirmation(products);
    }

    /**
     * Track the completed order
     */
    async trackOrder(orderId: string, products: string[]): Promise<void> {
        await this.checkoutPage.trackOrder(orderId, products);
    }

    /**
     * Complete the entire checkout flow with default options
     */
    async completeCheckoutFlow(
        userEmail: string,
        products: Product[],
        options: CheckoutOptions = {}
    ): Promise<OrderResult> {
        // Step 1: Proceed to checkout
        await this.proceedToCheckout();

        // Step 2: Setup delivery address
        await this.setupDeliveryAddress(options.deliveryAddress);

        // Step 3: Setup delivery method
        await this.setupDeliveryMethod(options.deliveryMethod || 'standard');

        // Step 4: Setup payment
        const paymentMethod = await this.setupPayment(options.paymentCard);

        // Step 5: Complete order
        const expectedTotal = getTotalPriceOfProducts(products);
        await this.completeOrder(userEmail, expectedTotal, paymentMethod);

        // Step 6: Get order ID (after purchase completion)
        const orderId = await this.getOrderId();

        // Step 7: Verify confirmation
        const productNames = products.map(p => p.name);
        await this.verifyOrderConfirmation(productNames);

        // Step 8: Track order
        await this.trackOrder(orderId, productNames);

        return {
            orderId,
            total: expectedTotal,
            products,
            paymentMethod
        };
    }

    /**
     * Complete checkout with custom address and payment
     */
    async completeCheckoutWithCustomDetails(
        userEmail: string,
        products: Product[],
        addressData: DeliveryAddress,
        paymentCard: PaymentCardData
    ): Promise<OrderResult> {
        return this.completeCheckoutFlow(userEmail, products, {
            deliveryAddress: addressData,
            paymentCard: paymentCard
        });
    }

    /**
     * Quick checkout with default settings
     */
    async quickCheckout(
        userEmail: string,
        products: Product[]
    ): Promise<OrderResult> {
        return this.completeCheckoutFlow(userEmail, products);
    }
}