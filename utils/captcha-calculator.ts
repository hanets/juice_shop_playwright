/**
 * Utility for calculating CAPTCHA challenge expressions
 * Supports basic arithmetic operations: +, -, *
 */

/**
 * Evaluates a mathematical expression string containing numbers and basic operators (+, -, *)
 * @param expression - The mathematical expression as a string (e.g., "3+4-10", "5*2+1")
 * @returns The calculated result
 * @throws Error if the expression is invalid or contains unsupported operations
 */
export function calculateCaptchaExpression(expression: string): number {
  if (!expression || typeof expression !== 'string') {
    throw new Error('Invalid expression: must be a non-empty string');
  }

  // Remove all whitespace
  const cleanExpression = expression.replace(/\s+/g, '');

  // Validate that expression only contains numbers and allowed operators
  const validPattern = /^-?\d+([+\-*]\d+)*$/;
  if (!validPattern.test(cleanExpression)) {
    throw new Error(`Invalid expression format: ${expression}`);
  }

  // Use JavaScript's eval for proper operator precedence
  // This is safe because we've validated the expression format above
  try {
    return eval(cleanExpression);
  } catch (error) {
    throw new Error(`Failed to evaluate expression: ${expression}`, { cause: error });
  }
}

/**
 * Extracts and calculates the result from a CAPTCHA question text
 * @param questionText - The full CAPTCHA question text (e.g., "What is 3+4-10 ?")
 * @returns The calculated result, or null if no valid expression is found
 */
export function extractAndCalculateCaptcha(questionText: string): number {
  if (!questionText) {
    throw new Error('Question text cannot be empty');
  }

  // Look for mathematical expressions in the text
  // Matches patterns like "3+4-10", "5*2+1", etc.
  const expressionMatch = questionText.match(/(-?\d+(?:[+\-*]\d+)+)/);

  if (!expressionMatch) {
    throw new Error('No valid mathematical expression found in the question text');
  }

  return calculateCaptchaExpression(expressionMatch[1]);
}
