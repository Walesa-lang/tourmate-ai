import { expect, test, type APIRequestContext, type Page } from "./fixtures/browser";

test.setTimeout(240_000);

async function mountAdminLayout(page: Page, request: APIRequestContext) {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  const stylesheets = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => ({ href: tag.match(/\bhref=["']([^"']+)["']/i)?.[1], rel: tag.match(/\brel=["']([^"']+)["']/i)?.[1] }))
    .filter((link): link is { href: string; rel: string } => Boolean(link.href && link.rel?.split(/\s+/).includes("stylesheet")))
    .map(({ href }) => `<link rel="stylesheet" href="${new URL(href, response.url()).href}">`).join("");
  expect(stylesheets).not.toBe("");
  await page.setContent(`<!doctype html><html><head>${stylesheets}</head><body><div class="site-shell admin-page"><header class="admin-header"><div class="container admin-nav"><a class="brand">TourMate AI <span>Admin</span></a><div class="admin-account"><span>admin@example.com</span><button class="admin-logout">Sign out</button></div></div></header><main class="admin-main"><section class="admin-hero"><div class="container"><p>Partner operations</p><h1>Business applications</h1><span>Review applicants securely and keep partner decisions moving.</span></div></section><div class="container admin-content"><nav class="admin-filters"><a aria-current="page">Pending</a><a>Approved</a><a>Rejected</a><a>All</a></nav><div class="admin-list-heading"><div><p>Application queue</p><h2>Pending applications</h2></div><span>1 application</span></div><div class="admin-application-list"><article class="admin-application-card"><div class="admin-card-primary"><span class="partner-status partner-status-pending">pending</span><h3>Desert Trails Namibia</h3><p>Amina N. · Tour operator</p></div><dl><div><dt>Email</dt><dd>partners@example.com</dd></div><div><dt>Phone</dt><dd>+264 61 000 000</dd></div><div><dt>Submitted</dt><dd>Aug 26, 2026</dd></div></dl><a class="admin-review-link">Open application →</a></article></div><form class="admin-review-form"><div class="admin-section-heading"><p>Decision</p><h2>Review this application</h2></div><div class="admin-field"><label for="reason">Rejection reason</label><textarea id="reason"></textarea></div><div class="admin-review-actions"><button class="button admin-approve">Approve application</button><button class="button admin-reject">Reject application</button></div></form></div></main></div></body></html>`);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`admin route and application layout are protected and responsive at ${viewport.width}px`, async ({ page, request }) => {
    await page.setViewportSize(viewport);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fadmin$/, { timeout: 20_000 });
    await expect(page.locator(".auth-submit")).toBeVisible();

    await mountAdminLayout(page, request);
    const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    await expect(page.locator(".admin-application-card")).toBeVisible();
    await expect(page.locator(".admin-review-form textarea")).toBeVisible();
    for (const button of await page.locator(".admin-review-actions .button, .admin-logout").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    const cardColumns = await page.locator(".admin-application-card").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    if (viewport.width <= 900) expect(cardColumns).toBe(1);
    else expect(cardColumns).toBe(3);
  });
}
