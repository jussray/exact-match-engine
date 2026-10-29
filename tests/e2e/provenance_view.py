import asyncio, csv, io
from playwright.async_api import async_playwright, expect

async def test_full_live_compliance():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 1000},
            timezone_id='America/New_York',
            accept_downloads=True
        )
        page = await context.new_page()
        base_url = 'https://fcr-exact-match.lovable.app'
        
        print("--- 1. Navigating to Exact Match Engine Live ---")
        await page.goto(base_url, wait_until='networkidle')
        await page.screenshot(path='/tmp/live_interface_full.png', full_page=True)
        print("Captured full interface screenshot to /tmp/live_interface_full.png")
        
        # 2. Create Claim A (in-range target)
        print("--- 2. Generating Claim A (Target) ---")
        await page.goto(f"{base_url}/claims/new", wait_until='networkidle')
        await page.get_by_label('Statement').fill('Claim Alpha - In Range Target')
        await page.get_by_label('Expected version').fill('sha-alpha-123')
        await page.get_by_label('Reconciliation key').fill('key-alpha')
        await page.get_by_role('button', name='Create claim').click()
        await page.wait_for_function("location.pathname.startsWith('/claims/claim-')")
        
        form = page.get_by_role('form', name='Attach evidence')
        await form.get_by_label('Kind').fill('automated observer')
        await form.get_by_label('Observed version').fill('sha-alpha-123')
        await form.get_by_label('Reference').fill('obs:alpha-receipt')
        await page.get_by_role('button', name='Attach evidence').click()
        await page.get_by_test_id('reconcile').click()
        await expect(page.get_by_test_id('claim-receipt')).to_have_count(1)
        print("Claim Alpha reconciled.")
        
        # 3. Create Claim B
        print("--- 3. Generating Claim B (Second receipt) ---")
        await page.goto(f"{base_url}/claims/new", wait_until='networkidle')
        await page.get_by_label('Statement').fill('Claim Beta - Second Receipt')
        await page.get_by_label('Expected version').fill('sha-beta-456')
        await page.get_by_label('Reconciliation key').fill('key-beta')
        await page.get_by_role('button', name='Create claim').click()
        await page.wait_for_function("location.pathname.startsWith('/claims/claim-')")
        
        form = page.get_by_role('form', name='Attach evidence')
        await form.get_by_label('Kind').fill('manual inspection')
        await form.get_by_label('Observed version').fill('sha-beta-456')
        await form.get_by_label('Reference').fill('obs:beta-receipt')
        await page.get_by_role('button', name='Attach evidence').click()
        await page.get_by_test_id('reconcile').click()
        await expect(page.get_by_test_id('claim-receipt')).to_have_count(1)
        print("Claim Beta reconciled.")
        
        # 4. Check Home with both receipts
        await page.goto(base_url, wait_until='networkidle')
        results = page.locator('[data-testid="prov-results"] li')
        count = await results.count()
        print(f"Total receipts visible without filter: {count}")
        assert count == 2, f"Expected 2 receipts, got {count}"
        
        # 5. Quick Presets Check (7d, 30d, 90d)
        for days in [7, 30, 90]:
            btn = page.get_by_role('button', name=f'Last {days} days')
            await btn.click()
            await page.wait_for_timeout(300)
            url_now = page.url
            print(f"Preset {days} days clicked -> URL: {url_now}")
            assert f"from=" in url_now and f"to=" in url_now
            assert await results.count() == 2
            
        # 6. Test CSV Export Contents
        print("--- 6. Verifying CSV Export Payload ---")
        csv_btn = page.get_by_role('button', name='Export CSV')
        async with page.expect_download() as dl_info:
            await csv_btn.click()
        dl = await dl_info.value
        csv_path = '/tmp/live_filtered_receipts.csv'
        await dl.save_as(csv_path)
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = list(csv.DictReader(f))
            print(f"CSV exported successfully with {len(reader)} records.")
            for idx, row in enumerate(reader):
                print(f" Row {idx+1}:")
                print(f"   receipt_id: {row['receipt_id']}")
                print(f"   source: {row['source']}")
                print(f"   witness_time_utc: {row['witness_time_utc']}")
                print(f"   authorizing: {row['authorizing']}")
                assert row['witness_time_utc'].endswith(' UTC'), f"Invalid UTC format: {row['witness_time_utc']}"
                assert row['authorizing'] == 'false', f"Receipt must be non-authorizing: {row['authorizing']}"
                assert row['source'] in ['obs:alpha-receipt', 'obs:beta-receipt']
                
        # 7. Test Empty Date Filter Range & CSV Disabled
        print("--- 7. Testing Future Range [2031-01-01 to 2031-01-10] ---")
        from_input = page.locator('[data-testid="prov-from"]')
        to_input = page.locator('[data-testid="prov-to"]')
        await from_input.fill('2031-01-01')
        await to_input.fill('2031-01-10')
        await page.wait_for_timeout(300)
        empty_el = page.locator('[data-testid="prov-empty"]')
        await expect(empty_el).to_be_visible()
        print("Empty text verified:", (await empty_el.text_content()).strip())
        assert await csv_btn.is_disabled(), "CSV export should be disabled for empty range"
        print("Export CSV correctly disabled when 0 receipts match.")
        
        # 8. Test Shared URL in fresh context / tab
        print("--- 8. Testing Shared Filtered URL Restoration ---")
        shared_url = f"{base_url}/?from=2026-10-01&to=2026-10-31"
        fresh_context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        fresh_page = await fresh_context.new_page()
        await fresh_page.goto(shared_url, wait_until='networkidle')
        print(f"Navigated to shared URL: {shared_url}")
        
        restored_from = await fresh_page.locator('[data-testid="prov-from"]').input_value()
        restored_to = await fresh_page.locator('[data-testid="prov-to"]').input_value()
        print(f"Restored inputs in fresh session: from={restored_from}, to={restored_to}")
        assert restored_from == '2026-10-01', f"Expected 2026-10-01, got {restored_from}"
        assert restored_to == '2026-10-31', f"Expected 2026-10-31, got {restored_to}"
        print("Query-parameter persistence and restoration VERIFIED!")
        
        await fresh_context.close()
        await context.close()
        await browser.close()
        print("\nALL AUDIT CHECKS COMPLETED AND VERIFIED 100% PASSING!")

asyncio.run(test_full_live_compliance())
