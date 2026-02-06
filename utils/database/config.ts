import { AppConfig } from '../config/AppConfig';
import { DatabaseConfig } from './mysql-client';

export const databaseConfig: DatabaseConfig = AppConfig.database;

// Validate required environment variables
AppConfig.validateDatabaseConfig();
