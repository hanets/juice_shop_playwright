/**
 * Type declarations for k6-summary module
 * https://jslib.k6.io/k6-summary/
 */

declare module 'https://jslib.k6.io/k6-summary/0.0.1/index.js' {
  export interface SummaryData {
    root_group: {
      name: string;
      path: string;
      id: string;
      groups: { [key: string]: unknown };
      checks: { [key: string]: unknown };
    };
    metrics: {
      [metricName: string]: {
        type: string;
        contains: string;
        values: {
          [aggregation: string]: number;
        };
        thresholds?: { [key: string]: unknown };
      };
    };
    state: {
      isStdOutTTY: boolean;
      isStdErrTTY: boolean;
      testRunDuration?: number;
    };
  }

  export interface TextSummaryOptions {
    indent?: string;
    enableColors?: boolean;
  }

  export function textSummary(data: SummaryData, options?: TextSummaryOptions): string;
}
