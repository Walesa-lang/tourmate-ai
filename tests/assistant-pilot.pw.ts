import { expect, test } from "./fixtures/browser";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Assistant quota and recovery states remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route("**/api/ai-guide", (route) => route.fulfill({ status: 429, json: { error: { code: "SERVICE_UNAVAILABLE", message: "Quota exhausted" } } }));
    await page.goto("/ai-guide");
    const input = page.locator("#travel-question");
    await input.fill("Plan 2 days in Windhoek");
    await page.locator(".send-button").click();
    await expect(page.locator(".message-content [role=alert]")).toContainText("request limit");
    await expect(input).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.route("**/api/ai-guide", (route) => route.fulfill({ json: { data: { message: "Here are illustrative Windhoek ideas.", emergency: false, mode: "demonstration", notice: "Live AI is unavailable; this is a deterministic demonstration." } } }));
    await input.fill("Try Windhoek ideas");
    await page.locator(".send-button").click();
    await expect(page.getByText("Live AI is unavailable; this is a deterministic demonstration.", { exact: true })).toBeVisible();
    await expect(input).toBeFocused();
    await page.screenshot({ path: `test-results/assistant-pilot-${width}.png`, fullPage: true });
    await page.setViewportSize({ width: Math.max(640, width), height: 390 });
    await input.scrollIntoViewIfNeeded();
    await expect(input).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
test("pilot sign-in requirement has a useful message", async ({ page }) => {
  await page.route("**/api/ai-guide", (route) => route.fulfill({ status: 401, json: { error: { code: "SERVICE_UNAVAILABLE" } } }));
  await page.goto("/ai-guide");
  await page.locator("#travel-question").fill("Hello");
  await page.locator(".send-button").click();
  await expect(page.locator(".message-content [role=alert]")).toContainText("Sign in");
});
