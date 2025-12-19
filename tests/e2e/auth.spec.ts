import { test, expect } from '@playwright/test';
import { loginAs, loginWithCredentials, isLoggedIn, clearAuth } from '../helpers/auth.helper';
import { countTableRows, waitForToast } from '../helpers/test-data.helper';

test.describe('Authentication', () => {
    
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
    });

    test('Admin login success', async ({ page }) => {
        const user = await loginAs(page, 'admin');
        
        // Verify redirected to dashboard
        await expect(page).toHaveURL(/\/(dashboard)?$/);
        
        // Verify logged in
        expect(await isLoggedIn(page)).toBeTruthy();
    });

    test('Invalid password rejected', async ({ page }) => {
        await loginWithCredentials(page, 'admin@testaero.com', 'WrongPassword123!');
        
        // Should stay on login page
        await expect(page).toHaveURL('/login');
        
        // Should show error toast
        await waitForToast(page);
    });

    test('Multi-tenant RLS isolation', async ({ page }) => {
        // Login as admin (Test Aerodrome Ltd)
        await loginAs(page, 'admin');
        await page.goto('/personnel');
        await page.waitForLoadState('networkidle');
        
        const testAeroRows = await countTableRows(page);
        
        // Clear and login as external user (External Handler Co)
        await clearAuth(page);
        await loginAs(page, 'external');
        await page.goto('/personnel');
        await page.waitForLoadState('networkidle');
        
        const externalRows = await countTableRows(page);
        
        // External org should see fewer users (just themselves ideally)
        expect(externalRows).toBeLessThan(testAeroRows);
    });

    test('Different role logins work', async ({ page }) => {
        // Test multiple role logins work
        const roles = ['admin', 'manager', 'instructor1', 'employee1'] as const;
        
        for (const role of roles) {
            await clearAuth(page);
            await loginAs(page, role);
            await expect(page).toHaveURL(/\/(dashboard)?$/);
            expect(await isLoggedIn(page)).toBeTruthy();
        }
    });
});
