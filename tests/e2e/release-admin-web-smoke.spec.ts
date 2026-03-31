import { expect, test } from '@playwright/test';

import { createPendingReportFixture, loginAsAdmin } from './admin-web-helpers';

test.describe('admin web phase 15 release smoke', () => {
  test('admin can log in and load the core management surfaces', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/springs');
    await expect(page.getByTestId('admin-springs-create-link')).toBeVisible();

    await page.goto('/admin/springs/new');
    await expect(page.getByTestId('admin-spring-editor-screen')).toBeVisible();
  });

  test('admin can open a pending moderation review route', async ({ page }) => {
    const fixture = await createPendingReportFixture();

    await loginAsAdmin(page);
    await page.goto('/admin/moderation');
    await expect(page.getByText(fixture.note)).toBeVisible();
    await page
      .locator('[data-testid^="admin-moderation-item-"]')
      .filter({ hasText: fixture.note })
      .getByRole('link', { name: 'בדיקה' })
      .click();

    await expect(page.getByTestId('admin-review-screen')).toContainText(fixture.springTitle);
  });
});
