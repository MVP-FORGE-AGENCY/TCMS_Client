import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from '../helpers/auth.helper';
import { waitForLoading } from '../helpers/test-data.helper';

/**
 * Competence Dashboard E2E Tests
 */
test.describe('Competence Dashboard', () => {
    
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await loginAs(page, 'admin');
    });

    test('Dashboard page loads', async ({ page }) => {
        await page.goto('/dashboard');
        await waitForLoading(page);
        
        // Should see dashboard content (title or cards)
        await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('KPI cards visible', async ({ page }) => {
        await page.goto('/dashboard');
        await waitForLoading(page);
        
        // Should see stat cards or KPI elements  
        const hasCards = await page.$('[class*="card"]');
        expect(hasCards).toBeTruthy();
    });

    test('Navigate to personnel from dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await waitForLoading(page);
        
        // Click Personnel in sidebar  
        await page.click('a[href="/personnel"]');
        
        // Should navigate to personnel page
        await expect(page).toHaveURL(/\/personnel/);
    });

    test('Navigate to sessions from menu', async ({ page }) => {
        await page.goto('/dashboard');
        await waitForLoading(page);
        
        // Click Sessions link
        await page.click('a[href="/sessions"]');
        
        // Should navigate
        await expect(page).toHaveURL(/\/sessions/);
    });

    test('Navigate to checks from menu', async ({ page }) => {
        await page.goto('/dashboard');
        await waitForLoading(page);
        
        // Click Checks link
        await page.click('a[href="/checks"]');
        
        // Should navigate
        await expect(page).toHaveURL(/\/checks/);
    });
});
