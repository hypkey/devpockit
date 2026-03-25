/**
 * JSON Formatter Logic
 * Pure functions for JSON formatting, validation, and manipulation
 */

export interface JsonFormatOptions {
  format: 'beautify' | 'minify';
  indentSize: number;
  sortKeys: 'none' | 'asc' | 'desc';
}

export interface JsonFormatResult {
  formatted: string;
  isValid: boolean;
  error?: string;
  originalSize: number;
  formattedSize: number;
  compressionRatio?: number;
}

/**
 * Format JSON based on options
 */
export function formatJson(jsonString: string, options: JsonFormatOptions): JsonFormatResult {
  const originalSize = jsonString.length;

  try {
    // Parse JSON to validate
    const parsed = JSON.parse(jsonString);

    let formatted: string;

    if (options.format === 'minify') {
      formatted = JSON.stringify(parsed);
    } else {
      // Beautify with custom indentation
      const indent = ' '.repeat(options.indentSize);
      formatted = JSON.stringify(parsed, null, indent);
    }

    // Sort keys if requested
    if (options.sortKeys !== 'none' && options.format === 'beautify') {
      const sortedParsed = sortObjectKeys(parsed, options.sortKeys);
      const indent = ' '.repeat(options.indentSize);
      formatted = JSON.stringify(sortedParsed, null, indent);
    }

    const formattedSize = formatted.length;
    const compressionRatio = originalSize > 0 ? ((originalSize - formattedSize) / originalSize) * 100 : 0;

    return {
      formatted,
      isValid: true,
      originalSize,
      formattedSize,
      compressionRatio: options.format === 'minify' ? compressionRatio : undefined
    };

  } catch (error) {
    return {
      formatted: jsonString,
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      originalSize,
      formattedSize: originalSize
    };
  }
}

/**
 * Validate JSON string
 */
export function validateJson(jsonString: string): { isValid: boolean; error?: string } {
  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Sort object keys recursively
 */
export function sortObjectKeys(obj: any, sortOrder: 'asc' | 'desc'): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item, sortOrder));
  }

  const sorted: any = {};
  const keys = Object.keys(obj);

  if (sortOrder === 'asc') {
    keys.sort();
  } else {
    keys.sort().reverse();
  }

  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key], sortOrder);
  }

  return sorted;
}

/**
 * Get JSON statistics
 */
export function getJsonStats(jsonString: string): {
  size: number;
  lines: number;
  depth: number;
  keys: number;
} {
  const size = jsonString.length;
  const lines = jsonString.split('\n').length;

  try {
    const parsed = JSON.parse(jsonString);
    const { depth, keys } = analyzeJsonStructure(parsed);

    return { size, lines, depth, keys };
  } catch {
    return { size, lines, depth: 0, keys: 0 };
  }
}

/**
 * Analyze JSON structure for statistics
 */
function analyzeJsonStructure(obj: any, currentDepth = 0): { depth: number; keys: number } {
  if (obj === null || typeof obj !== 'object') {
    return { depth: currentDepth, keys: 0 };
  }

  if (Array.isArray(obj)) {
    let maxDepth = currentDepth;
    let totalKeys = 0;

    for (const item of obj) {
      const { depth, keys } = analyzeJsonStructure(item, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
      totalKeys += keys;
    }

    return { depth: maxDepth, keys: totalKeys };
  }

  let maxDepth = currentDepth;
  let totalKeys = Object.keys(obj).length;

  for (const value of Object.values(obj)) {
    const { depth, keys } = analyzeJsonStructure(value, currentDepth + 1);
    maxDepth = Math.max(maxDepth, depth);
    totalKeys += keys;
  }

  return { depth: maxDepth, keys: totalKeys };
}

/**
 * Format JSON with syntax highlighting (basic)
 */
export function formatJsonWithHighlighting(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    const formatted = JSON.stringify(parsed, null, 2);

    // Basic syntax highlighting using simple replacements
    return formatted
      .replace(/(".*?")\s*:/g, '"$1":') // Keys
      .replace(/:\s*(".*?")/g, ': "$1"') // String values
      .replace(/:\s*(true|false)/g, ': $1') // Boolean values
      .replace(/:\s*(null)/g, ': $1') // Null values
      .replace(/:\s*(\d+)/g, ': $1'); // Numbers
  } catch {
    return jsonString;
  }
}
