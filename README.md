# Juice Shop Playwright E2E & Load Testing

This repository contains a comprehensive automated testing suite for the [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/), built with Playwright and k6. It also includes an AI-powered test failure analyzer and a Model Context Protocol (MCP) server for enhanced automation capabilities.

## 🚀 Tech Stack

- **E2E Testing:** [Playwright](https://playwright.dev/)
- **Load Testing:** [k6](https://k6.io/)
- **Language:** TypeScript
- **Reporting:** Allure Reports
- **Database:** MySQL (for test data management)
- **AI Integration:** OpenAI GPT-4o-mini (for test failure analysis)
- **Automation:** Model Context Protocol (MCP)

## 📁 Project Structure

- `tests/`: Playwright test files.
- `specs/`: Higher-level test specifications.
- `page-objects/`: Page Object Model (POM) implementations.
- `business-objects/`: Business logic abstractions for tests.
- `load-tests/`: k6 load testing scripts.
- `scripts/`: Utilities for database setup and other tasks.
- `utils/`: Common helper functions and fixtures.
- `.github/workflows/`: CI/CD configurations.

## 🛠 Setup

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Fill in the required values:
   - `BASE_URL`: URL of the target Juice Shop instance (default: `http://localhost:3000`).
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`: MySQL configuration.
   - `OPENAI_API_KEY`: API key for AI analysis.

3. **Database Setup:**
   ```bash
   npm run db:setup
   ```

## 📜 Available Scripts

- `npm test`: Run all Playwright tests.
- `npm run test:e2e`: Run E2E tests on Chrome using a specific config.
- `npm run lint`: Run ESLint to check for code quality issues.
- `npm run format`: Check file formatting with Prettier.
- `npm run load-test`: Run the main load test scenario.
- `npm run mcp:run`: Start the MCP server for tool-based automation.

## 🧪 CI/CD Features

The project uses GitHub Actions (`playwright.yml`) to:

- Run linting and formatting checks.
- Start Juice Shop in a Docker container.
- Execute Playwright tests.
- **AI Analysis:** Automatically analyze test failures using OpenAI and generate a detailed report.
- **Reporting:** Generate and deploy Allure reports to GitHub Pages.

## 🤖 AI Test Failure Analyzer

When a test fails in the CI pipeline, a custom script analyzes the failure logs and context using OpenAI. It generates a `ai-analysis-report.md` that provides:

- A summary of the failure.
- Root cause analysis.
- Suggested fixes.

## 🔗 MCP Server

The `mcp-server.ts` provides an interface for AI agents to interact with the testing environment, allowing for more dynamic and intelligent test execution and management.
