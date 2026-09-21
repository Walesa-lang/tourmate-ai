import { expect, test, type APIRequestContext, type Page } from "./fixtures/browser";

test.setTimeout(240_000);

type PartnerPage = { path: string; eyebrow: string; heading: string; description: string; heroClass?: string; wrapClass: string; cardClass: string };

const partnerPages: readonly PartnerPage[] = [
  { path: "/partner/apply", eyebrow: "Partner with TourMate AI", heading: "Grow your business with travellers", description: "Tell us about your business. Our team will review your application before it can become a TourMate AI partner.", wrapClass: "partner-form-wrap", cardClass: "partner-form-card" },
  { path: "/partner/dashboard", eyebrow: "Your partner space", heading: "Business partner dashboard", description: "Track your application and understand what happens next.", heroClass: "partner-dashboard-hero", wrapClass: "partner-dashboard-wrap", cardClass: "partner-status-card" },
] as const;

async function mountPartnerLayout(page: Page, request: APIRequestContext, partnerPage: (typeof partnerPages)[number]) {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  const stylesheetLinks = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => ({
      href: tag.match(/\bhref=["']([^"']+)["']/i)?.[1],
      rel: tag.match(/\brel=["']([^"']+)["']/i)?.[1],
    }))
    .filter((link): link is { href: string; rel: string } => Boolean(link.href && link.rel?.split(/\s+/).includes("stylesheet")))
    .map(({ href }) => `<link rel="stylesheet" href="${new URL(href, response.url()).href}">`)
    .join("");

  expect(stylesheetLinks).not.toBe("");
  await page.setContent(`<!doctype html><html><head>${stylesheetLinks}</head><body><div class="site-shell partner-page"><header class="dashboard-header"><nav class="nav container" aria-label="Main navigation"><a class="brand" href="/" aria-label="TourMate AI home">TourMate AI</a><button class="mobile-menu-toggle" type="button" aria-label="Open navigation menu"><span></span><span></span><span></span></button></nav></header><main class="partner-main"><section class="partner-hero ${partnerPage.heroClass ?? ""}"><div class="container"><p class="partner-eyebrow">${partnerPage.eyebrow}</p><h1>${partnerPage.heading}</h1><p>${partnerPage.description}</p></div></section><div class="container ${partnerPage.wrapClass}"><section class="${partnerPage.cardClass}" aria-label="Application card"></section></div></main></div></body></html>`);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  for (const partnerPage of partnerPages) {
    test(`${partnerPage.path} is centered and responsive at ${viewport.width}px`, async ({ page, request }) => {
      await page.setViewportSize(viewport);
      await page.goto(partnerPage.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`/sign-in\\?redirectTo=${encodeURIComponent(partnerPage.path)}$`));
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
      const submit = page.locator(".auth-submit");
      await expect(submit).toBeVisible();
      expect((await submit.boundingBox())!.height).toBeGreaterThanOrEqual(44);

      await mountPartnerLayout(page, request, partnerPage);
      const layout = await page.locator(".partner-hero .container").evaluate((container) => {
        const bounds = (selector: string) => {
          const rect = container.querySelector(selector)!.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, center: rect.left + rect.width / 2 };
        };
        const rect = container.getBoundingClientRect();
        return { container: { left: rect.left, right: rect.right, center: rect.left + rect.width / 2 }, eyebrow: bounds(".partner-eyebrow"), heading: bounds("h1"), description: bounds(":scope > p:last-child") };
      });

      for (const element of [layout.eyebrow, layout.heading, layout.description]) {
        expect(Math.abs(element.center - layout.container.center)).toBeLessThanOrEqual(1);
        expect(element.left).toBeGreaterThanOrEqual(layout.container.left - 1);
        expect(element.right).toBeLessThanOrEqual(layout.container.right + 1);
      }
      expect(layout.heading.width).toBeLessThanOrEqual(821);
      expect(layout.heading.top).toBeGreaterThanOrEqual(layout.eyebrow.bottom);
      expect(layout.description.top).toBeGreaterThan(layout.heading.bottom);

      const pageWidths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(pageWidths.scroll).toBeLessThanOrEqual(pageWidths.client + 1);
      if (viewport.width < 1180) {
        await expect(page.locator(".mobile-menu-toggle")).toBeVisible();
        await expect(page.locator(".mobile-menu-toggle")).toHaveCSS("width", "44px");
      } else {
        await expect(page.locator(".mobile-menu-toggle")).toBeHidden();
      }
    });
  }
}
