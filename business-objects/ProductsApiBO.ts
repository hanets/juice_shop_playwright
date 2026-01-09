import { APIRequestContext } from '@playwright/test';
import { getQuantities, searchProducts } from '../utils/httpClient';
import { Product } from '../utils/models/product';
import { Quantity } from '../utils/models/quantity';

const MAX_PRODUCTS_DISPLAYED = 12;

export interface ProductFilterOptions {
    productFilter?: (product: Product) => boolean;
    quantityFilter?: (quantity: Quantity) => boolean;
}

export async function getFilteredProducts(request: APIRequestContext, options: ProductFilterOptions = {}): Promise<Product[]> {
    if (!options.productFilter && !options.quantityFilter) {
        throw new Error('At least one filter function must be provided');
    }
    const apiProducts = await searchProducts(request);
    const quantities = await getQuantities(request);
    const expectedCount = Math.min(apiProducts.data.length, MAX_PRODUCTS_DISPLAYED);
    return apiProducts.data.slice(0, expectedCount)
        .filter(p => {

            if (options.productFilter && !options.productFilter(p)) {
                return false;
            }
            const found = quantities.data.find(q => q.id === p.id);
            return found !== undefined && options.quantityFilter !== undefined ? options.quantityFilter(found) : true;
        });
}

export function getTotalPriceOfProducts(products: Product[]): string {
    const total = products.reduce((sum, p) => sum + p.price, 0);
    return total.toFixed(2);
}

export async function getExpectedCount(request: APIRequestContext): Promise<number> {
    const apiProducts = await searchProducts(request);
    const expectedCount = Math.min(apiProducts.data.length, MAX_PRODUCTS_DISPLAYED);
    return expectedCount;
}