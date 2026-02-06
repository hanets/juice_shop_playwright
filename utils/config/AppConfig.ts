import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Centralized configuration class for environment variables
 */
export class AppConfig {
  // Application settings
  static readonly baseUrl: string = process.env.BASE_URL || 'http://localhost:3000';

  // Database settings
  static readonly database = {
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || '',
  };

  // AI/Analysis settings
  static readonly ai = {
    openApiKey: process.env.OPENAI_API_KEY || '',
    enableVectorStore: process.env.ENABLE_VECTOR_STORE === 'true',
    enableAiResult: process.env.ENABLE_AI_RESULT === 'true',
  };

  // GitHub integration settings
  static readonly github = {
    stepSummary: process.env.GITHUB_STEP_SUMMARY,
  };

  /**
   * Validate required database environment variables
   * @throws Error if required database environment variables are missing
   */
  static validateDatabaseConfig(): void {
    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      const errorMessage =
        `Missing required environment variables: ${missingEnvVars.join(', ')}.\n` +
        'For local development, copy .env.example to .env and fill in your database credentials.\n' +
        'For GitHub Actions, ensure these secrets are configured in your repository settings.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate required AI configuration
   * @throws Error if required AI environment variables are missing
   */
  static validateAiConfig(): void {
    if (this.ai.enableVectorStore && !this.ai.openApiKey) {
      throw new Error('OPENAI_API_KEY is required when ENABLE_VECTOR_STORE is true');
    }
  }
}
