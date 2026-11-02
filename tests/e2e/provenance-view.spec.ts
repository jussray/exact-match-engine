import { expect, test } from "@playwright/test";

test.describe("Provenance Date Range, Query Persistence & CSV Export", () => {
  test("restores valid date range from URL query parameters", async ({ page }) => {
    await page.goto("/?from=2026-10-01&to=2026-10-31");
    const fromInput = page.locator('[data-testid="prov-from"]');
    const toInput = page.locator('[data-testid="prov-to"]');
    await expect(fromInput).toHaveValue("2026-10-01");
    await expect(toInput).toHaveValue("2026-10-31");
  });

  test("gracefully handles reversed date ranges by swapping to chronological order", async ({ page }) => {
    await page.goto("/?from=2026-10-31&to=2026-10-01");
    const fromInput = page.locator('[data-testid="prov-from"]');
    const toInput = page.locator('[data-testid="prov-to"]');
    await expect(fromInput).toHaveValue("2026-10-01");
    await expect(toInput).toHaveValue("2026-10-31");
  });

  test("gracefully handles incomplete query parameters", async ({ page }) => {
    await page.goto("/?from=2026-10&to=2026-10-31");
    const fromInput = page.locator('[data-testid="prov-from"]');
    const toInput = page.locator('[data-testid="prov-to"]');
    await expect(fromInput).toHaveValue("");
    await expect(toInput).toHaveValue("2026-10-31");
  });

  test("gracefully handles invalid query parameters", async ({ page }) => {
    await page.goto("/?from=garbage&to=2026-02-31");
    const fromInput = page.locator('[data-testid="prov-from"]');
    const toInput = page.locator('[data-testid="prov-to"]');
    await expect(fromInput).toHaveValue("");
    await expect(toInput).toHaveValue("");
    await expect(page.locator('[data-testid="provenance-filter"]')).toBeVisible();
  });

  test("quick presets update date inputs and URL query parameters", async ({ page }) => {
    await page.goto("/");
    for (const days of [7, 30, 90] as const) {
      const presetBtn = page.getByRole("button", { name: `Last ${days} days` });
      await presetBtn.click();
      await expect(page).toHaveURL(new RegExp(`from=\\d{4}-\\d{2}-\\d{2}&to=\\d{4}-\\d{2}-\\d{2}`));
      await expect(presetBtn).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("empty date range shows empty notice and disables CSV download", async ({ page }) => {
    await page.goto("/?from=2099-01-01&to=2099-01-31");
    await expect(page.locator('[data-testid="prov-empty"]')).toBeVisible();
    const csvBtn = page.getByRole("button", { name: /Export CSV/i });
    await expect(csvBtn).toBeDisabled();
  });

  test("reset button clears date filters and restores open view", async ({ page }) => {
    await page.goto("/?from=2026-10-01&to=2026-10-31");
    const resetBtn = page.getByRole("button", { name: "Reset" });
    await resetBtn.click();
    const fromInput = page.locator('[data-testid="prov-from"]');
    const toInput = page.locator('[data-testid="prov-to"]');
    await expect(fromInput).toHaveValue("");
    await expect(toInput).toHaveValue("");
  });
});
