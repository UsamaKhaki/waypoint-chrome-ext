# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notion.spec.ts >> Notion panel — authenticated >> shows page title and object type @P1
- Location: e2e/tests/notion.spec.ts:30:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('notion-dashboard')
Expected substring: "Tech Spec Template"
Received string:    "Test Userperson2Recent2Databases2All📄Untitled854d agoworkspaceUntitled854d agoworkspace"
Timeout: 8000ms

Call log:
  - Expect "toContainText" with timeout 8000ms
  - waiting for getByTestId('notion-dashboard')
    20 × locator resolved to <div class="space-y-6" data-testid="notion-dashboard">…</div>
       - unexpected value "Test Userperson2Recent2Databases2All📄Untitled854d agoworkspaceUntitled854d agoworkspace"

```

```yaml
- heading "Test User" [level=1]
- text: person
- button "Refresh"
- button "Disconnect"
- button "2 Recent"
- button "2 Databases"
- button "2 All"
- button "📄 Untitled 854d ago workspace"
- button "Untitled 854d ago workspace"
```

# Test source

```ts
  1  | import { test, expect } from '../fixtures/index';
  2  | import { seedNotionToken, getStorage } from '../helpers/storage';
  3  | import { navigateTo } from '../helpers/navigate';
  4  | import { mockNotionApi } from '../helpers/api-mocks';
  5  | import { NOTION_MOCKS } from '../fixtures-data/notion';
  6  | 
  7  | test.describe('Notion panel — unauthenticated', () => {
  8  |   test('shows connect screen when no token in storage @P1', async ({ page }) => {
  9  |     await navigateTo(page, 'notion');
  10 |     await expect(page.getByTestId('notion-connect')).toBeVisible();
  11 |   });
  12 | });
  13 | 
  14 | test.describe('Notion panel — authenticated', () => {
  15 |   test.beforeEach(async ({ page, chromeContext }) => {
  16 |     // Notion uses backgroundFetch → must mock at context level (intercepts SW fetch)
  17 |     await mockNotionApi(chromeContext);
  18 |     await seedNotionToken(page);
  19 |     await page.reload();
  20 |     await page.waitForSelector('[data-testid="main-layout"]');
  21 |     await navigateTo(page, 'notion');
  22 |     await expect(page.getByTestId('notion-dashboard')).toBeVisible({ timeout: 10_000 });
  23 |   });
  24 | 
  25 |   test('shows recent pages from mock response @P1', async ({ page }) => {
  26 |     await expect(page.getByTestId('notion-dashboard')).toContainText('Tech Spec Template');
  27 |     await expect(page.getByTestId('notion-dashboard')).toContainText('Sprint Board');
  28 |   });
  29 | 
  30 |   test('shows page title and object type @P1', async ({ page }) => {
> 31 |     await expect(page.getByTestId('notion-dashboard')).toContainText(NOTION_MOCKS.pages[0].title);
     |                                                        ^ Error: expect(locator).toContainText(expected) failed
  32 |   });
  33 | 
  34 |   test('Disconnect clears token from storage @P1', async ({ page }) => {
  35 |     await navigateTo(page, 'settings');
  36 |     await page.getByTestId('settings-section-connectors').click();
  37 |     await page.getByTestId('disconnect-notion').click();
  38 | 
  39 |     const token = await getStorage(page, 'notionToken');
  40 |     expect(token).toBeNull();
  41 | 
  42 |     await navigateTo(page, 'notion');
  43 |     await expect(page.getByTestId('notion-connect')).toBeVisible();
  44 |   });
  45 | });
  46 | 
```