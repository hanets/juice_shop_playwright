/* eslint-disable no-console */
import { databaseConfig } from '../utils/database/config';
import { MySQLClient } from '../utils/database/mysql-client';

async function setupDatabase(): Promise<void> {
  const client = new MySQLClient(databaseConfig);

  try {
    console.log('Setting up database...');

    // Connect to the database
    await client.connect();

    // Create the test_result table
    await client.createTestResultTable();

    console.log('Database setup completed successfully!');

    // Test the connection by inserting a sample record
    await client.insertTestResult({
      test_name: 'setup-test',
      status: 'success',
      timestamp: new Date(),
    });

    // Fetch and display the test results
    const results = await client.getTestResults(5);
    console.log('Recent test results:');
    console.table(results);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  void setupDatabase();
}
