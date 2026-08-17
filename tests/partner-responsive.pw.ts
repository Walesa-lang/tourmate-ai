import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}px protects the partner portal and preserves a usable sign-in layout`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/partner/apply");
    await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fpartner%2Fapply$/);
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
    const submit = page.locator(".auth-submit");
    await expect(submit).toBeVisible();
    expect((await submit.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
}
