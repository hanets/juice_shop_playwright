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

  // Split into tokens (numbers and operators)
  const tokens = cleanExpression.match(/[+\-*]|\d+/g);
  if (!tokens || tokens.length === 0) {
    throw new Error(`Failed to parse expression: ${expression}`);
  }

  // Handle negative numbers at the start
  let i = 0;
  let result = 0;

  // Parse first number (could be negative)
  if (tokens[0] === '-') {
    if (tokens.length < 2) {
      throw new Error(`Invalid expression: ${expression}`);
    }
    result = -parseInt(tokens[1], 10);
    i = 2;
  } else if (tokens[0] === '+') {
    if (tokens.length < 2) {
      throw new Error(`Invalid expression: ${expression}`);
    }
    result = parseInt(tokens[1], 10);
    i = 2;
  } else {
    result = parseInt(tokens[0], 10);
    i = 1;
  }

  // Process remaining tokens in pairs (operator, number)
  while (i < tokens.length) {
    if (i + 1 >= tokens.length) {
      throw new Error(`Invalid expression: operator without operand in ${expression}`);
    }

    const operator = tokens[i];
    const operand = parseInt(tokens[i + 1], 10);

    if (isNaN(operand)) {
      throw new Error(`Invalid operand: ${tokens[i + 1]} in expression ${expression}`);
    }

    switch (operator) {
      case '+':
        result += operand;
        break;
      case '-':
        result -= operand;
        break;
      case '*':
        result *= operand;
        break;
      default:
        throw new Error(`Unsupported operator: ${operator} in expression ${expression}`);
    }

    i += 2;
  }

  return result;
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
