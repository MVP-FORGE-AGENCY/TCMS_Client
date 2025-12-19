import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from '../helpers/auth.helper';
import { waitForLoading, countTableRows } from '../helpers/test-data.helper';

/**
 * Personnel Files E2E Tests
 * Tests core personnel management workflows
 */
test.describe('Personnel Files', () => {
    
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await loginAs(page, 'manager');
    });

    test('View personnel list', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Should see table with employees (seeded data includes 10+ users)
        await expect(page.locator('table')).toBeVisible();
        const rowCount = await countTableRows(page);
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Filter personnel by name', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Use the filter input (placeholder: "Filter names...")
        await page.fill('input[placeholder*="Filter"]', 'Alice');
        await page.waitForTimeout(300); // Debounce
        
        // Should filter to show Alice
        await expect(page.locator('table').getByText('Alice Trainee')).toBeVisible();
    });

    test('Open personnel history modal', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Click Eye icon button (View History) - it's a button with Eye icon in actions column
        // The button has the Eye icon from lucide-react
        const historyButton = page.locator('table tbody tr').first().locator('button').first();
        await historyButton.click();
        
        // Modal should open
        await expect(page.locator('[role="dialog"]')).toBeVisible();
    });

    test('View tabs in history modal', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Click first action button on first row (Eye/History icon)
        await page.locator('table tbody tr').first().locator('button').first().click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();
        
        // Should see the tabs - "Training Sessions", "Proficiency Checks", "Absences"
        await expect(page.getByRole('tab', { name: /Training/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Check/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Absence/i })).toBeVisible();
    });

    test('Add new employee modal opens', async ({ page }) => {
        await page.goto('/personnel');
        await waitForLoading(page);
        
        // Click "Add Employee" button (has Plus icon, contains "Add" text)
        await page.click('button:has-text("Add")');
        
        // Dialog should open with title
        await expect(page.locator('[role="dialog"]')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Add New Employee/i })).toBeVisible();
    });
});
