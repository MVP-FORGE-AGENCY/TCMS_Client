import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from '../helpers/auth.helper';
import { waitForLoading } from '../helpers/test-data.helper';

/**
 * Training Sessions E2E Tests
 * Tests session scheduling, results recording, and participant management
 */
test.describe('Training Sessions', () => {
    
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await loginAs(page, 'manager');
    });

    test('View sessions list', async ({ page }) => {
        await page.goto('/sessions');
        await waitForLoading(page);
        
        // Should see the page title and table
        await expect(page.locator('h1')).toContainText(/Sessions|Сесии/);
        await expect(page.locator('table')).toBeVisible();
    });

    test('Filter sessions by status', async ({ page }) => {
        await page.goto('/sessions');
        await waitForLoading(page);
        
        // Click status filter dropdown
        await page.click('button:has-text("All Statuses")');
        
        // Select "Completed"
        await page.click('[role="option"]:has-text("Completed")');
        
        // Table should update (status filter applied)
        await page.waitForTimeout(300);
    });

    test('Open schedule session dialog', async ({ page }) => {
        await page.goto('/sessions');
        await waitForLoading(page);
        
        // Click Schedule Session button (has Plus icon)
        await page.click('button:has-text("Schedule"), button:has-text("Планирай")');
        
        // Dialog should open with form
        await expect(page.locator('[role="dialog"]')).toBeVisible();
    });

    test('View participants via dropdown menu', async ({ page }) => {
        await page.goto('/sessions');
        await waitForLoading(page);
        
        // Click actions dropdown (MoreHorizontal icon button)
        await page.click('button:has(.sr-only:has-text("Open menu"))');
        
        // Should see View Participants option
        await expect(page.getByRole('menuitem', { name: /Participants|Участници/ })).toBeVisible();
    });

    test('Record Results option visible in dropdown', async ({ page }) => {
        await page.goto('/sessions');
        await waitForLoading(page);
        
        // Open actions menu on first row
        await page.click('button:has(.sr-only:has-text("Open menu"))');
        
        // Should see Record Results option
        await expect(page.getByRole('menuitem', { name: /Record Results|Запиши резултати/ })).toBeVisible();
    });
});
