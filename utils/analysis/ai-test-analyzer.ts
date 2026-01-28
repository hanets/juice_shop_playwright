import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const MODEL = 'gpt-4o-mini';

export interface FailureDetail {
  name: string;
  file: string;
  error: string;
  trace: string;
  screenshotPath?: string;
  domContent?: string;
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  broken: number;
  skipped: number;
  failures: FailureDetail[];
}

/**
 * Call OpenAI API for analysis
 */
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  imageBuffer?: Buffer,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return '## Error\n\nOpenAI API key not configured.';
  }

  const openai = new OpenAI({ apiKey });

  try {
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: 'text', text: userPrompt },
    ];

    if (imageBuffer) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${imageBuffer.toString('base64')}`,
        },
      });
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
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
 * Analyzes a single test failure with context
 */
export async function analyzeFailure(
  failure: FailureDetail,
  screenshotBuffer?: Buffer,
): Promise<string> {
  const systemPrompt =
    'You are an expert test automation engineer specializing in Playwright. Analyze the provided test failure and suggest a fix.';

  const userPrompt = `
### Test Failure: ${failure.name}
- **File**: ${failure.file}
- **Error**: ${failure.error}
- **Trace Snippet**: 
\`\`\`
${failure.trace.substring(0, 1000)}
\`\`\`

${failure.domContent ? `### DOM Content (Snippet):\n\`\`\`html\n${failure.domContent.substring(0, 2000)}\n\`\`\`` : ''}

Analyze the error and the provided context (including screenshot if available). 
1. What went wrong?
2. Is it a bug in the application or a flaky/incorrect test?
3. Provide a specific code fix or recommendation.
`;

  return await callAI(systemPrompt, userPrompt, screenshotBuffer);
}

/**
 * Analyzes the entire test run
 */
export async function analyzeSummary(summary: TestRunSummary): Promise<string> {
  const failureDetails = summary.failures
    .slice(0, 10)
    .map(
      (f, i) => `
#### ${i + 1}. ${f.name}
- **Error**: ${f.error.split('\n')[0]}
- **File**: ${f.file}
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
