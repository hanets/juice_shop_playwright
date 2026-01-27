#!/usr/bin/env npx ts-node
/**
 * AI Test Analyzer - OpenAI-powered test failure analysis
 * Runs in CI/CD to provide intelligent insights on test failures
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import OpenAI from 'openai';
import * as path from 'path';

dotenv.config();

interface AllureResult {
  uuid: string;
  name: string;
  fullName: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  statusDetails?: {
    message?: string;
    trace?: string;
  };
  labels: Array<{ name: string; value: string }>;
  start: number;
  stop: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  broken: number;
  skipped: number;
  failures: Array<{
    name: string;
    file: string;
    error: string;
    trace: string;
  }>;
}

const RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || './allure-results';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'ai-analysis-report.md';
const MODEL = 'gpt-4o-mini';

/**
 * Load and parse all Allure result files
 */
function loadResults(): AllureResult[] {
  if (!fs.existsSync(RESULTS_DIR)) {
    console.error(`Results directory not found: ${RESULTS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(RESULTS_DIR);
  const resultFiles = files.filter((f) => f.endsWith('-result.json') && !f.includes('container'));

  return resultFiles.map((file) => {
    const content = fs.readFileSync(path.join(RESULTS_DIR, file), 'utf-8');
    return JSON.parse(content) as AllureResult;
  });
}

/**
 * Generate test summary from results
 */
function generateSummary(results: AllureResult[]): TestSummary {
  const summary: TestSummary = {
    total: results.length,
    passed: 0,
    failed: 0,
    broken: 0,
    skipped: 0,
    failures: [],
  };

  for (const result of results) {
    switch (result.status) {
      case 'passed':
        summary.passed++;
        break;
      case 'failed':
        summary.failed++;
        break;
      case 'broken':
        summary.broken++;
        break;
      case 'skipped':
        summary.skipped++;
        break;
    }

    if (result.status === 'failed' || result.status === 'broken') {
      const suiteLabel = result.labels.find((l) => l.name === 'suite');
      summary.failures.push({
        name: result.name,
        file: suiteLabel?.value || result.fullName.split(':')[0],
        error: result.statusDetails?.message || 'Unknown error',
        trace: (result.statusDetails?.trace || '').substring(0, 500),
      });
    }
  }

  return summary;
}

/**
 * Build the prompt for OpenAI analysis
 */
function buildPrompt(summary: TestSummary): string {
  const failureDetails = summary.failures
    .slice(0, 15) // Limit to 15 failures to stay within token limits
    .map(
      (f, i) => `
### Failure ${i + 1}: ${f.name}
- **File**: ${f.file}
- **Error**: ${f.error.split('\n')[0]}
- **Trace snippet**: ${f.trace.substring(0, 300)}...
`,
    )
    .join('\n');

  return `You are an expert test automation engineer analyzing Playwright test failures.

## Test Run Summary
- Total tests: ${summary.total}
- Passed: ${summary.passed} (${Math.round((summary.passed / summary.total) * 100)}%)
- Failed: ${summary.failed}
- Broken: ${summary.broken}
- Skipped: ${summary.skipped}

## Failed Tests (${summary.failures.length} total, showing first 15)
${failureDetails}

## Your Task
Analyze these test failures and provide:

1. **Executive Summary** (2-3 sentences)
   - Overall health assessment
   - Most critical issues to address

2. **Failure Categories**
   - Group failures by root cause (locator issues, timeouts, assertion failures, etc.)
   - Identify any patterns

3. **Root Cause Analysis**
   - For each category, explain the likely cause
   - Reference specific test names

4. **Recommended Fixes**
   - Prioritized list of actions
   - Specific code-level suggestions where possible

5. **Flakiness Assessment**
   - Identify tests that might be flaky
   - Suggest stability improvements

Keep your response concise and actionable. Use Markdown formatting.`;
}

/**
 * Call OpenAI API for analysis
 */
async function analyzeWithAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return '## Error\n\nOpenAI API key not configured. Please set OPENAI_API_KEY secret.';
  }

  const openai = new OpenAI({ apiKey });

  try {
    console.log('Calling OpenAI API for analysis...');

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert test automation engineer. Provide concise, actionable analysis.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'No analysis generated.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return `## Error\n\nFailed to get AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Generate the final Markdown report
 */
function generateReport(summary: TestSummary, aiAnalysis: string): string {
  const timestamp = new Date().toISOString();
  const passRate = Math.round((summary.passed / summary.total) * 100);

  return `# 🤖 AI Test Analysis Report

> Generated: ${timestamp}
> Model: ${MODEL}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.total} |
| ✅ Passed | ${summary.passed} (${passRate}%) |
| ❌ Failed | ${summary.failed} |
| 💔 Broken | ${summary.broken} |
| ⏭️ Skipped | ${summary.skipped} |

---

${aiAnalysis}

---

*This report was generated by AI. Please verify suggestions before implementing.*
`;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('🔍 AI Test Analyzer starting...\n');

  // Load results
  const results = loadResults();
  if (results.length === 0) {
    console.log('No test results found.');
    fs.writeFileSync(OUTPUT_FILE, '# AI Test Analysis\n\nNo test results found to analyze.');
    return;
  }

  console.log(`Found ${results.length} test results`);

  // Generate summary
  const summary = generateSummary(results);
  console.log(
    `Summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.broken} broken\n`,
  );

  // Check if there are failures to analyze
  if (summary.failures.length === 0) {
    const report = `# 🤖 AI Test Analysis Report

## ✅ All Tests Passed!

- Total tests: ${summary.total}
- Pass rate: 100%

No failures to analyze. Great job! 🎉
`;
    fs.writeFileSync(OUTPUT_FILE, report);
    console.log('All tests passed! No analysis needed.');
    return;
  }

  // Build prompt and get AI analysis
  const prompt = buildPrompt(summary);
  const aiAnalysis = await analyzeWithAI(prompt);

  // Generate and save report
  const report = generateReport(summary, aiAnalysis);
  fs.writeFileSync(OUTPUT_FILE, report);

  console.log(`\n✅ Report saved to: ${OUTPUT_FILE}`);
  console.log('\n--- Report Preview ---\n');
  console.log(report.substring(0, 1500) + '\n...[truncated]');
}

main().catch(console.error);
