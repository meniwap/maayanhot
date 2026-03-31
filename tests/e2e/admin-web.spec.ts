import { expect, test } from '@playwright/test';

import { createPendingReportFixture, loginAsAdmin } from './admin-web-helpers';

test.describe('admin web phase 13', () => {
  test('admin can create, edit, and publish a spring from the web surface', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/springs/new');
    const title = `מעיין ווב ${Date.now()}`;

    await page.getByTestId('admin-web-spring-title').fill(title);
    await page.getByTestId('admin-web-spring-region-code').fill('jerusalem_hills');
    await page.getByTestId('admin-web-spring-access-notes').fill('גישה מהכביש הראשי');
    await page
      .getByTestId('admin-web-spring-submit')
      .evaluate((node) => (node as HTMLButtonElement).click());

    await page.waitForURL(/\/admin\/springs\/.+\/edit\?status=created/u);
    await page.getByTestId('admin-web-spring-title').fill(`${title} פורסם`);
    await page
      .getByTestId('admin-web-spring-published-toggle')
      .evaluate((node) => (node as HTMLButtonElement).click());
    await page
      .getByTestId('admin-web-spring-submit')
      .evaluate((node) => (node as HTMLButtonElement).click());

    await page.waitForURL(/\/admin\/springs\/.+\/edit\?status=updated/u);
    await page
      .getByRole('button', { name: 'חזרה לרשימה' })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await page.waitForURL('**/admin/springs');
    await expect(page.getByText(`${title} פורסם`)).toBeVisible();
  });

  test('admin can review and approve a pending report from the moderation queue', async ({
    page,
  }) => {
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
    await page
      .getByTestId('admin-review-approve')
      .evaluate((node) => (node as HTMLButtonElement).click());

    await page.waitForURL(/\/admin\/moderation\?feedback=/u);
    await expect(page.getByTestId('admin-moderation-feedback')).toContainText('הדיווח אושר');
    await expect(page.getByText(fixture.note)).toHaveCount(0);
  });
});
