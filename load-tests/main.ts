/* eslint-disable no-console */
/**
 * Main K6 Load Test Entry Point for Juice Shop Authentication
 *
 * This file allows running different authentication load test scenarios
 * based on environment variables.
 *
 * Usage:
 *   k6 run load-tests/main.js                          # Default smoke test
 *   k6 run -e SCENARIO=load load-tests/main.js         # Load test
 *   k6 run -e SCENARIO=stress load-tests/main.js       # Stress test
 *   k6 run -e TEST_TYPE=auth-flow load-tests/main.js   # Full auth flow
 */

// Import textSummary for results formatting
import { SummaryData, textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Import all test modules
import * as authFlowTest from './scenarios/auth-flow-load-test';

// Determine which test to run based on TEST_TYPE environment variable
const testType = __ENV.TEST_TYPE || 'auth-flow';

// Select the appropriate test module
let selectedTest;
switch (testType) {
  // case 'checkout':
  // selectedTest = checkoutTest;
  // break;
  case 'auth-flow':
  default:
    selectedTest = authFlowTest;
    break;
}

// Export the selected test configuration and functions
export const options = selectedTest.options;
export const setup = selectedTest.setup;
export const teardown = selectedTest.teardown;
export default selectedTest.default;

/**
 * Handle summary results and optionally save to file
 */
export function handleSummary(data: SummaryData) {
  const summary: { [key: string]: string } = {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };

  // Save detailed results to JSON file if specified
  if (__ENV.SAVE_RESULTS) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-results-${testType}-${timestamp}.json`;
    summary[filename] = JSON.stringify(data, null, 2);
    console.log(`📊 Detailed results saved to: ${filename}`);
  }

  return summary;
}
