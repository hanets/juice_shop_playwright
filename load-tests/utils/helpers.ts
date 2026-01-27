import { check } from 'k6';
import { Response } from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const authAttempts = new Counter('auth_attempts');
export const authSuccesses = new Counter('auth_successes');
export const responseTime = new Trend('custom_response_time');

// Standard headers for API requests
export const headers = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'User-Agent': 'k6-load-test/1.0',
};

// Check response and record metrics
export function checkResponse(response: Response, testName: string, expectedStatus = 200) {
  const success = check(response, {
    [`${testName}: status is ${expectedStatus}`]: (r: Response) => r.status === expectedStatus,
    [`${testName}: response time < 1000ms`]: (r: Response) => r.timings.duration < 1000,
    [`${testName}: response has body`]: (r: Response) =>
      r.body != null && (typeof r.body === 'string' ? r.body.length > 0 : r.body.byteLength > 0),
  });

  // Record custom metrics
  responseTime.add(response.timings.duration);
  errorRate.add(!success);

  return success;
}

// Check authentication response specifically
export function checkAuthResponse(response: Response, testName: string) {
  const success = checkResponse(response, testName);

  if (success) {
    const hasToken = check(response, {
      [`${testName}: has authentication token`]: (r: Response) => {
        try {
          if (typeof r.body !== 'string') return false;
          const data = JSON.parse(r.body);
          return data.authentication && data.authentication.token;
        } catch {
          return false;
        }
      },
    });

    authAttempts.add(1);
    if (hasToken) {
      authSuccesses.add(1);
    }

    return hasToken;
  }

  authAttempts.add(1);
  return false;
}

// Check registration response
export function checkRegisterResponse(response: Response, testName: string) {
  const success = checkResponse(response, testName, 201); // User registration returns 201

  if (success) {
    return check(response, {
      [`${testName}: has user data`]: (r: Response) => {
        try {
          if (typeof r.body !== 'string') return false;
          const data = JSON.parse(r.body);
          return data.status === 'success' && data.data && data.data.id;
        } catch {
          return false;
        }
      },
    });
  }

  return false;
}

// Sleep with jitter to simulate realistic user behavior
export function randomSleep(min = 1, max = 3) {
  const sleepTime = Math.random() * (max - min) + min;
  return sleepTime;
}
