/* eslint-disable no-control-regex */
/* eslint-disable no-console */
import { test as base, expect, Page } from '@playwright/test';
import { FailureDetail } from '../utils/analysis/ai-test-analyzer';

export const test = base.extend<{
  aiAnalysis: void;
}>({
  aiAnalysis: [
    async ({ page }, use, testInfo) => {
      await use();

      // Check for failures, including soft asserts (multiple errors)
      const hasErrors = testInfo.errors.length > 0;
      const isFailed =
        testInfo.status !== testInfo.expectedStatus &&
        (testInfo.status === 'failed' || testInfo.status === 'timedOut');

      if (hasErrors || isFailed) {
        console.log(`\n🤖 Capturing failure context in: ${testInfo.title}...`);

        // Clean up DOM content: remove script and style tags to reduce size
        let domContent = await page.content();
        domContent = domContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        const failure: FailureDetail = {
          name: testInfo.title,
          file: testInfo.file,
          error: testInfo.errors.map((e) => stripAnsi(e.message)).join('\n---\n'),
          trace: testInfo.errors.map((e) => stripAnsi(e.stack)).join('\n---\n'),
          domContent: domContent,
        };

        // Attach failure detail as JSON for the reporter to process
        await testInfo.attach('ai-failure-context', {
          body: JSON.stringify(failure),
          contentType: 'application/json',
        });

        console.log(`\n✅ AI Failure context attached for: ${testInfo.title}`);
      }
    },
    { auto: true },
  ],
});

function stripAnsi(text?: string): string {
  return text?.replace(/\x1B\[[0-9;]*m/g, '') || '';
}

export { expect, Page };
