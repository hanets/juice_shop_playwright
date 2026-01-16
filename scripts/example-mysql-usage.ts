/* eslint-disable no-console */
import { databaseConfig } from '../utils/database/config';
import { MySQLClient } from '../utils/database/mysql-client';

async function exampleUsage(): Promise<void> {
  const client = new MySQLClient(databaseConfig);

  try {
    // Connect to the database
    await client.connect();

    // Insert some example test results
    await client.insertTestResult({
      test_name: 'login-test',
      status: 'passed',
    });

    await client.insertTestResult({
      test_name: 'checkout-test',
      status: 'failed',
    });

    await client.insertTestResult({
      test_name: 'product-search-test',
      status: 'passed',
    });

    // Get all test results
    console.log('\nAll test results:');
    const allResults = await client.getTestResults();
    console.table(allResults);

    // Get only failed test results
    console.log('\nFailed test results:');
    const failedResults = await client.getTestResultsByStatus('failed');
    console.table(failedResults);

    // Get only passed test results
    console.log('\nPassed test results:');
    const passedResults = await client.getTestResultsByStatus('passed');
    console.table(passedResults);

    // Get limited results (last 3)
    console.log('\nLast 3 test results:');
    const limitedResults = await client.getTestResults(3);
    console.table(limitedResults);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  void exampleUsage();
}
