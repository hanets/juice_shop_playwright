/* eslint-disable no-console */

import OpenAI from 'openai';

import { AppConfig } from '../config/AppConfig';
import { VectorStore } from './vector-store';

const MODEL = 'gpt-4o-mini';
let vectorStore: VectorStore | null = null;

const shouldEnableVectorStore = AppConfig.ai.enableVectorStore;

if (shouldEnableVectorStore) {
  try {
    vectorStore = new VectorStore();
  } catch (e) {
    console.warn(
      'VectorStore initialization skipped (likely missing API key):',
      e instanceof Error ? e.message : e,
    );
  }
} else {
  console.log('VectorStore is disabled via ENABLE_VECTOR_STORE flag.');
}

export interface FailureDetail {
  name: string;
  file: string;
  error: string;
  trace: string;
  screenshotBuffer?: Buffer;
  domContent?: string;
}

export interface FailureDetailSummary {
  name: string;
  file: string;
  error: string;
  trace: string;
  analysisResult?: string;
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  broken: number;
  skipped: number;
  failures: FailureDetailSummary[];
}

/**
 * Checks for common failure patterns to avoid LLM calls
 */
function checkPreAnalysisRules(failure: FailureDetail): string | null {
  const error = (failure.error + ' ' + failure.trace).toLowerCase();

  // 1. Timeouts
  if (error.includes('page.goto: net::err_connection_refused')) {
    return `1. **Category**: Environment
2. **Verdict**: Test Issue (Infrastructure)
3. **Root Cause**: Application is not running or not accessible.
4. **New Locator**: N/A
5. **Fix**: Check application status or restart the application.
6. **Confidence Score**: 100% (Rule-based)`;
  }

  if (
    error.includes('timeout 30000ms exceeded') ||
    error.includes('timed out') ||
    (error.includes('exceeded') && error.includes('timeout'))
  ) {
    if (error.includes('waiting for locator')) {
      return null;
    }
    return `1. **Category**: Environment
2. **Verdict**: Test Issue (Timeout)
3. **Root Cause**: The operation timed out, likely due to slow environment or missing element.
4. **New Locator**: N/A
5. **Fix**: Check environment stability or increase timeout.
6. **Confidence Score**: 100% (Rule-based)`;
  }

  // 2. HTTP 5xx Errors
  if (
    error.includes('500 internal server error') ||
    error.includes('502 bad gateway') ||
    error.includes('503 service unavailable') ||
    error.includes('504 gateway timeout')
  ) {
    return `1. **Category**: Bug
2. **Verdict**: Bug (Server Error)
3. **Root Cause**: The server returned a 5xx status code.
4. **New Locator**: N/A
5. **Fix**: Investigate backend logs for the specified service.
6. **Confidence Score**: 100% (Rule-based)`;
  }

  // 3. Infrastructure / Network
  if (
    error.includes('econnrefused') ||
    error.includes('etimedout') ||
    error.includes('enotfound') ||
    error.includes('network error')
  ) {
    return `1. **Category**: Environment
2. **Verdict**: Test Issue (Infrastructure)
3. **Root Cause**: Network or infrastructure failure (connection refused/timeout).
4. **New Locator**: N/A
5. **Fix**: Verify backend services are up and reachable.
6. **Confidence Score**: 100% (Rule-based)`;
  }

  // 4. Visual Regression / Snapshots
  if (error.includes("snapshot doesn't exist") || error.includes('writing actual')) {
    return `1. **Category**: Snapshot
2. **Verdict**: Test Issue (Missing Snapshot)
3. **Root Cause**: A snapshot file for visual regression is missing from the repository.
4. **New Locator**: N/A
5. **Fix**: Run the test with \`--update-snapshots\` to generate the baseline image if this is expected.
6. **Confidence Score**: 100% (Rule-based)`;
  }

  return null;
}

/**
 * Call OpenAI API for analysis
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = AppConfig.ai.openApiKey;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return '## Error\n\nOpenAI API key not configured.';
  }

  const openai = new OpenAI({ apiKey });

  try {
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: 'text', text: userPrompt },
    ];

    // if (imageBuffer) {
    //   content.push({
    //     type: 'image_url',
    //     image_url: {
    //       url: `data:image/png;base64,${imageBuffer.toString('base64')}`,
    //     },
    //   });
    // }

    console.log(systemPrompt);
    console.log(content);
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
      ],
      max_completion_tokens: 2000,
      temperature: 0.3,
    });

    const endTime = Date.now();
    console.log(`AI Analysis generated in ${endTime - startTime}ms`);
    console.log(response.usage);

    console.log(response.choices[0]?.message?.content);
    return response.choices[0]?.message?.content || 'No analysis generated.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return `## Error\n\nFailed to get AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Analyzes a single test failure with context
 */
