import { Page, APIRequestContext } from '@playwright/test';
import { BasketPage } from '../page-objects/BasketPage';
import { ProductCardPageComponent } from '../page-objects/ProductCardPageComponent';
import { Product } from '../utils/models/product';
import { getExpectedCount, getTotalPriceOfProducts } from './ProductsApiBO';
import { TestData } from '../tests/fixtures/auth';

export async function addProductsToBasketAndVerify(
  page: Page,
  request: APIRequestContext,
  testData: TestData,
  products: Product[],
): Promise<void> {
  const expectedCount = await getExpectedCount(request);
  const homePage = testData.homePage;
  await homePage.verifyVisibleProductsCount(expectedCount);
  await homePage.verifyBasketItemsCount(0);

  for (const product of products) {
    const productPage = new ProductCardPageComponent(page, product.name);
    await productPage.validate(product.price.toString());
    await productPage.clickAddToBasket();
  }
  await homePage.verifyBasketItemsCount(products.length);
  await homePage.basketLink.click();
  // Further basket page validations can be added here
  const basketPage = new BasketPage(page);
  basketPage.expectBasketOwnedByUser(testData.email);
  for (const product of products) {
    await basketPage.expectProductQuantity(product.name, 1);
    await basketPage.expectProductPrice(product.name, product.price.toString());
  }
  await basketPage.expectTotalPrice(getTotalPriceOfProducts(products));
}
