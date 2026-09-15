import { expect, test } from '@playwright/test';

test('home loads the app chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('My Comparisons')).toBeVisible();
});
