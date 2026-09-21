import { expect, test, type Page } from "./fixtures/browser";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const measurements = await page.evaluate(() => ({
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(measurements.documentScrollWidth).toBeLessThanOrEqual(measurements.documentClientWidth + 1);
  expect(measurements.bodyScrollWidth).toBeLessThanOrEqual(measurements.bodyClientWidth + 1);
}

async function expectInsideViewport(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
}

for (const viewport of viewports) {
  test(`${viewport.width}px keeps the AI Guide usable without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/ai-guide");
    await expect(page.locator(".chat-panel")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const touchTargets = page.locator(".clear-chat-button, .suggestions button, .send-button");
    for (let index = 0; index < await touchTargets.count(); index += 1) {
      const box = await touchTargets.nth(index).boundingBox();
      expect(box, `touch target ${index} has a measurable box`).not.toBeNull();
      expect(box!.height, `touch target ${index} is at least 44px high`).toBeGreaterThanOrEqual(44);
    }

    await expectInsideViewport(page, ".chat-panel");
    await expectInsideViewport(page, ".message-input-row");
    await expectInsideViewport(page, ".suggestions");
  });
}

test("390px wraps translated messages, keeps errors contained, and scrolls above the composer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ai-guide");

  await page.locator(".language-selector select").selectOption("zh");
  const input = page.locator("#travel-question");
  await input.fill("紧急情况，我需要当地警察、医院和安全交通方面的帮助");
  await page.locator(".send-button").click();
  await expect(page.locator(".emergency-warning")).toBeVisible();
  await expectInsideViewport(page, ".message-row:last-of-type .message-content");
  await expectNoHorizontalOverflow(page);

  for (let index = 0; index < 5; index += 1) {
    await input.fill(`请帮我规划纳米比亚旅行路线 ${index + 1}`);
    await page.locator(".send-button").click();
    await expect(page.locator(".message-row")).toHaveCount(3 + ((index + 1) * 2));
  }

  const listDimensions = await page.locator(".chat-messages").evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
  }));
  expect(listDimensions.scrollHeight).toBeGreaterThan(listDimensions.clientHeight);
  expect(listDimensions.scrollTop).toBeGreaterThan(0);

  await page.route("**/api/ai-guide", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" } }),
    });
  });
  await input.fill("再试一次");
  await page.locator(".send-button").click();
  const errorMessage = page.locator(".message-content p[role='alert']");
  await expect(errorMessage).toBeVisible();
  await expectInsideViewport(page, ".message-row:last-of-type .message-content");
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 500 });
  await input.scrollIntoViewIfNeeded();
  const inputBox = await input.boundingBox();
  expect(inputBox).not.toBeNull();
  expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(500);
});
