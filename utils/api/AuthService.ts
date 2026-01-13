import { APIRequestContext, APIResponse } from '@playwright/test';
import { BASE_URL } from './config';

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

export async function loginViaApi(
  request: APIRequestContext,
  data: LoginRequest,
): Promise<LoginResponse> {
  const response: APIResponse = await request.post(`${BASE_URL}/rest/user/login`, {
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
    data,
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${response.statusText()}`);
  }

  return response.json();
}

// Login and persist token scoped to this request context
export async function authenticate(
  request: APIRequestContext,
  data: LoginRequest,
): Promise<LoginResponse> {
  const res = await loginViaApi(request, data);
  setAuthToken(request, res.authentication.token);
  return res;
}
