/* eslint-disable no-control-regex */
/* eslint-disable no-console */
import { test as base, expect, Page } from '@playwright/test';
import { attachment } from 'allure-js-commons';
import { FailureDetail, analyzeFailure } from '../utils/analysis/ai-test-analyzer';

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

        // Run AI analysis at the test layer so that it can be attached
        const analysis = await analyzeFailure(failure);

        // Add annotation so it appears directly in Playwright reports
        testInfo.annotations.push({
          type: 'ai-analysis',
          description: analysis,
        });

        // Attach the full analysis body for HTML/JSON report visibility
        await testInfo.attach('ai-analysis', {
          body: analysis,
          contentType: 'text/markdown',
        });

        // Also attach to Allure report (if Allure reporter is enabled)
        try {
          await attachment('AI Analysis', analysis, 'text/markdown');
        } catch (e) {
          console.warn('Failed to attach AI analysis to Allure:', e);
        }

        console.log(`\n✅ AI analysis attached for: ${testInfo.title}`);
      }
    },
    { auto: true },
  ],
});

function stripAnsi(text?: string): string {
  return text?.replace(/\x1B\[[0-9;]*m/g, '') || '';
}

export { expect, Page };
