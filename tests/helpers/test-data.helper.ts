import { Page } from '@playwright/test';

/** 
 * Wait for specific API response
 */
export async function waitForAPIResponse(
    page: Page, 
    urlPattern: string | RegExp, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) {
    return page.waitForResponse(
        response => {
            const matchesUrl = typeof urlPattern === 'string' 
                ? response.url().includes(urlPattern)
                : urlPattern.test(response.url());
            return matchesUrl && response.request().method() === method;
        },
        { timeout: 15000 }
    );
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, text?: string) {
    const selector = text 
        ? `[data-sonner-toast]:has-text("${text}")`
        : '[data-sonner-toast]';
    return page.waitForSelector(selector, { timeout: 5000 });
}

/**
 * Check if toast appears with specific text
 */
export async function hasToast(page: Page, text: string): Promise<boolean> {
    try {
        await waitForToast(page, text);
        return true;
    } catch {
        return false;
    }
}

/**
 * Take screenshot with descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
    await page.screenshot({ 
        path: `test-results/screenshots/${name}.png`,
        fullPage: true
    });
}

/**
 * Clear local storage
 */
export async function clearLocalStorage(page: Page) {
    await page.evaluate(() => localStorage.clear());
}

/**
 * Get visible menu items from sidebar
 */
export async function getVisibleMenuItems(page: Page): Promise<string[]> {
    const items = await page.$$eval('nav a, aside a', elements => 
        elements.map(el => el.textContent?.trim() || '')
    );
    return items.filter(Boolean);
}

/**
 * Count table rows
 */
export async function countTableRows(page: Page, tableSelector = 'table tbody'): Promise<number> {
    await page.waitForSelector(tableSelector);
    return page.$$eval(`${tableSelector} tr`, rows => rows.length);
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
    // Wait for any spinners to disappear
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('networkidle');
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
    const element = await page.$(selector);
    return element !== null;
}

/**
 * Format date for input fields
 */
export function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Get backend API URL
 */
export function getApiUrl(): string {
    return process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';
}
