import { expect, test } from "./fixtures/browser";

test.setTimeout(120_000);

test("traveller navigation hydrates consistently and keeps partner operations outside it", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|did not match/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();

  const serverHtml = await response!.text();
  expect(serverHtml).toContain('href="/profile"');
  expect(serverHtml).not.toContain("Partner With Us");
  expect(serverHtml).toContain('aria-label="Language"');
  await expect(page.locator(".language-selector")).toHaveCount(1);

  await expect(page.locator('.nav-links a[href="/profile"]')).toHaveText("Profile");
  await expect(page.locator('header nav a[href^="/partner"], header nav a[href^="/admin"], header nav a[href="/trip-planner"]')).toHaveCount(0);
  await expect(page.locator('footer a[href="/partner/apply"]')).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});
