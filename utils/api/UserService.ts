import { APIRequestContext, APIResponse } from '@playwright/test';
import { BASE_URL } from './config';
import { RegisterUserRequest, RegisterUserResponse } from '../models/user';

export async function registerUser(
  request: APIRequestContext,
  data: RegisterUserRequest,
): Promise<RegisterUserResponse> {
  const response: APIResponse = await request.post(`${BASE_URL}/api/Users/`, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    data,
  });

  if (!response.ok()) {
    throw new Error(`Register user failed: ${response.status()} ${response.statusText()}`);
  }

  return response.json();
}
