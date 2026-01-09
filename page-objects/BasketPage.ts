import { Locator, Page, expect } from '@playwright/test';

export class BasketPage {
    private readonly root: Locator;

    constructor(page: Page) {
        // Scope strictly to the basket card
        this.root = page.locator('mat-card', {
            has: page.getByRole('heading', { name: /your basket/i })
        });
    }

    // ---------- Locators (scoped) ----------

    private rowByProductName(productName: string): Locator {
        return this.root
            .locator('mat-row', { hasText: productName });
    }

    private increaseButton(row: Locator): Locator {
        return row.locator('mat-cell.mat-column-quantity button', {
            has: row.locator('svg[data-icon="plus-square"]')
        });
    }

    private decreaseButton(row: Locator): Locator {
        return row.locator('mat-cell.mat-column-quantity button', {
            has: row.locator('svg[data-icon="minus-square"]')
        });
    }

    private removeButton(row: Locator): Locator {
        return row.locator('mat-cell.mat-column-remove button');
    }

    private quantityLabel(row: Locator): Locator {
        return row.locator('mat-cell.mat-column-quantity > span');
    }

    private priceLabel(row: Locator): Locator {
        return row.locator('mat-cell.mat-column-price');
    }
    // ---------- Basket-level locators ----------

    private totalPriceLabel(): Locator {
        return this.root.locator('#price');
    }

    private checkoutButton(): Locator {
        return this.root.getByRole('button', { name: /checkout/i });
    }

    // ---------- Business actions ----------

    async increaseQuantity(productName: string, times = 1): Promise<void> {
        const row = this.rowByProductName(productName);
        await expect(row).toBeVisible();

        for (let i = 0; i < times; i++) {
            await this.increaseButton(row).click();
        }
    }

    async decreaseQuantity(productName: string, times = 1): Promise<void> {
        const row = this.rowByProductName(productName);
        await expect(row).toBeVisible();

        for (let i = 0; i < times; i++) {
            await this.decreaseButton(row).click();
        }
    }

    async removeProduct(productName: string): Promise<void> {
        const row = this.rowByProductName(productName);
        await expect(row).toBeVisible();
        await this.removeButton(row).click();
    }

    async proceedToCheckout(): Promise<void> {
        await expect(this.checkoutButton()).toBeEnabled();
        await this.checkoutButton().click();
    }

    // ---------- Business assertions ----------
    async expectBasketOwnedByUser(email: string): Promise<void> {
        await expect(this.root.getByRole('heading', { name: `Your Basket (${email})` })).toBeVisible();
    }

    async expectProductQuantity(productName: string, expectedQty: number): Promise<void> {
        await expect(this.root).toBeVisible();
        const row = this.rowByProductName(productName);
        await expect(row).toBeVisible();
        await expect(this.quantityLabel(row)).toHaveText(String(expectedQty));
    }

    async expectProductPrice(productName: string, expectedPrice: string): Promise<void> {
        const row = this.rowByProductName(productName);
        await expect(this.priceLabel(row)).toContainText(expectedPrice);
    }

    async expectProductNotPresent(productName: string): Promise<void> {
        await expect(this.rowByProductName(productName)).toHaveCount(0);
    }

    async expectTotalPrice(expectedTotal: string): Promise<void> {
        await expect.soft(this.totalPriceLabel()).toContainText(expectedTotal + '¤');
    }
}
