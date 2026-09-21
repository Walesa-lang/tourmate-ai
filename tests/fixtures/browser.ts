import { test as base } from "@playwright/test";

// Catalogue layout tests must not depend on a third-party image host.
// This visibly labelled asset exists only inside the browser test boundary.
const catalogueImage = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#eaf3f8"/><text x="320" y="200" text-anchor="middle" fill="#36576f" font-family="sans-serif" font-size="20">Catalogue image fixture</text></svg>';

export const test = base.extend<{ externalImages: void }>({
  externalImages: [async ({ context }, use) => {
    await context.route("https://images.unsplash.com/**", route => route.fulfill({
      contentType: "image/svg+xml",
      body: catalogueImage,
    }));
    await use();
  }, { auto: true }],
});

export { expect } from "@playwright/test";
export type { APIRequestContext, Page } from "@playwright/test";
