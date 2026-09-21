import { expect, test, type Page } from "./fixtures/browser";
import { session, user, profile, saved } from "./fixtures/traveller.mjs";

test.setTimeout(120_000);

async function fixture(page: Page) {
  await page.context().addCookies([{ name: "sb-squxtadjqxmurlslapjd-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), domain: "127.0.0.1", path: "/" }]);
  await page.route("https://*.supabase.co/**", route => route.fulfill({ json: user }));
  await page.route("**/api/profile", route => route.fulfill({ json: { ...profile, email: user.email } }));
  await page.route("**/api/saved", route => route.fulfill({ json: { items: saved } }));
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

for (const [width, height] of [[320, 844], [390, 844], [768, 900], [1024, 900], [1440, 900], [640, 390], [768, 390], [1024, 390]]) {
  test(`traveller presentation at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await fixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`); });
    for (const route of ["/", "/dashboard", "/profile", "/ai-guide", "/explore", "/hotels", "/attractions"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1").first()).toBeVisible();
      if (route === "/dashboard") {
        await expect(page.locator(".saved-recommendation")).toHaveCount(2);
        await expect(page.locator("main")).not.toContainText("PRIVATE-FOOD-FIXTURE");
        await expect(page.locator(".dashboard-stat-grid")).toHaveCount(0);
      }
      if (route === "/profile") {
        await expect(page.getByRole("heading", { name: "Interests", exact: true })).toBeVisible();
        expect((await page.locator(".profile-stage").boundingBox())!.width).toBeGreaterThan(width < 768 ? width - 70 : 380);
      }
      await expect(page.locator(".language-selector select")).toHaveCSS("opacity", "1");
      await noOverflow(page);
      if (route === "/ai-guide" && height === 390) {
        await page.locator("#travel-question").fill("Ideas for Windhoek");
        await page.locator(".send-button").scrollIntoViewIfNeeded();
        await expect(page.locator(".send-button")).toBeInViewport();
        await expect(page.locator("#travel-question")).toBeInViewport();
      }
      if ([390, 1440].includes(width) && ["/", "/dashboard", "/profile", "/ai-guide"].includes(route)) await page.screenshot({ path: `test-results/polish-${route.slice(1) || "home"}-${width}.png`, fullPage: true });
    }
    if (width <= 1180) {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      await expect(page.locator(".mobile-menu-links a").first()).toBeFocused();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
      const action = page.locator(".mobile-menu-actions a").last();
      await action.focus();
      await expect(action).toBeInViewport();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeFocused();
      await page.screenshot({ path: `test-results/polish-menu-${width}-${height}.png` });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();
    } else {
      await expect(page.locator(".nav-links a")).toHaveText(["AI Assistant", "Explore", "Profile"]);
      const account = page.getByRole("button", { name: /Open account menu/ });
      await account.click();
      await expect(page.getByRole("menuitem").first()).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menuitem").last()).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(account).toBeFocused();
    }
    await expect(page.locator('header a[href="/trip-planner"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("saved cards handle long titles, duplicates, removal confirmation and empty state", async ({ page }) => {
  await fixture(page);
  let items = [{ ...saved[0], item_snapshot: { ...saved[0].item_snapshot, name: "A very long Namibia stay name ".repeat(6) } }];
  await page.route("**/api/saved", route => {
    if (route.request().method() === "POST") { items = []; return route.fulfill({ json: { status: "removed" } }); }
    return route.fulfill({ json: { items: [...items, ...items] } });
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/dashboard");
  await expect(page.locator(".saved-card")).toHaveCount(1);
  await noOverflow(page);
  await page.getByRole("button", { name: /^Remove / }).click();
  await expect(page.getByRole("button", { name: "Keep saved" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^Remove / })).toBeFocused();
  await page.getByRole("button", { name: /^Remove / }).click();
  await page.getByRole("button", { name: /^Confirm removal of/ }).click();
  await expect(page.getByRole("heading", { name: "Make room for a little inspiration" })).toBeVisible();
  await expect(page.locator(".saved-places [role=status]")).toHaveText("Removed from saved places.");
  await expect(page.locator(".traveller-empty a")).toBeFocused();
  await page.screenshot({ path: "test-results/polish-dashboard-empty.png", fullPage: true });
});

test("saved loading, failure, retry and signed-out states", async ({ page }) => {
  await fixture(page);
  let mode = "loading";
  let release: (() => void) | undefined;
  await page.route("**/api/saved", async route => {
    if (mode === "loading") await new Promise<void>(resolve => { release = resolve; });
    return route.fulfill(mode === "auth" ? { status: 401, json: {} } : mode === "ready" ? { json: { items: saved } } : { status: 503, json: {} });
  });
  await page.goto("/dashboard");
  await expect(page.getByText("Loading saved recommendations…")).toBeAttached();
  mode = "error"; release?.();
  await expect(page.locator(".saved-places").getByRole("alert")).toContainText("Could not load");
  mode = "ready";
  await page.getByRole("button", { name: "Retry saved places" }).click();
  await expect(page.locator(".saved-recommendation")).toHaveCount(2);
  mode = "auth"; await page.reload();
  await expect(page.locator('.traveller-empty a[href="/sign-in?redirectTo=%2Fdashboard"]')).toBeVisible();
});

test("reduced motion and longer translated navigation remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture(page);
  await page.goto("/dashboard");
  await page.locator(".language-selector select").selectOption("pt");
  await noOverflow(page);
  for (const link of await page.locator(".nav-links a").all()) {
    expect(await link.evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(44);
  }
  expect(await page.locator(".saved-card").first().evaluate(el => getComputedStyle(el).animationName)).toBe("none");
});

test("account menu closes outside and sign-out restores the public header", async ({ page }) => {
  await fixture(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: /Open account menu/ }).click();
  await page.locator("h1").click();
  await expect(page.getByRole("button", { name: /Open account menu/ })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: /Open account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign Out" }).click();
  await expect(page.locator(".nav-actions").getByRole("link", { name: "Sign In", exact: true })).toBeVisible();
  await expect(page.locator(".nav-links a")).toHaveText(["AI Assistant", "Explore", "Profile"]);
});
