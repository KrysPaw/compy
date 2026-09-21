import { expect, test } from '@playwright/test';
import {
  applyGuestSession,
  createComparison,
  resetComparisons,
} from './helpers/api';

test.describe('A. Home & shell — navigation smoke', () => {
  test.beforeEach(async () => {
    await resetComparisons();
  });

  test('A4: sidebar collapse and mobile shell keep comparisons reachable', async ({
    page,
    context,
  }) => {
    const comparison = await createComparison('Shell smoke');
    const entriesPath = `/comparisons/${comparison.publicId}/entries`;

    await applyGuestSession(context);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(entriesPath);

    const desktopSidebar = page.locator(
      '[data-slot="sidebar"]:not([data-mobile="true"])',
    );
    const sidebarTrigger = page.locator('[data-slot="sidebar-trigger"]');

    await expect(page.getByText('My Comparisons')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Shell smoke' }),
    ).toBeVisible();
    await expect(desktopSidebar).toHaveAttribute('data-state', 'expanded');

    await sidebarTrigger.click();
    await expect(desktopSidebar).toHaveAttribute('data-state', 'collapsed');
    await expect(page.getByRole('tab', { name: 'Entries' })).toBeVisible();

    await sidebarTrigger.click();
    await expect(desktopSidebar).toHaveAttribute('data-state', 'expanded');
    await expect(
      page.getByRole('link', { name: 'Shell smoke' }),
    ).toBeVisible();

    // Fresh mobile page avoids desktop→mobile hydration mismatch after resize.
    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.goto(entriesPath);

    await expect(mobile.getByRole('tab', { name: 'Entries' })).toBeVisible();
    await expect(mobile.getByTestId('entries-card-list')).toBeVisible();
    await expect(mobile.getByTestId('entries-data-table')).toHaveCount(0);
    await expect(
      mobile.getByRole('group', { name: 'View mode' }),
    ).toHaveCount(0);

    const mobileTrigger = mobile.locator('[data-slot="sidebar-trigger"]');
    await mobileTrigger.click();
    await expect(
      mobile.getByRole('dialog').getByRole('link', { name: 'Shell smoke' }),
    ).toBeVisible();
    await mobile
      .getByRole('dialog')
      .getByRole('link', { name: 'Shell smoke' })
      .click();
    await expect(mobile).toHaveURL(new RegExp(`${entriesPath}$`));
    await mobile.close();

    await expect(page.getByTestId('entries-data-table')).toBeVisible();
    const viewMode = page.getByRole('group', { name: 'View mode' });
    await expect(viewMode).toBeVisible();
    await viewMode.getByRole('radio', { name: 'Cards' }).click();
    await expect(page.getByTestId('entries-card-list')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('entries-card-list')).toBeVisible();
  });
});
