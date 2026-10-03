import { expect, test } from '@playwright/test';

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

test('AI review stays non-authorizing and deterministic reconciliation exposes a field mismatch', async ({ page }) => {
  await page.goto('/claims/new');
  await page.getByLabel('Statement').fill('Deployment SHA matches observed repository state');
  await page.getByLabel('Expected version').fill('v1');
  await page.getByLabel('Reconciliation key').fill('e2e/repository');
  await page.getByRole('button', { name: 'Create claim' }).click();
  await expect(page).toHaveURL(/\/claims\/claim-/);

  await page.getByLabel('Kind').fill('CI test witness');
  await page.getByLabel('Observed version').fill('v2');
  await page.getByLabel('Reference').fill('test://authoritative-witness');
  await page.getByRole('button', { name: 'Attach evidence' }).click();
  await expect(page.getByText('CI test witness', { exact: true })).toBeVisible();
  await expect(page.getByTestId('claim-receipt')).toHaveCount(0);

  await page.getByRole('button', { name: 'Review claim and evidence' }).click();
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('claim-receipt')).toHaveCount(0);

  const prepared = await page.evaluate(() => {
    const raw = localStorage.getItem('recon-state-v2');
    if (!raw) throw new Error('missing recon state');
    const state = JSON.parse(raw);
    if (state.evidence.length !== 1) throw new Error(`expected one evidence item before reconciliation, got ${state.evidence.length}`);
    const evidence = state.evidence[0];
    const now = new Date().toISOString();
    evidence.verification_class = 'authoritative';
    evidence.scope = 'repository';
    evidence.provider = 'ci-test-witness';
    evidence.retrieved_at = now;
    evidence.as_of = now;
    localStorage.setItem('recon-state-v2', JSON.stringify(state));
    return { evidenceCount: state.evidence.length, receiptCount: state.receipts.length };
  });
  expect(prepared).toEqual({ evidenceCount: 1, receiptCount: 0 });

  await page.reload();
  await page.getByTestId('reconcile').click();

  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('recon-state-v2') ?? '{}').receipts?.length ?? 0)).toBeGreaterThan(0);
  const reconciliation = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('recon-state-v2') ?? '{}');
    return {
      receipts: (state.receipts ?? []).map((receipt: any) => ({
        id: receipt.id,
        result: receipt.result,
        field: receipt.field,
        expected: receipt.expected_field_value,
        observed: receipt.observed_field_value,
        authorizing: receipt.authorizing,
      })),
      truthState: state.claims?.[0]?.truth_state,
    };
  });

  const mismatches = reconciliation.receipts.filter((receipt: any) => receipt.result === 'exact_version_mismatch');
  expect(mismatches).toHaveLength(1);
  expect(mismatches[0]).toMatchObject({ field: 'version', expected: 'v1', observed: 'v2', authorizing: false });
  expect(new Set(reconciliation.receipts.map((receipt: any) => receipt.id)).size).toBe(reconciliation.receipts.length);
  expect(reconciliation.truthState).toBe('BLOCKED');

  await expect(page.getByTestId('claim-receipt').filter({ hasText: 'exact_version_mismatch' })).toHaveCount(1);
  await expect(page.getByTestId('claim-receipt').filter({ hasText: 'exact_version_mismatch' })).toContainText(/version: v1.*v2/i);
  await expect(page.getByText('BLOCKED', { exact: true }).first()).toBeVisible();
});
