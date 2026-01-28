import { test as base, expect, Page } from '@playwright/test';
import { analyzeFailure, FailureDetail } from '../utils/analysis/ai-test-analyzer';

export const test = base.extend<{
  aiAnalysis: void;
}>({
  aiAnalysis: [
    async ({ page }, use, testInfo) => {
      await use();

      // This runs after the test finishes
      if (
        testInfo.status !== testInfo.expectedStatus &&
        (testInfo.status === 'failed' || testInfo.status === 'timedOut')
      ) {
        console.log(`\n🤖 Analyzing failure in: ${testInfo.title}...`);

        const screenshot = await page.screenshot();
        const domContent = await page.content();

        const failure: FailureDetail = {
          name: testInfo.title,
          file: testInfo.file,
          error: testInfo.errors?.[0]?.message || 'Unknown error',
          trace: testInfo.errors?.[0]?.stack || '',
          domContent: domContent,
        };

        try {
          const analysis = await analyzeFailure(failure, screenshot);

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

export { expect, Page };
