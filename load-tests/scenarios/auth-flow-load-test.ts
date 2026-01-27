/* eslint-disable no-console */
import { sleep } from 'k6';
import http from 'k6/http';
import { createRandomRegisterUserRequest, getLoginRequest } from '../../utils/models/user';
import { config } from '../config';
import { checkAuthResponse, checkRegisterResponse, headers, randomSleep } from '../utils/helpers';

// Test configuration - can be overridden by environment variables
export const options = {
  ...config.options,
  scenarios: {
    auth_flow:
      config.options.scenarios[
        (__ENV.SCENARIO || 'smoke') as keyof typeof config.options.scenarios
      ],
  },
  tags: {
    ...config.options.tags,
    test_type: 'auth_flow',
  },
};

/**
 * Complete Authentication Flow Load Test
 *
 * This test simulates the complete user journey:
 * 1. User registration
 * 2. User login
 * 3. Optional: Token validation
 *
 * This provides a more realistic load test scenario.
 */
export default function () {
  const registerPayload = createRandomRegisterUserRequest();
  const email = registerPayload.email;
  const password = registerPayload.password;

  const registerUrl = `${config.BASE_URL}/api/Users/`;

  const registerResponse = http.post(registerUrl, JSON.stringify(registerPayload), {
    headers,
    tags: { name: 'register_user', step: 'registration' },
  });

  const registerSuccess = checkRegisterResponse(registerResponse, 'Registration Flow');

  if (!registerSuccess) {
    console.error(`Registration failed for ${email}: ${registerResponse.status}`);
    return; // Exit early if registration fails
  }

  console.log(`✓ User registered: ${email}`);

  // Realistic pause between registration and login (0-2 seconds)
  sleep(randomSleep(0, 2));

  // Step 2: User Login
  const loginPayload = getLoginRequest(email, password);
  const loginUrl = `${config.BASE_URL}/rest/user/login`;

  const loginResponse = http.post(loginUrl, JSON.stringify(loginPayload), {
    headers,
    tags: { name: 'user_login', step: 'authentication' },
  });

  const loginSuccess = checkAuthResponse(loginResponse, 'Login Flow');

  if (!loginSuccess) {
    console.error(`Login failed for ${email}: ${loginResponse.status}`);
    return;
  }

  console.log(`✓ User logged in: ${email}`);

  // Step 3: Extract and validate token
  let authToken = null;
  try {
    const responseBody = typeof loginResponse.body === 'string' ? loginResponse.body : '';
    const loginData = JSON.parse(responseBody || '{}');
    authToken = loginData.authentication?.token;

    if (authToken) {
      console.log(`✓ Auth token received for ${email}`);

      // Optional: Make an authenticated request to validate the token
      // This could be a request to get user profile, basket, etc.
      const profileResponse = http.get(`${config.BASE_URL}/rest/user/whoami`, {
        headers: {
          ...headers,
          Authorization: `Bearer ${authToken}`,
        },
        tags: { name: 'validate_token', step: 'validation' },
      });

      if (profileResponse.status === 200) {
        console.log(`✓ Token validation successful for ${email}`);
      } else {
        console.error(`Token validation failed for ${email}: ${profileResponse.status}`);
      }
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error(`Failed to parse login response for ${email}: ${error.message}`);
  }

  // Final pause to simulate user activity after login (1-3 seconds)
  sleep(randomSleep(1, 3));
}

/**
 * Setup function - runs once before the test starts
 */
export function setup() {
  console.log(`Starting complete auth flow load test against: ${config.BASE_URL}`);
  console.log(`Test scenario: ${__ENV.SCENARIO || 'smoke'}`);
  console.log('This test will perform: Registration -> Login -> Token Validation');

  // Test server connectivity
  const healthCheck = http.get(`${config.BASE_URL}/rest/admin/application-version`);
  if (healthCheck.status !== 200) {
    console.warn(`Health check failed: ${healthCheck.status}. Server might not be ready.`);
  } else {
    console.log('✓ Server health check passed');
  }

  return {};
}

/**
 * Teardown function - runs once after the test completes
 */
export function teardown() {
  console.log('Complete authentication flow load test completed');
  console.log('Check the metrics for registration, login, and token validation performance');
}
