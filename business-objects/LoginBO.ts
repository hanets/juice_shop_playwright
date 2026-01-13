import { APIRequestContext } from '@playwright/test';
import { authenticate, LoginResponse } from '../utils/api/AuthService';
import { registerUser } from '../utils/api/UserService';
import { createRegisterUserRequest, RegisterUserResponse } from '../utils/models/user';

export interface NewUserAuth {
  email: string;
  password: string;
  register: RegisterUserResponse;
  login: LoginResponse;
  token: string;
}

// Registers a new user and logs them in, storing auth token in request context
export async function loginNewUser(request: APIRequestContext): Promise<NewUserAuth> {
  const unique = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const email = `user${unique}_${random}@example.com`;
  const password = 'Test@1234';

  const registerPayload = createRegisterUserRequest(email, password);
  const registerRes = await registerUser(request, registerPayload);

  if (registerRes.status !== 'success' || !registerRes.data) {
    throw new Error(`Registration failed for ${email}`);
  }

  const loginRes = await authenticate(request, { email, password });
  const token = loginRes.authentication?.token;

  if (!token) {
    throw new Error('Login did not return a token');
  }

  return { email, password, register: registerRes, login: loginRes, token };
}
