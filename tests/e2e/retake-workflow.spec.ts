import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from '../helpers/auth.helper';
import { waitForLoading } from '../helpers/test-data.helper';

/**
 * Retake Workflow E2E Tests
 * Tests failed attempts visibility via personnel history modal
 */
test.describe('Retake Workflow', () => {
    
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await loginAs(page, 'manager');
    });

    test('View employee with failed attempt', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Filter for Bob who has the failed attempt
        await page.fill('input[placeholder*="Filter"]', 'Bob');
        await page.waitForTimeout(300);
        
        // Bob should be visible
        await expect(page.locator('table').getByText('Bob Trainee')).toBeVisible();
    });

    test('Open history modal for failed trainee', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Filter for Bob
        await page.fill('input[placeholder*="Filter"]', 'Bob');
        await page.waitForTimeout(300);
        
        // Open history modal
        await page.locator('table tbody tr').first().locator('button').first().click();
        
        // Modal should open
        await expect(page.locator('[role="dialog"]')).toBeVisible();
        
        // Training tab should be visible
        await expect(page.getByRole('tab', { name: /Training/i })).toBeVisible();
    });

    test('View employee with passed check', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Filter for Alice who has completed check
        await page.fill('input[placeholder*="Filter"]', 'Alice');
        await page.waitForTimeout(300);
        
        // Alice should be visible
        await expect(page.locator('table').getByText('Alice Trainee')).toBeVisible();
    });
});
