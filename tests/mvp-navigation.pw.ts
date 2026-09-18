import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`${width}px keeps the Namibia MVP navigation and assistant usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 768 ? 900 : 780 });
    await page.goto("/");
    await expect(page.getByText("Your Namibia expedition begins here")).toBeVisible();
    await expect(page.locator('main a[href="/ai-guide"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/explore"]').first()).toBeVisible();
    await expect(page.locator('a[href="/trip-planner"]')).toHaveCount(0);

    if (width <= 1180) {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      if (width <= 700) {
        await expect(page.getByRole("navigation", { name: "Quick navigation" }).getByRole("link", { name: "Guide" })).toBeVisible();
      } else {
        await expect(page.locator('.mobile-menu a[href="/ai-guide"]')).toBeVisible();
      }
      await expect(page.locator('.mobile-menu a[href="/sign-in"]')).toBeVisible();
    } else {
      await expect(page.locator('.nav-actions a[href="/ai-guide"]')).toBeVisible();
      await expect(page.locator('.nav-links a[href="/ai-guide"]')).toHaveCount(0);
    }

    await page.goto("/ai-guide");
    await expect(page.locator(".chat-panel")).toBeVisible();
    await expect(page.locator(".preview-badge")).toContainText("Prewritten replies");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("catalogue pages identify sample content and disable preview searches", async ({ page }) => {
  await page.goto("/hotels");
  await expect(page.getByText("6 sample listings")).toBeVisible();
  await expect(page.locator("#hotel-destination")).toBeDisabled();
  await page.goto("/attractions");
  await expect(page.getByText("8 sample activities")).toBeVisible();
  await expect(page.locator("#activity-destination")).toBeDisabled();
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Explore Namibia", exact: true })).toBeVisible();
  await expect(page.locator("#explore-search")).toBeDisabled();
});

test("quick navigation stays keyboard accessible and reduced motion removes movement", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const quickNav = page.getByRole("navigation", { name: "Quick navigation" });
  await expect(quickNav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  for (const link of await quickNav.getByRole("link").all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await quickNav.getByRole("link", { name: "Guide" }).focus();
  await expect(quickNav.getByRole("link", { name: "Guide" })).toBeFocused();
  const duration = await page.locator(".adventure-mission-card").first().evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(duration).toBe("1e-05s");
});
