/**
 * Monaco Editor Utilities
 * Helper functions for Monaco Editor integration
 */

/**
 * Monaco Editor language IDs supported by Monaco
 */
export type MonacoLanguageId = 'json' | 'xml' | 'javascript' | 'typescript' | 'plaintext' | 'html' | 'css' | 'yaml' | 'python' | 'java' | 'csharp' | 'cpp' | 'go' | 'rust' | 'sql' | 'markdown' | 'shell';

/**
 * Map language string to Monaco language ID
 * @param language - Language string (e.g., 'json', 'xml', 'javascript', 'js', 'plaintext')
 * @returns Monaco language ID
 */
export function getMonacoLanguageId(language?: string): MonacoLanguageId {
  if (!language) {
    return 'plaintext';
  }

  const normalized = language.toLowerCase().trim();

  // Direct mappings
  switch (normalized) {
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'javascript':
    case 'js':
      return 'javascript';
    case 'typescript':
    case 'ts':
      return 'typescript';
    case 'plaintext':
    case 'text':
    case 'txt':
      return 'plaintext';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'python':
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'csharp':
    case 'cs':
    case 'c#':
      return 'csharp';
    case 'cpp':
    case 'c++':
      return 'cpp';
    case 'go':
    case 'golang':
      return 'go';
    case 'rust':
    case 'rs':
      return 'rust';
    case 'sql':
      return 'sql';
    case 'markdown':
    case 'md':
      return 'markdown';
    case 'shell':
    case 'bash':
    case 'sh':
      return 'shell';
    default:
      // Default to plaintext for unknown languages
      return 'plaintext';
  }
}

/**
 * Check if Monaco Editor is loaded and available
 * @returns true if Monaco is available, false otherwise
 */
export function isMonacoLoaded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Check if Monaco is available in global scope
    return typeof (window as any).monaco !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get Monaco instance from window or module
 * @returns Monaco instance or null if not available
 */
export function getMonacoInstance(): typeof import('monaco-editor') | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Try to get Monaco from window (loaded via @monaco-editor/react)
    if (typeof (window as any).monaco !== 'undefined') {
      return (window as any).monaco;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate if a language is supported by Monaco
 * @param language - Language string to validate
 * @returns true if language is supported, false otherwise
 */
export function isLanguageSupported(language: string): boolean {
  const monacoLanguageId = getMonacoLanguageId(language);
  return monacoLanguageId !== 'plaintext' || language.toLowerCase() === 'plaintext';
}

/**
 * Get display name for a language
 * @param language - Language string
 * @returns Human-readable language name
 */
export function getLanguageDisplayName(language?: string): string {
  if (!language) {
    return 'Plain text';
  }

  const normalized = language.toLowerCase().trim();

  const displayNames: Record<string, string> = {
    json: 'JSON',
    xml: 'XML',
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    plaintext: 'Plain text',
    text: 'Plain text',
    txt: 'Plain text',
    html: 'HTML',
    css: 'CSS',
    yaml: 'YAML',
    yml: 'YAML',
  };

  return displayNames[normalized] || language.toUpperCase();
}

/**
 * Monaco Editor options type helper
 * Common options used across the application
 */
export interface MonacoEditorOptions {
  language?: string;
  theme?: string;
  readOnly?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  lineNumbersMinChars?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap?: { enabled: boolean };
  fontSize?: number;
  fontFamily?: string;
  tabSize?: number;
  insertSpaces?: boolean;
  automaticLayout?: boolean;
  scrollBeyondLastLine?: boolean;
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  quickSuggestions?: boolean | { other: boolean; comments: boolean; strings: boolean };
  suggestOnTriggerCharacters?: boolean;
  acceptSuggestionOnCommitCharacter?: boolean;
  tabCompletion?: 'on' | 'off' | 'onlySnippets';
  scrollbar?: {
    alwaysConsumeMouseWheel?: boolean;
  };
}

/**
 * Convert CodeEditor language to Monaco options
 * @param language - Language string from CodeEditor
 * @param showLineNumbers - Whether to show line numbers
 * @param wrapText - Whether to wrap text
 * @param readOnly - Whether editor is read-only
 * @returns Monaco editor options
 */
export function createMonacoOptions(
  language?: string,
  showLineNumbers: boolean = true,
  wrapText: boolean = true,
  readOnly: boolean = false
): MonacoEditorOptions {
  return {
    language: getMonacoLanguageId(language),
    readOnly,
    lineNumbers: showLineNumbers ? 'on' : 'off',
    lineNumbersMinChars: 2, // Reduce line number gutter width (default is usually 5)
    wordWrap: wrapText ? 'on' : 'off',
    minimap: { enabled: false }, // Disable minimap for cleaner UI
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    tabSize: 2,
    insertSpaces: true,
    automaticLayout: true, // Auto-resize with container
    scrollBeyondLastLine: false,
    formatOnPaste: false,
    formatOnType: false,
    quickSuggestions: false, // Disable auto-complete by default
    suggestOnTriggerCharacters: false, // Disable suggestions on trigger characters by default
    acceptSuggestionOnCommitCharacter: false, // Disable auto-accept suggestions by default
    tabCompletion: 'off', // Disable tab completion by default
    renderValidationDecorations: 'off', // No error/warning squiggles needed in developer tools
    scrollbar: {
      alwaysConsumeMouseWheel: false, // Allow page scrolling when editor reaches end
    },
  };
}

