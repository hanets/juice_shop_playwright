/* eslint-disable no-console */
/* eslint-disable no-control-regex */
import { test as base, expect, Page } from '@playwright/test';
import { analyzeFailure, FailureDetail } from '../utils/analysis/ai-test-analyzer';

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
        console.log(`\n🤖 Analyzing failure in: ${testInfo.title}...`);

        const firstError = testInfo.errors[0]?.message || 'Unknown error';
        const isLocatorIssue = /locator|timeout|strict mode/i.test(firstError);

        let screenshotBuffer: Buffer | undefined;
        if (isLocatorIssue) {
          console.log('📸 Locator issue detected, capturing compressed screenshot...');
          screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 50 });
        }

        // Clean up DOM content: remove script and style tags to reduce size
        let domContent = await page.content();
        domContent = domContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        const failure: FailureDetail = {
          name: testInfo.title,
          file: testInfo.file,
          error: testInfo.errors.map((e) => stripAnsi(e.message)).join('\n---\n'), // Include all errors for soft asserts
          trace: testInfo.errors.map((e) => stripAnsi(e.stack)).join('\n---\n'),
          domContent: domContent,
          screenshotBuffer: screenshotBuffer,
        };

        try {
          const analysis = await analyzeFailure(failure);

          // Attach analysis to the report
          await testInfo.attach('AI Failure Analysis', {
            body: analysis,
            contentType: 'text/markdown',
          });

          // Also add an annotation for quick visibility in some reporters
          testInfo.annotations.push({
            type: 'ai-analysis',
            description: analysis.substring(0, 1000), // Keep it reasonable
          });

          console.log(`\n✅ AI Analysis attached for: ${testInfo.title}`);
        } catch (error) {
          console.error(`\n❌ Failed to generate AI analysis: ${error}`);
        }
      }
    },
    { auto: true },
  ],
});

function stripAnsi(text?: string): string {
  return text?.replace(/\x1B\[[0-9;]*m/g, '') || '';
}

export { expect, Page };
