'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadFileButton } from '@/components/ui/load-file-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_JSON_OPTIONS, JSON_EXAMPLES, JSON_FORMAT_OPTIONS } from '@/config/json-formatter-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { formatJson, getJsonStats, type JsonFormatOptions, type JsonFormatResult } from '@/libs/json-formatter';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface JsonFormatterProps {
  className?: string;
  instanceId: string;
}

export function JsonFormatter({ className, instanceId }: JsonFormatterProps) {
  const { toolState, updateToolState } = useToolState('json-formatter', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<JsonFormatOptions>(DEFAULT_JSON_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{ size: number; lines: number; depth: number; keys: number } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as JsonFormatOptions);
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.stats) setStats(toolState.stats as { size: number; lines: number; depth: number; keys: number });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state whenever local state changes
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        input,
        output,
        error,
        stats: stats || undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, input, output, error, stats, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_JSON_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
      setStats(null);
    }
  }, [toolState, isHydrated]);

  const handleFormat = async () => {
    if (!input.trim()) {
      setError('Please enter JSON to format');
      return;
    }

    setIsFormatting(true);
    setError('');

    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const result: JsonFormatResult = formatJson(input, options);

      if (result.isValid) {
        setOutput(result.formatted);
        setStats(getJsonStats(result.formatted));
      } else {
        setError(result.error || 'Invalid JSON');
        setOutput('');
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to format JSON');
      setOutput('');
      setStats(null);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleLoadExample = (type: 'valid' | 'minified' | 'invalid') => {
    setInput(JSON_EXAMPLES[type]);
    setError('');
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          JSON Formatter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Format, minify, and validate JSON with syntax highlighting and statistics
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Format Type Select */}
              <Select
                value={options.format}
                onValueChange={(value: 'beautify' | 'minify') =>
                  setOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger label="Format Type:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JSON_FORMAT_OPTIONS.formats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Indent Size (only for beautify) */}
              {options.format === 'beautify' && (
                <Select
                  value={options.indentSize.toString()}
                  onValueChange={(value) =>
                    setOptions(prev => ({ ...prev, indentSize: parseInt(value) }))
                  }
                >
                  <SelectTrigger label="Indent Size:" className="min-w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JSON_FORMAT_OPTIONS.indentSizes.map((indent) => (
                      <SelectItem key={indent.value} value={indent.value.toString()}>
                        {indent.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort Keys (only for beautify) */}
              {options.format === 'beautify' && (
                <Select
                  value={options.sortKeys}
                  onValueChange={(value: 'none' | 'asc' | 'desc') =>
                    setOptions(prev => ({ ...prev, sortKeys: value }))
                  }
                >
                  <SelectTrigger label="Key Sorting:" className="min-w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JSON_FORMAT_OPTIONS.sortKeys.map((sort) => (
                      <SelectItem key={sort.value} value={sort.value}>
                        {sort.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title="JSON Input"
              value={input}
              onChange={setInput}
              language="json"
              height="500px"
              theme={theme}
              wrapText={inputWrapText}
              onWrapTextChange={setInputWrapText}
              showCopyButton={false}
              showClearButton={true}
              headerActions={
                <>
                  <LoadFileButton
                    accept=".json,.json5,*/*"
                    onFileLoad={(content) => {
                      setInput(content);
                      setError('');
                    }}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        Load Examples
                        <ChevronDownIcon className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleLoadExample('valid')}>
                        Load Valid Example
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLoadExample('minified')}>
                        Load Minified Example
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLoadExample('invalid')}>
                        Load Invalid Example
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
              footerLeftContent={
                <span>{getCharacterCount(input)} characters</span>
              }
              footerRightContent={
                <Button
                  onClick={handleFormat}
                  disabled={!input.trim() || isFormatting}
                  variant="default"
                  size="sm"
                  className="h-8 px-4"
                >
                  {isFormatting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Formatting...
                    </>
                  ) : (
                    'Format'
                  )}
                </Button>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title="Formatted JSON"
              value={output}
              language="json"
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              readOnly={true}
              footerLeftContent={
                output && (
                  <>
                    <span>{getCharacterCount(output)} characters</span>
                    <span>{getLineCount(output)} lines</span>
                    {stats && <span>{stats.keys} total keys</span>}
                  </>
                )
              }
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
