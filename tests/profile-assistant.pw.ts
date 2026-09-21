import { expect, test, type Page } from "./fixtures/browser";

async function profileFixture(page: Page) {
  const profile: Record<string, unknown> = {};
  let fullName = "Demo Traveller";
  await page.route("**/api/profile", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { full_name: fullName, email: "demo@example.test", travel_profile: profile } });
    const body = route.request().postDataJSON();
    if (body.action === "step") { profile[body.stage] = body.data; if (body.full_name !== undefined) fullName = body.full_name; }
    if (body.action === "delete") delete profile[body.stage];
    if (body.action === "step" || body.action === "skip") profile.completed = [...new Set([...(profile.completed as string[] ?? []), body.stage])];
    if (body.action === "consent") {
      profile.consents = { ...(profile.consents as object ?? {}), [body.purpose]: { status: body.granted ? "granted" : "withdrawn" } };
      if (body.purpose === "food" && !body.granted) delete profile.food;
    }
    return route.fulfill({ json: { travel_profile: profile } });
  });
}

async function openProfile(page: Page) {
  // Hydration starts the profile fetch after navigation. Wait for that boundary
  // before asserting the ready UI, rather than racing its loading state.
  const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/profile" && response.request().method() === "GET");
  await page.goto("/profile");
  await loaded;
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`${width}px profile stages remain accessible without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await profileFixture(page);
    await openProfile(page);
    await expect(page.getByLabel("Display name")).toBeVisible();
    for (const stage of ["Essential account", "Trip context", "Interests", "Travel preferences", "Optional food preferences"]) {
      await page.getByRole("button", { name: new RegExp(`\\d\\. ${stage}`) }).click();
      await expect(page.getByRole("heading", { name: stage, exact: true })).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: `test-results/profile-${width}.png`, fullPage: true });
    await page.setViewportSize({ width: Math.max(width, 640), height: 390 });
    await page.getByRole("button", { name: "2. Trip context" }).click();
    await page.getByLabel("Current or planned Namibia area").fill("Windhoek");
    await page.getByRole("button", { name: "Save and continue" }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Save and continue" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test("profile saves, restores, skips, edits, deletes, grants and withdraws consent", async ({ page }) => {
  await profileFixture(page);
  await openProfile(page);
  await page.getByLabel("Display name").fill("Amina");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByLabel("Current or planned Namibia area").fill("Windhoek");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Skip this stage" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Travel preferences", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "2. Trip context" }).click();
  await expect(page.getByLabel("Current or planned Namibia area")).toHaveValue("Windhoek");
  await page.getByLabel("Current or planned Namibia area").fill("Etosha");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "2. Trip context" }).click();
  await page.getByRole("button", { name: "Delete saved answers for this stage" }).click();
  await expect(page.getByLabel("Current or planned Namibia area")).toHaveValue("");
  const foodConsent = page.getByRole("checkbox", { name: /Store my optional food preferences/ });
  // Consent reflects the acknowledged server state, not an optimistic toggle.
  await foodConsent.click();
  await expect(foodConsent).toBeChecked();
  await page.getByRole("button", { name: "5. Optional food preferences" }).click();
  await page.getByLabel("Allergies (optional)").fill("Peanuts");
  await page.getByRole("button", { name: "Save food preferences" }).click();
  await foodConsent.click();
  await expect(foodConsent).not.toBeChecked();
  await expect(page.getByLabel("Allergies (optional)")).toHaveValue("");
  await expect(page.getByLabel("Allergies (optional)")).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: /Location use is not active/ })).toBeDisabled();
});

test("profile validation and unavailable states are accessible and retryable", async ({ page }) => {
  await profileFixture(page);
  await openProfile(page);
  await page.getByRole("button", { name: "2. Trip context" }).click();
  await page.route("**/api/profile", async (route) => route.fulfill({ status: 400, json: { error: "Review the highlighted fields.", errors: { departure: "Departure must be on or after arrival." } } }));
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByLabel("Departure date (optional)")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Departure date (optional)")).toHaveAccessibleDescription("Departure must be on or after arrival.");
  await page.route("**/api/profile", async (route) => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.reload();
  await expect(page.getByRole("button", { name: "Retry loading profile" })).toBeVisible();
});

test("unauthenticated profile gives sign-in and Assistant paths", async ({ page }) => {
  await page.route("**/api/profile", async (route) => route.fulfill({ status: 401, json: { error: "Sign in" } }));
  await openProfile(page);
  await expect(page.locator('main a[href="/sign-in?redirectTo=%2Fprofile"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "continue with the Assistant" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "A profile that travels with you" })).toBeVisible();
});

test("Assistant creates and refines a proposal and saves selected items", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/saved", async (route) => route.fulfill({ json: { status: route.request().postDataJSON().action === "save" ? "saved" : "removed" } }));
  await page.goto("/ai-guide");
  const input = page.locator("#travel-question");
  await input.fill("Plan a trip to Windhoek");
  await page.locator(".send-button").click();
  await expect(page.getByText("For Windhoek, how many days would you like to plan?", { exact: true })).toBeVisible();
  await input.fill("2 days");
  await page.locator(".send-button").click();
  await expect(page.getByRole("button", { name: "Save Windhoek Flavours & Stories" })).toBeVisible();
  await input.fill("Make it slower");
  await page.locator(".send-button").click();
  await expect(page.locator(".message-row").last()).toContainText("relaxed pace");
  await page.getByRole("button", { name: "Save Windhoek Flavours & Stories" }).last().click();
  await expect(page.getByRole("button", { name: "Remove Windhoek Flavours & Stories" })).toBeVisible();
  await page.getByRole("button", { name: "Remove Windhoek Flavours & Stories" }).click();
  await expect(page.getByText("Removed from saved places.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
