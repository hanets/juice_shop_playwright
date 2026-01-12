import { test, expect } from '@playwright/test';
import { LoginResponse } from '../../utils/api/AuthService';
import { searchProducts } from '../../utils/api/ProductService';
import { registerUser } from '../../utils/api/UserService';
import { ProductSearchResponse } from '../../utils/models/product';
import { createRegisterUserRequest, RegisterUserResponse } from '../../utils/models/user';
import { loginNewUser } from '../../business-objects/LoginBO';

test.describe.parallel('API Tests', () => {
  test('API Login', async ({ request }) => {
    const { login, email }: { login: LoginResponse; email: string } = await loginNewUser(request);
    expect(login.authentication).toBeTruthy();
    expect(login.authentication.token).toBeDefined();
    expect(login.authentication.umail).toBe(email);
  });

  test('Product search API request', async ({ request }) => {
    await loginNewUser(request);
    const result: ProductSearchResponse = await searchProducts(request);
    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.some((item) => item.name.includes('Apple'))).toBeTruthy();
  });

  test('Product search API request - unauthorized', async ({ request }) => {
    const result: ProductSearchResponse = await searchProducts(request, { token: 'invalid-token' });
    expect(result.status).toBe('unauthorized');
  });

  test('Register user API', async ({ request }) => {
    const unique = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const email = `tests${unique}_${random}@email.ss`;
    const payload = createRegisterUserRequest(email, '1234567');
    const res: RegisterUserResponse = await registerUser(request, payload);
    expect(res.status).toBe('success');
    expect(res.data).toBeTruthy();
    expect(res.data.email).toBe(email);
    expect(res.data.id).toBeGreaterThan(0);
  });
});
