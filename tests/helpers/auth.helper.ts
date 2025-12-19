import { Page, expect } from '@playwright/test';

/**
 * Test user credentials
 */
export const TEST_USERS = {
    admin: { email: 'admin@testaero.com', password: 'Test1234!', name: 'Admin User' },
    manager: { email: 'manager@testaero.com', password: 'Test1234!', name: 'Training Manager' },
    instructor1: { email: 'instructor1@testaero.com', password: 'Test1234!', name: 'John Instructor' },
    instructor2: { email: 'instructor2@testaero.com', password: 'Test1234!', name: 'Jane Instructor' },
    assessor1: { email: 'assessor1@testaero.com', password: 'Test1234!', name: 'Mark Assessor' },
    assessor2: { email: 'assessor2@testaero.com', password: 'Test1234!', name: 'Sarah Assessor' },
    employee1: { email: 'employee1@testaero.com', password: 'Test1234!', name: 'Alice Trainee' },
    employee2: { email: 'employee2@testaero.com', password: 'Test1234!', name: 'Bob Trainee' },
    employee3: { email: 'employee3@testaero.com', password: 'Test1234!', name: 'Charlie Trainee' },
    auditor: { email: 'auditor@testaero.com', password: 'Test1234!', name: 'Audit Inspector' },
    external: { email: 'external@handler.co', password: 'Test1234!', name: 'External Worker' },
};

export type UserRole = keyof typeof TEST_USERS;

/**
 * Get test user credentials by role
 */
export function getTestUser(role: UserRole) {
    return TEST_USERS[role];
}

/**
 * Login as a specific user
 */
export async function loginAs(page: Page, role: UserRole) {
    const user = getTestUser(role);
    
    // Navigate to login
    await page.goto('/login');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]');
    
    // Fill credentials
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard (app redirects to /dashboard after login)
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    return user;
}

/**
 * Login with specific email/password (for testing invalid credentials)
 */
export async function loginWithCredentials(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
}

/**
 * Logout the current user
 */
export async function logout(page: Page) {
    // Click profile dropdown
    await page.click('[data-testid="user-menu"], .avatar, button:has(.avatar)');
    
    // Click logout option
    await page.click('text=Logout, text=Изход');
    
    // Wait for redirect to login
    await page.waitForURL('/login');
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    const token = await page.evaluate(() => localStorage.getItem('token'));
    return !!token;
}

/**
 * Clear authentication
 */
export async function clearAuth(page: Page) {
    // Navigate to the app first to have access to localStorage
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.evaluate(() => {
        localStorage.removeItem('token');
    });
}
