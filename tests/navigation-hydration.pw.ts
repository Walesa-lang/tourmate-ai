import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test("the server and hydrated client render the same partners navigation label", async ({ page }) => {
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
  expect(serverHtml).toMatch(/href="\/partner\/dashboard"[^>]*><span class="nav-partners">Partners<\/span>/);
  expect(serverHtml).not.toContain("Partner With Us");

  const partnersLink = page.locator('.nav-links a[href="/partner/dashboard"]');
  await expect(partnersLink).toHaveText("Partners");
  await expect(partnersLink.locator(".nav-partners")).toHaveCSS("white-space", "nowrap");
  expect(hydrationErrors).toEqual([]);
});
