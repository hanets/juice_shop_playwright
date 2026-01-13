import { APIRequestContext } from '@playwright/test';
import { BASE_URL } from './config';
import { ProductSearchResponse } from '../models/product';
import { QuantitiesResponse } from '../models/quantity';
import { getAuthToken } from './AuthService';

export interface ProductSearchOptions {
  token?: string;
  ifNoneMatch?: string;
}

export async function searchProducts(
  request: APIRequestContext,
  options: ProductSearchOptions = {},
): Promise<ProductSearchResponse> {
  const response = await request.get(`${BASE_URL}/rest/products/search?q=`, {
    headers: getHeaders(request, options.token),
  });
  return response.json();
}

function getHeaders(request: APIRequestContext, tokenOptioanl?: string) {
  const token = tokenOptioanl ?? getAuthToken(request);
  if (!token) {
    throw new Error('No auth token available. Call authenticate() first or pass a token.');
  }
  return {
    Accept: 'application/json, text/plain, */*',
    Authorization: `Bearer ${token}`,
  };
}

// --- Quantities ---
export async function getQuantities(
  request: APIRequestContext,
  options: { token?: string } = {},
): Promise<QuantitiesResponse> {
  const response = await request.get(`${BASE_URL}/api/Quantitys/`, {
    headers: getHeaders(request, options.token),
  });

  if (!response.ok()) {
    throw new Error(`Get quantities failed: ${response.status()} ${response.statusText()}`);
  }

  return response.json();
}
