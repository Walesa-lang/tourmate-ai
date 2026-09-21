import { expect, test } from "./fixtures/browser";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`${width}px keeps the Namibia MVP navigation and assistant usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 768 ? 900 : 780 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Namibia");
    await expect(page.locator('main a[href="/ai-guide"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/explore"]').first()).toBeVisible();
    await expect(page.locator('a[href="/trip-planner"]')).toHaveCount(0);

    if (width <= 1180) {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      const toggle = page.getByRole("button", { name: "Close navigation menu" });
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator('.mobile-menu-links a[href="/ai-guide"]')).toBeVisible();
      await expect(page.locator('.mobile-menu-links a[href="/ai-guide"]')).toBeFocused();
      await expect(page.locator('.mobile-menu a[href="/sign-in"]')).toBeVisible();
      // Trigger the translation observer after opening, reproducing the defect.
      await page.evaluate(() => { const p = document.createElement("p"); p.textContent = "translation mutation"; document.body.append(p); p.remove(); });
      await expect(toggle).toHaveAccessibleName("Close navigation menu");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();
      await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false");
    } else {
      await expect(page.locator('.nav-actions a[href="/ai-guide"]')).toBeVisible();
    }

    await page.goto("/ai-guide");
    await expect(page.locator(".chat-panel")).toBeVisible();
    await expect(page.getByText("Demo mode", { exact: true }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("catalogue pages identify sample content and disable preview searches", async ({ page }) => {
  await page.goto("/hotels");
  await expect(page.getByText("6 sample listings")).toBeVisible();
  await expect(page.locator(".hotel-search-button")).toBeDisabled();
  await page.goto("/attractions");
  await expect(page.getByText("8 sample activities")).toBeVisible();
  await expect(page.locator(".attraction-search-button")).toBeDisabled();
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Explore Namibia", exact: true })).toBeVisible();
  await expect(page.locator(".filter-button")).toBeDisabled();
});
