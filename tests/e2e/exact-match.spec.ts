import { expect, test } from '@playwright/test';

const reviewerEmail = process.env.E2E_REVIEWER_EMAIL;
const reviewerPassword = process.env.E2E_REVIEWER_PASSWORD;
const persistenceConfigured = Boolean(
  process.env.VITE_SUPABASE_URL &&
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY &&
  reviewerEmail &&
  reviewerPassword,
);

test('home is a truthful customer-facing verification lab', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Does It Exactly Match Reality/i })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Awaiting comparison');
  await expect(page.locator('body')).not.toContainText(/ULTRATHINK|Founder Control Room|FOUNDER VERIFIED|98\.7%|PROOF VALIDATED/i);
  await expect(page.getByRole('link', { name: /Run an Exact Match/i })).toBeVisible();
});

test('reduced motion disables scanner animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const animationName = await page.locator('.scan-pulse').evaluate((el) => getComputedStyle(el).animationName);
  expect(animationName).toBe('none');
});

test('signed-out visitors cannot mutate proof state or fall back to browser-local storage', async ({ page }) => {
  await page.goto('/claims/new');
  await expect(page.getByRole('heading', { name: /Reviewer authorization required/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Reviewer login/i })).toBeVisible();
  const legacyState = await page.evaluate(() => localStorage.getItem('recon-state-v2'));
  expect(legacyState).toBeNull();
});

test('reviewer runs a real GitHub claim to receipt and database state survives a fresh session', async ({ page, browser }) => {
  test.skip(!persistenceConfigured, 'Requires Exact Match Supabase secrets and an authorized reviewer test account.');

  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(reviewerEmail!);
  await page.getByLabel('Password').fill(reviewerPassword!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);

  const intake = page.getByTestId('repository-intake');
  await intake.getByRole('button', { name: 'Observe head' }).click();
  await expect(intake.getByText(/Observed GitHub head/i)).toBeVisible({ timeout: 30_000 });
  await intake.getByRole('button', { name: 'Run claim and reconcile' }).click();
  await expect(page.getByTestId('intake-findings')).toBeVisible();
  await expect.poll(async () => page.getByTestId('persistence-status').textContent()).toBe('saved');

  const claimLink = page.getByRole('link', { name: /Open claim evidence \+ findings/i });
  const claimHref = await claimLink.getAttribute('href');
  expect(claimHref).toMatch(/^\/claims\/claim-/);

  await page.reload();
  await expect(page.getByRole('heading', { name: /Reviewer dashboard/i })).toBeVisible();
  await expect(page.locator(`a[href="${claimHref}"]`).first()).toBeVisible();

  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.goto('/admin/login');
  await freshPage.getByLabel('Email').fill(reviewerEmail!);
  await freshPage.getByLabel('Password').fill(reviewerPassword!);
  await freshPage.getByRole('button', { name: 'Sign in' }).click();
  await expect(freshPage).toHaveURL(/\/admin\/?$/);
  await expect(freshPage.locator(`a[href="${claimHref}"]`).first()).toBeVisible();

  const freshIntake = freshPage.getByTestId('repository-intake');
  await freshIntake.getByRole('button', { name: 'Observe head' }).click();
  await expect(freshIntake.getByText(/Observed GitHub head/i)).toBeVisible({ timeout: 30_000 });
  await freshIntake.getByRole('button', { name: 'Run claim and reconcile' }).click();
  await expect(freshPage.getByTestId('intake-findings')).toBeVisible();
  await expect.poll(async () => freshPage.getByTestId('persistence-status').textContent()).toBe('saved');
  await freshContext.close();
});
