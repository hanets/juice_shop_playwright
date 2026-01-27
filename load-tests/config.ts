// k6 Configuration for Juice Shop Load Tests
export const config = {
  // Base URL for the Juice Shop application
  BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',

  // Default test options
  options: {
    // Scenarios for different load patterns
    scenarios: {
      // Smoke test - minimal load to verify functionality
      smoke: {
        executor: 'constant-vus',
        vus: 1,
        duration: '1m',
      },
      // Load test - normal expected load
      load: {
        executor: 'constant-vus',
        vus: 10,
        duration: '5m',
      },
      // Stress test - high load to find breaking points
      stress: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '2m', target: 20 },
          { duration: '5m', target: 20 },
          { duration: '2m', target: 40 },
          { duration: '5m', target: 40 },
          { duration: '2m', target: 0 },
        ],
      },
      // Spike test - sudden load increases
      spike: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '10s', target: 100 },
          { duration: '1m', target: 100 },
          { duration: '10s', target: 0 },
        ],
      },
      config: getCloudConfig(),
    },

    // Performance thresholds - adjusted based on scenario
    thresholds: {
      http_req_duration: ['p(95)<200'], // 95% of requests under 2s
      http_req_failed: ['rate<0.1'], // Error rate under 10%
      errors: ['rate==0'], // No errors allowed
    },

    // Test tags for filtering and organization
    tags: {
      testid: 'juice-shop-auth',
      environment: __ENV.ENVIRONMENT || 'local',
    },
  },
};

// Helper function to get random scenario based on environment variable
// export function getTestScenario() {
//   const scenario = __ENV.SCENARIO || 'smoke';
//   return config.options.scenarios[scenario] || config.options.scenarios.smoke;
// }

// Grafana Cloud configuration for better test organization
export function getCloudConfig() {
  const testType = __ENV.TEST_TYPE || 'auth-flow';
  const scenario = __ENV.SCENARIO || 'smoke';

  return {
    // Project ID from your Grafana Cloud k6 project (optional)
    projectID: __ENV.K6_CLOUD_PROJECT_ID ? parseInt(__ENV.K6_CLOUD_PROJECT_ID) : undefined,

    // Test name for easy identification in Grafana Cloud
    name: `Juice Shop ${testType} - ${scenario}`,

    // Additional metadata for filtering and organization
    metadata: {
      environment: __ENV.ENVIRONMENT || 'local',
      version: __ENV.VERSION || '1.0.0',
      testType: testType,
      scenario: scenario,
      baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
      timestamp: new Date().toISOString(),
    },
  };
}
