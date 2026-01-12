import { test } from '../fixtures/auth';
import { ProductCardPageComponent } from '../../page-objects/ProductCardPageComponent';
import { getFilteredProducts } from '../../business-objects/ProductsApiBO';
import { CheckoutBO } from '../../business-objects/CheckoutBO';
import { addProductsToBasketAndVerify } from '../../business-objects/ProductsBO';

// Verifies products visible in UI match the API search results
// Uses loginNewUser fixture to authenticate by API and carry auth into the UI

test.describe('Products - Add to Basket', () => {
  test('Add products to basket based on quantity', async ({ page, request, testData }) => {
    const filteredProducts = await getFilteredProducts(request, {
      quantityFilter: (q) => q.quantity > 5,
    });
    await addProductsToBasketAndVerify(page, request, testData, filteredProducts);

    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, filteredProducts);
    console.log('Proceeded to checkout successfully');
  });

  test('Complete Purchase Flow - Successful Checkout', async ({ page, request, testData }) => {
    const products = await getFilteredProducts(request, {
      productFilter: (p) => p.name.includes('1000ml'),
      quantityFilter: (q) => q.quantity > 1,
    });
    await addProductsToBasketAndVerify(page, request, testData, products);

    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, products);
  });

  test('Complete Purchase Flow - Successful Checkout 1 item', async ({
    page,
    request,
    testData,
  }) => {
    const products = (
      await getFilteredProducts(request, {
        quantityFilter: (q) => q.quantity > 10,
      })
    ).slice(0, 1);

    const productPage = new ProductCardPageComponent(page, products[0].name);
    await productPage.validateNoRibbon();

    await addProductsToBasketAndVerify(page, request, testData, products);

    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, products);
    await testData.homePage.goToHomePage();
    await productPage.validate(products[0].price.toString());
    await productPage.validateNoRibbon();
  });

  test('Complete Purchase Flow - Successful Checkout - last item', async ({
    page,
    request,
    testData,
  }, testInfo) => {
    const products = (
      await getFilteredProducts(request, {
        quantityFilter: (q) => q.quantity === 1,
      })
    ).slice(0, 1);

    testInfo.skip(products.length === 0, 'No products with quantity 1 available for testing');

    const productPage = new ProductCardPageComponent(page, products[0].name);
    await productPage.validateRibbon('Only 1 left');

    await addProductsToBasketAndVerify(page, request, testData, products);

    const checkoutBO = new CheckoutBO(page, request);
    await checkoutBO.quickCheckout(testData.email, products);
    await testData.homePage.goToHomePage();
    await productPage.validateRibbon('Sold Out');
  });
});
