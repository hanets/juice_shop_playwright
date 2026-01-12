# Juice Shop Playwright Test Project - AI Coding Instructions

## Architecture Overview

This is a comprehensive Playwright test framework for the OWASP Juice Shop e-commerce application, following a three-layer architecture:

- **Page Objects** (`page-objects/`): UI element locators and low-level interactions scoped to specific pages
- **Business Objects** (`business-objects/`): High-level workflow orchestration combining multiple pages and API calls
- **Test Specs** (`tests/`): Test scenarios using business objects for complex user journeys

## Key Patterns & Conventions

### Page Object Scoping
Page objects use strict locator scoping with parent containers to avoid element conflicts:
```typescript
// BasketPage.ts - Scoped to specific mat-card
this.root = page.locator('mat-card', {
  has: page.getByRole('heading', { name: /your basket/i }),
});
```

### Business Object Integration
Business objects combine UI automation with API validation. Example pattern from `CheckoutBO`:
```typescript
// Hybrid approach: API setup + UI validation
await addProductsToBasketAndVerify(page, request, testData, products);
await checkoutBO.quickCheckout(testData.email, products);
```

### Test Fixture Authentication
All tests use the `auth` fixture which:
1. Creates unique users via API (`registerUser`)
2. Authenticates and injects tokens into browser storage
3. Provides pre-authenticated `TestData` with `HomePage` instance

Usage: `import { test } from '../fixtures/auth'` instead of base Playwright test.

## Essential Workflows

### Running Tests
```bash
# Standard Playwright tests (multiple browsers)
npm run test

# E2E tests (headless=false, single browser)
npm run test:e2e

# Interactive debugging - runs e2e config with single chromium browser
npm run test:e2e --project=chrome

# With Allure reporting
npx allure serve allure-results

# Code quality checks
npm run lint
npm run format
```

### Test Configuration
- `playwright.config.ts`: Multi-browser setup (Chrome/Firefox/Safari) with video on failure, 30s timeout
- `e2e.config.ts`: Interactive debugging setup (headless=false, 60s timeout, screenshot on failure)
- Tests are organized in `tests/e2e/` with API tests in `tests/api/`
- Fixture-based authentication in `tests/fixtures/auth.ts`

### Product Data Management
Use `ProductsApiBO` for dynamic product selection with filters:
```typescript
// Get products with sufficient inventory
const products = await getFilteredProducts(request, {
  quantityFilter: (q) => q.quantity >= 5,
}).slice(0, 1);
```

### Environment Configuration
- Base URL via `BASE_URL` environment variable (defaults to localhost:3000)
- Credentials and settings loaded via `dotenv` in test fixtures  
- API endpoints configured in `utils/api/config.ts`
- Multiple environment files: `.env`, `.env.remote` for different setups

### API Service Layer
API utilities follow a consistent pattern:
- `AuthService.ts`: Token management with WeakMap storage per worker
- `ProductService.ts`: Product search and quantity operations
- `UserService.ts`: User registration and management
- All services use centralized BASE_URL from config

## Critical Integration Points

### API + UI Testing Strategy
Tests follow hybrid approach:
1. **Setup**: Use API calls for user creation, product data fetching
2. **Action**: UI automation for user workflows  
3. **Verification**: Both UI assertions and API validation

### Authentication Flow
Never manually login through UI. Instead:
1. Use `auth` fixture for pre-authenticated sessions
2. Tokens automatically injected into browser storage
3. Tests start with user already logged in

### Test Data Isolation
Each test gets a unique user (`user_${Date.now()}@example.com`) to avoid data conflicts.

## Common Anti-Patterns to Avoid

- Don't create multiple page object instances for the same page in one test
- Don't bypass the auth fixture for login scenarios 
- Don't hardcode product names - use dynamic product selection via API
- Don't ignore the scoped locator pattern - always use parent containers when possible
- Don't mix regular Playwright `test` with the custom auth fixture `test`

## Key File Locations

### Core Architecture
- `tests/fixtures/auth.ts`: Custom test fixture with pre-authentication
- `page-objects/`: UI locators with strict scoping using parent containers
- `business-objects/`: High-level workflows combining UI + API operations
- `utils/api/`: Service layer for all API interactions
- `utils/models/`: TypeScript interfaces for API responses

### Configuration Files  
- `playwright.config.ts`: Multi-browser headless testing
- `e2e.config.ts`: Interactive debugging configuration
- `package.json`: Scripts for test execution, linting, and formatting