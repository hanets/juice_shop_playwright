/* eslint-disable no-console */
import { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { databaseConfig } from '../database/config';
import { MySQLClient } from '../database/mysql-client';

class DatabaseReporter implements Reporter {
  private client: MySQLClient;

  constructor() {
    this.client = new MySQLClient(databaseConfig);
  }

  async onBegin(): Promise<void> {
    try {
      await this.client.connect();
      await this.client.createTestResultTable();
      console.log('Database reporter initialized');
    } catch (error) {
      console.error('Failed to initialize database reporter:', error);
    }
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    try {
      const testName = test.title;
      const status = result.status;

      await this.client.insertTestResult({
        test_name: testName,
        status: status,
        timestamp: new Date(result.startTime),
      });
    } catch (error) {
      console.error('Failed to save test result to database:', error);
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    try {
      await this.client.disconnect();
      console.log('Database reporter finished');
    } catch (error) {
      console.error('Failed to disconnect database reporter:', error);
    }
  }
}

export default DatabaseReporter;
