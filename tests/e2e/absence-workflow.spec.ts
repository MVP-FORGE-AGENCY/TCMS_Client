import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from '../helpers/auth.helper';
import { waitForLoading } from '../helpers/test-data.helper';

/**
 * Absence Workflow E2E Tests
 * Tests absence/refresher flag visibility via personnel history modal
 */
test.describe('Absence Workflow', () => {
    
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await loginAs(page, 'manager');
    });

    test('View personnel with absences', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Filter for Charlie who has the 4-month absence
        await page.fill('input[placeholder*="Filter"]', 'Charlie');
        await page.waitForTimeout(300);
        
        // Charlie should be visible in table
        await expect(page.locator('table').getByText('Charlie Trainee')).toBeVisible();
    });

    test('Open history modal for employee with absence', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Filter for Charlie
        await page.fill('input[placeholder*="Filter"]', 'Charlie');
        await page.waitForTimeout(300);
        
        // Click history button (first button in row)
        await page.locator('table tbody tr').first().locator('button').first().click();
        
        // Modal should open
        await expect(page.locator('[role="dialog"]')).toBeVisible();
        
        // Should have tabs including Absences
        await expect(page.getByRole('tab', { name: /Absence/i })).toBeVisible();
    });
});
