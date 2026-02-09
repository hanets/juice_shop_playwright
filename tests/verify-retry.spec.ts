/* eslint-disable playwright/no-conditional-in-test */
import { expect, test } from '@playwright/test';

test('flaky test for retry verification', async ({}, testInfo) => {
  if (testInfo.retry === 0) {
    throw new Error('Simulated failure on first attempt');
  }

  expect(true).toBe(true);
});
