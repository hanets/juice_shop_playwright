import { APIRequestContext, APIResponse } from '@playwright/test';
import { RegisterUserRequest, RegisterUserResponse } from './models/user';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// --- Product Search Models ---
import { ProductSearchResponse } from './models/product';
import { QuantitiesResponse } from './models/quantity';

export interface ProductSearchOptions {
  token?: string;
  ifNoneMatch?: string;
}

export async function searchProducts(request: APIRequestContext, options: ProductSearchOptions = {}): Promise<ProductSearchResponse> {
  const token = options.token ?? getAuthToken(request);
  if (!token) {
    throw new Error('No auth token available. Call authenticate() first or pass a token.');
  }
  const response = await request.get(`${BASE_URL}/rest/products/search?q=`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Authorization': `Bearer ${token}`
    },
  });
  return response.json();
}

// --- Auth Token Store (per worker via request context) ---
const tokenStore = new WeakMap<APIRequestContext, string>();

export function setAuthToken(request: APIRequestContext, token: string): void {
  tokenStore.set(request, token);
}

export function getAuthToken(request: APIRequestContext): string | undefined {
  return tokenStore.get(request);
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  authentication: {
    token: string;
    bid: number;
    umail: string;
  };
}

export async function loginViaApi(request: APIRequestContext, data: LoginRequest): Promise<LoginResponse> {
  const response: APIResponse = await request.post(`${BASE_URL}/rest/user/login`, {
    headers: {
      'Accept': 'application/json, text/plain, */*'
    },
    data,
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${response.statusText()}`);
  }

  return response.json();
}

// Login and persist token scoped to this request context
export async function authenticate(request: APIRequestContext, data: LoginRequest): Promise<LoginResponse> {
  const res = await loginViaApi(request, data);
  setAuthToken(request, res.authentication.token);
  return res;
}

export async function registerUser(
  request: APIRequestContext,
  data: RegisterUserRequest
): Promise<RegisterUserResponse> {
  const response: APIResponse = await request.post(`${BASE_URL}/api/Users/`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    data,
  });

  if (!response.ok()) {
    throw new Error(`Register user failed: ${response.status()} ${response.statusText()}`);
  }

  return response.json();
}

// --- Quantities ---
export async function getQuantities(
  request: APIRequestContext,
  options: { token?: string } = {}
): Promise<QuantitiesResponse> {
  const headers: Record<string, string> = {
    'Accept': 'application/json, text/plain, */*',
  };

  const token = options.token ?? getAuthToken(request);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await request.get(`${BASE_URL}/api/Quantitys/`, {
    headers,
  });

  if (!response.ok()) {
    throw new Error(`Get quantities failed: ${response.status()} ${response.statusText()}`);
  }

  return response.json();
}
