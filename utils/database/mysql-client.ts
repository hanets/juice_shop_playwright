/* eslint-disable no-console */
import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface TestResult {
  test_name: string;
  status: string;
  timestamp?: Date;
}

export class MySQLClient {
  private connection: mysql.Connection | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        ssl: {
          rejectUnauthorized: false,
        },
      });
      console.log('Connected to MySQL database');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('Disconnected from MySQL database');
    }
  }

  async createTestResultTable(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to database');
    }

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS test_result (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_test_name (test_name),
        INDEX idx_status (status),
        INDEX idx_timestamp (timestamp)
      )
    `;

    try {
      await this.connection.execute(createTableQuery);
      console.log('test_result table created successfully');
    } catch (error) {
      console.error('Error creating test_result table:', error);
      throw error;
    }
  }

  async insertTestResult(testResult: TestResult): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to database');
    }

    const insertQuery = `
      INSERT INTO test_result (test_name, status, timestamp)
      VALUES (?, ?, ?)
    `;

    const timestamp = testResult.timestamp || new Date();

    try {
      await this.connection.execute(insertQuery, [
        testResult.test_name,
        testResult.status,
        timestamp,
      ]);
      console.log(`Test result inserted: ${testResult.test_name} - ${testResult.status}`);
    } catch (error) {
      console.error('Error inserting test result:', error);
      throw error;
    }
  }

  async getTestResults(limit?: number): Promise<TestResult[]> {
    if (!this.connection) {
      throw new Error('Not connected to database');
    }

    let query = 'SELECT test_name, status, timestamp FROM test_result ORDER BY timestamp DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    try {
      const [rows] = await this.connection.execute(query);
      return rows as TestResult[];
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  }

  async getTestResultsByStatus(status: string): Promise<TestResult[]> {
    if (!this.connection) {
      throw new Error('Not connected to database');
    }

    const query =
      'SELECT test_name, status, timestamp FROM test_result WHERE status = ? ORDER BY timestamp DESC';

    try {
      const [rows] = await this.connection.execute(query, [status]);
      return rows as TestResult[];
    } catch (error) {
      console.error('Error fetching test results by status:', error);
      throw error;
    }
  }
}
