# E2E Testing Setup with Playwright

End-to-end testing setup guide for Try Local Gresham using Playwright.

## Installation

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browsers
npx playwright install
```

## Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Example Tests

### 1. Homepage Test (`e2e/homepage.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load and display hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Try Local/)
    await expect(page.locator('h1')).toContainText('Shop Local')
  })

  test('should navigate to businesses page', async ({ page }) => {
    await page.goto('/')

    await page.click('text=Browse Businesses')
    await expect(page).toHaveURL(/\/businesses/)
  })
})
```

### 2. Authentication Test (`e2e/auth.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should allow user signup', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!')
    await page.click('button[type="submit"]')

    // Wait for success or dashboard redirect
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('should allow user login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'existing@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign In")')

    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })
})
```

### 3. Business Flow Test (`e2e/business-flow.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Business Application Flow', () => {
  test('should complete business application', async ({ page }) => {
    await page.goto('/apply')

    // Fill business details
    await page.fill('input[name="businessName"]', 'Test Coffee Shop')
    await page.fill('textarea[name="description"]', 'A great local coffee shop')
    await page.selectOption('select[name="category"]', 'Food & Beverage')
    await page.fill('input[name="address"]', '123 Main St, Gresham, OR')
    await page.fill('input[name="phone"]', '503-555-0123')
    await page.fill('input[name="email"]', 'owner@testcoffee.com')

    await page.click('button:has-text("Submit Application")')

    await expect(page.locator('text=Application Submitted')).toBeVisible()
  })
})
```

### 4. Order Flow Test (`e2e/order-flow.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login')
    await page.fill('input[type="email"]', 'customer@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should complete order from start to finish', async ({ page }) => {
    // Browse businesses
    await page.goto('/businesses')
    await page.click('text=Coffee Shop')

    // Add item to cart
    await page.click('button:has-text("Add to Cart")')
    await expect(page.locator('text=Item added')).toBeVisible()

    // Go to cart
    await page.click('[aria-label="Cart"]')
    await expect(page.locator('text=Your Cart')).toBeVisible()

    // Checkout
    await page.click('button:has-text("Checkout")')
    await page.selectOption('select[name="deliveryMethod"]', 'pickup')
    await page.click('button:has-text("Place Order")')

    // Verify success
    await expect(page.locator('text=Order Confirmed')).toBeVisible()
  })
})
```

### 5. Admin Flow Test (`e2e/admin-flow.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'adminpass')
    await page.click('button:has-text("Sign In")')
  })

  test('should approve business application', async ({ page }) => {
    await page.goto('/dashboard/admin/applications')

    await page.click('button:has-text("Approve")').first()
    await page.click('button:has-text("Confirm")')

    await expect(page.locator('text=Business Approved')).toBeVisible()
  })
})
```

## Running Tests

### Local Development

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### CI/CD Integration

Add to `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Best Practices

### 1. Use Page Object Model

```typescript
// e2e/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button:has-text("Sign In")')
  }

  async expectDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/)
  }
}

// Usage
const loginPage = new LoginPage(page)
await loginPage.goto()
await loginPage.login('test@example.com', 'password123')
await loginPage.expectDashboard()
```

### 2. Use Fixtures for Test Data

```typescript
// e2e/fixtures/users.ts
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'adminpass',
  },
  customer: {
    email: 'customer@example.com',
    password: 'customerpass',
  },
  business: {
    email: 'business@example.com',
    password: 'businesspass',
  },
}
```

### 3. Use Custom Fixtures

```typescript
// e2e/fixtures/auth.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'customer@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL(/\/dashboard/)
    await use(page)
  },
})

// Usage
test('should view orders', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/orders')
  // Already logged in!
})
```

## Visual Regression Testing

```bash
# Generate screenshots
npx playwright test --update-snapshots

# Compare screenshots
npx playwright test
```

Example:
```typescript
test('homepage should match snapshot', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage.png')
})
```

## Accessibility Testing

```bash
npm install --save-dev @axe-core/playwright
```

```typescript
import { injectAxe, checkA11y } from '@axe-core/playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/')
  await injectAxe(page)
  await checkA11y(page)
})
```

## Performance Testing

```typescript
test('homepage should load quickly', async ({ page }) => {
  const start = Date.now()
  await page.goto('/')
  const loadTime = Date.now() - start

  expect(loadTime).toBeLessThan(3000) // 3 seconds
})
```

## Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## Summary

- ✅ Install Playwright and browsers
- ✅ Configure `playwright.config.ts`
- ✅ Write tests for critical user journeys
- ✅ Use Page Object Model
- ✅ Add to CI/CD pipeline
- ✅ Run tests before deployment
- ✅ Monitor test failures

E2E tests ensure your application works end-to-end in real browsers!