export async function analyzeFailure(failure: FailureDetail): Promise<string> {
  if (!AppConfig.ai.enableAiResult) {
    console.log(`AI Analysis skipped for: ${failure.name} (ENABLE_AI_RESULT != true)`);
    return 'AI Analysis disabled via environment variable.';
  }

  // Check pre-analysis rules first
  const preAnalysis = checkPreAnalysisRules(failure);
  if (preAnalysis) {
    console.log(`Pre-analysis rule matched for: ${failure.name}`);
    return preAnalysis;
  }

  const systemPrompt =
    'You are an expert test automation engineer specializing in TypeScript and Playwright. ' +
    'Analyze the provided test failure and suggest a fix when it is a test issue or locator problem. Be extremely concise. ' +
    'Always use Playwright-best-practice locators (e.g., getByRole, getByText) for suggestions. ' +
    'If the failure is a real application bug (Verdict is Bug, e.g., an assertion failed because of wrong data or 500 error), do NOT propose a new locator or a test fix; instead, set "New Locator" and "Fix" to "N/A". ' +
    'Note that the error message might contain multiple failures (separated by ---) if soft assertions were used.';

  let historicalContext = '';
  if (vectorStore) {
    try {
      const similar = await vectorStore.findSimilar(failure.error);
      if (similar.length > 0) {
        historicalContext =
          '\n### Historical Similar Failures & Fixes:\n' +
          similar
            .map(
              (s, i) =>
                `${i + 1}. **Error**: ${s.error.substring(0, 100)}\n   **Past Fix**: ${s.analysis}`,
            )
            .join('\n');
      }
    } catch (e) {
      console.error('Failed to fetch historical context:', e);
    }
  }

  const userPrompt = `
### Test Failure: ${failure.name}
- **File**: ${failure.file}
- **Error**: ${failure.error}
- **Trace Snippet**: 
\`\`\`
${failure.trace.substring(0, 1000)}
\`\`\`

${failure.domContent ? `### DOM Content (Snippet):\n\`\`\`html\n${failure.domContent.substring(0, 2000)}\n\`\`\`` : ''}

${historicalContext}

Provide a concise analysis in this format:
1. **Category**: [Environment | Flaky | Bug | Locator | Visual | Snapshot] (Visual = mismatch, Snapshot = missing)
2. **Verdict**: [Bug or Test Issue]
3. **Root Cause**: [1 sentence explanation]
4. **New Locator**: [If this is a test or locator issue, propose a Playwright locator; if it is a real application bug or snapshot issue, write "N/A"]
5. **Fix**: [If this is a test issue (not a real application bug), describe the immediate code fix or action; if it is a real application bug, write "N/A"]
6. **Confidence Score**: [0-100%]
`;

  const analysis = await callAI(systemPrompt, userPrompt);

  // Save successful analysis to vector store
  if (vectorStore && !analysis.includes('Error')) {
    vectorStore
      .addFailure(failure.error, analysis)
      .catch((e) => console.error('Failed to save to vector store:', e));
  }

  return analysis;
}

/**
 * Analyzes the entire test run
 */
export async function analyzeSummary(summary: TestRunSummary): Promise<string> {
  if (!AppConfig.ai.enableAiResult) {
    console.log(`AI Analysis skipped (ENABLE_AI_RESULT != true)`);
    return '';
  }

  const failureDetails = summary.failures.filter((f) => f.analysisResult)
    .slice(0, 10)
    .map(
      (f, i) => `
#### ${i + 1}. ${f.name}
- **Error**: ${f.error.split('\n')[0]}
- **File**: ${f.file}
- **Analyzed result**: ${f.analysisResult}
`,
    )
    .join('\n');

  const systemPrompt =
    'You are an expert test automation engineer. Provide a concise, high-level executive summary of the test run.';

  const userPrompt = `
## Test Run Summary
- Total: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Flaky: ${summary.flaky}
- Broken: ${summary.broken}
- Skipped: ${summary.skipped}

### Top Failures
${failureDetails}

Please provide:
1. **Executive Summary**: Overall status assessment (2-3 sentences).
2. **Failure Patterns**: Group failures by root cause if possible.
3. **Action Plan**: Top 3 priorities for the team.
`;

  return await callAI(systemPrompt, userPrompt);
}

// Keep the CLI functionality for backward compatibility if needed,
// though we are moving towards integrated reporting.
if (require.main === module) {
  console.log('Use this module as an import for integrated reporting.');
}
