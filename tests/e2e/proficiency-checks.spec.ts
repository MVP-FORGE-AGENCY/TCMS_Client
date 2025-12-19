import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from '../helpers/auth.helper';
import { waitForLoading } from '../helpers/test-data.helper';

/**
 * Proficiency Checks E2E Tests
 */
test.describe('Proficiency Checks', () => {
    
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await loginAs(page, 'manager');
    });

    test('View checks page', async ({ page }) => {
        await page.goto('/checks');
        await waitForLoading(page);
        
        // Should see page title
        await expect(page.locator('h1')).toContainText(/Check|Проверки/i);
    });

    test('Checks page has tabs', async ({ page }) => {
        await page.goto('/checks');
        await waitForLoading(page);
        
        // Should see tab list
        await expect(page.getByRole('tablist')).toBeVisible();
    });

    test('Schedule button visible', async ({ page }) => {
        await page.goto('/checks');
        await waitForLoading(page);
        
        // Should see Schedule/Create button
        const scheduleButton = page.locator('button:has-text("Schedule"), button:has-text("Create"), button:has-text("Планирай"), button:has-text("Създай")');
        await expect(scheduleButton.first()).toBeVisible();
    });

    test('Navigate to checks from dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await waitForLoading(page);
        
        // Click checks link
        await page.click('a[href="/checks"]');
        
        // Should be on checks page
        await expect(page).toHaveURL(/\/checks/);
    });
});
