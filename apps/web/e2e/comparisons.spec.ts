import { expect, test } from '@playwright/test';
import { createComparison, resetComparisons } from './helpers/api';

test.describe('B. Comparisons CRUD', () => {
  test.beforeEach(async () => {
    await resetComparisons();
  });

  test('B1: create from empty home CTA lands on Entries with name column', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Create comparison' }).click();
    await expect(
      page.getByRole('dialog', { name: 'New comparison' }),
    ).toBeVisible();

    await page.getByLabel('Name').fill('Phones 2026');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/comparisons\/[^/]+\/entries$/);
    await expect(page.getByText('Phones 2026').first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Entries' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^name$/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Phones 2026' }),
    ).toBeVisible();
  });

  test('B2: create from sidebar + when comparisons already exist', async ({
    page,
  }) => {
    await createComparison('Existing phones');
    await page.goto('/');

    await page.getByRole('button', { name: 'New comparison' }).click();
    await expect(
      page.getByRole('dialog', { name: 'New comparison' }),
    ).toBeVisible();

    await page.getByLabel('Name').fill('Laptops 2026');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/comparisons\/[^/]+\/entries$/);
    await expect(page.getByText('Laptops 2026').first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Entries' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^name$/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Laptops 2026' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Existing phones' }),
    ).toBeVisible();
  });

  test('B3: reject blank and whitespace name; dialog stays open', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create comparison' }).click();

    const dialog = page.getByRole('dialog', { name: 'New comparison' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL('/');

    await page.getByLabel('Name').fill('   ');
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(
      dialog.getByText(
        'Too small: expected string to have >=1 characters',
      ),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('B4: rename comparison updates header and sidebar', async ({
    page,
  }) => {
    const comparison = await createComparison('Old name');
    await page.goto(`/comparisons/${comparison.publicId}/entries`);

    await page.getByRole('button', { name: 'Comparison actions' }).click();
    await page.getByRole('menuitem', { name: 'Rename' }).click();

    const dialog = page.getByRole('dialog', { name: 'Rename comparison' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Name').fill('New name');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('New name').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'New name' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Old name' }),
    ).toHaveCount(0);
  });

  test('B5: delete confirm stays disabled until exact name is typed', async ({
    page,
  }) => {
    const comparison = await createComparison('Keep me');
    await page.goto(`/comparisons/${comparison.publicId}/entries`);

    await page.getByRole('button', { name: 'Comparison actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = page.getByRole('dialog', { name: 'Delete comparison?' });
    await expect(dialog).toBeVisible();

    const deleteButton = dialog.getByRole('button', { name: 'Delete' });
    await expect(deleteButton).toBeDisabled();

    await dialog.getByLabel('Comparison name').fill('keep me');
    await expect(deleteButton).toBeDisabled();

    await dialog.getByLabel('Comparison name').fill('Keep me ');
    await expect(deleteButton).toBeDisabled();

    await dialog.getByLabel('Comparison name').fill('Keep me');
    await expect(deleteButton).toBeEnabled();
  });

  test('B6: delete with exact name removes comparison and returns home', async ({
    page,
  }) => {
    const comparison = await createComparison('Doomed phones');
    await page.goto(`/comparisons/${comparison.publicId}/entries`);

    await page.getByRole('button', { name: 'Comparison actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = page.getByRole('dialog', { name: 'Delete comparison?' });
    await dialog.getByLabel('Comparison name').fill('Doomed phones');
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'No comparisons yet' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create comparison' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Doomed phones' }),
    ).toHaveCount(0);
  });

  test('B7: switching comparisons in sidebar loads correct data', async ({
    page,
  }) => {
    const first = await createComparison('Alpha set');
    const second = await createComparison('Beta set');

    await page.goto(`/comparisons/${first.publicId}/entries`);
    await expect(page.getByText('Alpha set').first()).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`/comparisons/${first.publicId}/entries$`),
    );

    await page.getByRole('link', { name: 'Beta set' }).click();
    await expect(page).toHaveURL(
      new RegExp(`/comparisons/${second.publicId}/entries$`),
    );
    await expect(page.getByText('Beta set').first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Entries' })).toBeVisible();

    await page.getByRole('link', { name: 'Alpha set' }).click();
    await expect(page).toHaveURL(
      new RegExp(`/comparisons/${first.publicId}/entries$`),
    );
    await expect(page.getByText('Alpha set').first()).toBeVisible();
  });
});
