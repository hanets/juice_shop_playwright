import { CheckoutBO } from '../../business-objects/CheckoutBO';
import { getFilteredProducts } from '../../business-objects/ProductsApiBO';
import { addProductsToBasketAndVerify } from '../../business-objects/ProductsBO';
import { BasketPage } from '../../page-objects/BasketPage';
import { test } from '../fixtures/auth';

test.describe('Basket - Quantity Management', () => {
  test('Increase item quantity in basket', async ({ page, request, testData }) => {
    const products = (
      await getFilteredProducts(request, {
        quantityFilter: (q) => q.quantity >= 5,
      })
    ).slice(0, 1);
    await addProductsToBasketAndVerify(page, request, testData, products);

    const basketPage = new BasketPage(page);
    const productName = products[0].name;

    await basketPage.expectProductQuantity(productName, 1);

    await basketPage.increaseQuantity(productName, 1);

    await basketPage.expectProductQuantity(productName, 2);

    const productsWithQuantity2 = [products[0], products[0]];

    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, productsWithQuantity2);
  });

  test('Increase item quantity in basket - max amount', async ({ page, request, testData }) => {
    const products = (
      await getFilteredProducts(request, {
        quantityFilter: (q) => q.quantity > 5,
      })
    ).slice(0, 1);
    await addProductsToBasketAndVerify(page, request, testData, products);

    const basketPage = new BasketPage(page);
    const productName = products[0].name;

    await basketPage.expectProductQuantity(productName, 1);

    await basketPage.increaseQuantity(productName, 5); // Try to increase beyond max available quantity

    await basketPage.verifySnackbarMaxQuantityForOrder();
    await basketPage.expectProductQuantity(productName, 5);

    const productsWithQuantity2 = Array(5).fill(products[0]);
    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, productsWithQuantity2);
  });

  test('Decrease item quantity in basket', async ({ page, request, testData }) => {
    const products = (
      await getFilteredProducts(request, {
        quantityFilter: (q) => q.quantity >= 5,
      })
    ).slice(0, 1);
    await addProductsToBasketAndVerify(page, request, testData, products);

    const basketPage = new BasketPage(page);
    const productName = products[0].name;

    await basketPage.expectProductQuantity(productName, 1);

    await basketPage.increaseQuantity(productName, 1);
    await basketPage.expectProductQuantity(productName, 2);

    await basketPage.decreaseQuantity(productName, 1);

    await basketPage.expectProductQuantity(productName, 1);

    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, products);
  });

  test('Remove product from basket', async ({ page, request, testData }) => {
    const products = (
      await getFilteredProducts(request, {
        quantityFilter: (q) => q.quantity >= 5,
      })
    ).slice(0, 2);
    await addProductsToBasketAndVerify(page, request, testData, products);

    const basketPage = new BasketPage(page);
    const productName = products[0].name;

    await basketPage.removeProduct(productName);
    await basketPage.expectProductNotPresent(productName);
    await basketPage.expectTotalPrice(products[1].price.toFixed(2));

    const remainingProducts = products.slice(1);

    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, remainingProducts);
  });
});
