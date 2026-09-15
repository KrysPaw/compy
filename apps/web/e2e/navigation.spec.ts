import { expect, test } from '@playwright/test';
import { createComparison, resetComparisons } from './helpers/api';

test.describe('A. Home & shell — navigation smoke', () => {
  test.beforeEach(async () => {
    await resetComparisons();
  });

  test('A4: sidebar collapse and mobile shell keep comparisons reachable', async ({
    page,
    context,
  }) => {
    const comparison = await createComparison('Shell smoke');
    const entriesPath = `/comparisons/${comparison.id}/entries`;

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
    // Centered tabs overlap the trigger on narrow widths; Ctrl+B is the shell shortcut.
    await mobile.keyboard.press('Control+b');
    await expect(
      mobile.getByRole('dialog').getByRole('link', { name: 'Shell smoke' }),
    ).toBeVisible();
    await mobile
      .getByRole('dialog')
      .getByRole('link', { name: 'Shell smoke' })
      .click();
    await expect(mobile).toHaveURL(new RegExp(`${entriesPath}$`));
    await mobile.close();
  });
});
