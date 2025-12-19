import { test, expect } from '@playwright/test';

test.describe('Setup', () => {
    test.beforeAll(async () => {
        console.log('🔧 Running E2E test setup...');
    });

    test('Backend is running', async ({ request }) => {
        const apiUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';
        
        // Try health or root endpoint
        const response = await request.get(apiUrl, { timeout: 5000 }).catch(() => null);
        
        // Accept any response as proof server is running
        expect(response).toBeTruthy();
        console.log('✓ Backend is running');
    });

    test('Frontend is running', async ({ page }) => {
        const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
        expect(response?.ok() || response?.status() === 200).toBeTruthy();
        console.log('✓ Frontend is running');
    });

    test('Wait for data propagation', async () => {
        // Short wait for any async operations
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✓ Ready for testing');
    });
});
