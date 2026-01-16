import * as dotenv from 'dotenv';
import { DatabaseConfig } from './mysql-client';

// Load environment variables
dotenv.config();

export const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || '',
};

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  const errorMessage =
    `Missing required environment variables: ${missingEnvVars.join(', ')}.\n` +
    'For local development, copy .env.example to .env and fill in your database credentials.\n' +
    'For GitHub Actions, ensure these secrets are configured in your repository settings.';
  throw new Error(errorMessage);
}
