import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
}

for (const viewport of viewports) {
  test(`${viewport.width}px keeps the install interface responsive and unobtrusive`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?pwa-install-test=prompt");

    const install = page.locator(".pwa-install");
    await expect(install).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const installBox = await install.boundingBox();
    const footerBox = await page.locator(".adventure-footer").boundingBox();
    expect(installBox).not.toBeNull();
    expect(footerBox).not.toBeNull();
    expect(installBox!.x).toBeGreaterThanOrEqual(0);
    expect(installBox!.x + installBox!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(installBox!.y).toBeGreaterThanOrEqual(footerBox!.y + footerBox!.height - 1);

    for (const selector of [".pwa-install-button", ".pwa-dismiss-button"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    if (viewport.width < 1180) {
      await expect(page.locator(".mobile-menu-toggle")).toBeVisible();
    } else {
      await expect(page.locator(".nav-links")).toBeVisible();
    }
  });
}

test("390px wraps translated install text and dismisses accessibly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?pwa-install-test=prompt");
  await page.locator(".language-selector select").selectOption("zh");

  const copy = page.locator(".pwa-install-copy");
  await expect(copy).toContainText("TourMate AI");
  const copyBox = await copy.boundingBox();
  expect(copyBox).not.toBeNull();
  expect(copyBox!.x + copyBox!.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalOverflow(page);

  await page.locator(".pwa-dismiss-button").click();
  await expect(page.locator(".pwa-install")).toBeHidden();
});

test("manifest, icons, service worker, offline page, AI Guide, and auth route are served", async ({ page, request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect((await manifestResponse.json()).name).toBe("TourMate AI");

  for (const path of ["/favicon.ico", "/apple-icon.png", "/icons/tourmate-192.png", "/icons/tourmate-512.png", "/icons/tourmate-maskable-512.png"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(response.headers()["content-type"]).toMatch(/image/);
  }

  const workerResponse = await request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  expect(workerResponse.headers()["cache-control"]).toContain("no-cache");
  expect(await workerResponse.text()).toContain('"/api/"');

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await page.goto("/ai-guide");
  await expect(page.getByRole("heading", { name: "Ask your guide." })).toBeVisible();
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in to TourMate AI" })).toBeVisible();
});

test("the service worker serves the cached branded offline fallback", async ({ page }) => {
  await page.goto("/?pwa-sw-test=1");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match("/offline", { ignoreVary: true })))).toBe(true);
  await page.goto("/pwa-offline-test");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
});
