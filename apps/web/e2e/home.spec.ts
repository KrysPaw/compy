import { expect, test } from '@playwright/test';
import { createComparison, resetComparisons } from './helpers/api';

test.describe('A. Home & shell', () => {
  test.beforeEach(async () => {
    await resetComparisons();
  });

  test('A1: empty DB home shows empty state and Create CTA', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByText('My Comparisons')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No comparisons yet' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Create a comparison to add criteria, entries, and start ranking.',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create comparison' }),
    ).toBeVisible();
  });

  test('A2: home with existing comparisons redirects to first comparison entries', async ({
    page,
  }) => {
    const comparison = await createComparison('Laptops 2026');

    await page.goto('/');

    await expect(page).toHaveURL(
      new RegExp(`/comparisons/${comparison.id}/entries$`),
    );
    await expect(page.getByText('Laptops 2026').first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Entries' })).toBeVisible();
  });

  test('A3: invalid comparison id shows not-found page', async ({ page }) => {
    await page.goto('/comparisons/999999');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('This page could not be found.')).toBeVisible();
  });
});
