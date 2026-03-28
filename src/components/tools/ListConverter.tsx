'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_LIST_CONVERTER_OPTIONS,
  LIST_CONVERTER_EXAMPLES,
  LIST_CONVERTER_OPTIONS,
  type ListConverterOptions,
} from '@/config/list-converter-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  convertListFormat,
  getLanguageForFormat,
  type ConversionResult,
} from '@/libs/list-converter';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

interface ListConverterProps {
  className?: string;
  instanceId: string;
}

export function ListConverter({ className, instanceId }: ListConverterProps) {
  const { toolState, updateToolState } = useToolState('list-converter', instanceId);

  // State
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [options, setOptions] = useState<ListConverterOptions>(DEFAULT_LIST_CONVERTER_OPTIONS);
  const [error, setError] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [conversionStats, setConversionStats] = useState<ConversionResult['stats'] | null>(null);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.options) setOptions(toolState.options as ListConverterOptions);
      if (toolState.error) setError(toolState.error as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        input,
        output,
        options,
        error,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, output, options, error, isHydrated]);

  // Reset state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setInput('');
      setOutput('');
      setOptions(DEFAULT_LIST_CONVERTER_OPTIONS);
      setError('');
      setConversionStats(null);
    }

  }, [toolState, isHydrated]);

  // Auto-convert when input or options change
  useEffect(() => {
    if (isHydrated && input.trim()) {
      handleConvert();
    } else {
      setOutput('');
      setError('');
      setConversionStats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, options, isHydrated]);

  // Handlers
  const handleConvert = () => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      setConversionStats(null);
      return;
    }

    setError('');
    const result = convertListFormat(input, options.inputFormat, options.outputFormat, {
      preserveTypes: options.preserveTypes,
      removeEmpty: options.removeEmpty,
      removeDuplicates: options.removeDuplicates,
      sortOrder: options.sortOrder,
    });

    if (result.success) {
      setOutput(result.output);
      setConversionStats(result.stats);
    } else {
      setOutput('');
      setError(result.error || 'Conversion failed');
      setConversionStats(result.stats);
    }
  };

  const handleLoadExample = (format: typeof options.inputFormat) => {
    setInput(LIST_CONVERTER_EXAMPLES[format]);
    setOptions(prev => ({ ...prev, inputFormat: format }));
  };

  const handleSwapFormats = () => {
    setOptions(prev => ({
      ...prev,
      inputFormat: prev.outputFormat,
      outputFormat: prev.inputFormat,
    }));
    // Swap input and output
    const tempInput = input;
    setInput(output);
    setOutput(tempInput);
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  const getItemCount = (text: string): number => {
    if (!text.trim()) return 0;
    try {
      // Use a simple split approach for quick count
      const format = options.inputFormat;
      switch (format) {
        case 'line-by-line':
          return text.split('\n').filter(line => line.trim().length > 0).length;
        case 'comma-separated':
          return text.split(',').filter(item => item.trim().length > 0).length;
        case 'space-separated':
          return text.split(/\s+/).filter(item => item.trim().length > 0).length;
        case 'pipe-separated':
          return text.split('|').filter(item => item.trim().length > 0).length;
        case 'tab-separated':
          return text.split('\t').filter(item => item.trim().length > 0).length;
        default:
          return 0;
      }
    } catch {
      return 0;
    }
  };

  const inputLanguage = useMemo(() => getLanguageForFormat(options.inputFormat), [options.inputFormat]);
  const outputLanguage = useMemo(() => getLanguageForFormat(options.outputFormat), [options.outputFormat]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          List Format Converter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Convert lists between different formats: line-by-line, comma-separated, JSON array, Python list, and more
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Format Selectors */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={options.inputFormat}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, inputFormat: value as typeof options.inputFormat }))
                }
              >
                <SelectTrigger label="Input Format:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIST_CONVERTER_OPTIONS.formats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapFormats}
                className="h-8 px-3 text-xs"
                title="Swap input and output formats"
              >
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                Swap
              </Button>

              <Select
                value={options.outputFormat}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, outputFormat: value as typeof options.outputFormat }))
                }
              >
                <SelectTrigger label="Output Format:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIST_CONVERTER_OPTIONS.formats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conversion Options */}
            <div className="flex items-center gap-4 flex-wrap min-h-[40px]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Preserve Types:</span>
                <Switch
                  checked={options.preserveTypes}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, preserveTypes: checked }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Remove Empty:</span>
                <Switch
                  checked={options.removeEmpty}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, removeEmpty: checked }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Remove Duplicates:</span>
                <Switch
                  checked={options.removeDuplicates}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, removeDuplicates: checked }))
                  }
                />
              </div>

              <Select
                value={options.sortOrder}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, sortOrder: value as 'none' | 'asc' | 'desc' }))
                }
              >
                <SelectTrigger label="Sort Order:" className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Side-by-side Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title={`Input (${LIST_CONVERTER_OPTIONS.formats.find(f => f.value === options.inputFormat)?.label})`}
              value={input}
              onChange={setInput}
              language={inputLanguage}
              height="500px"
              theme={theme}
              wrapText={inputWrapText}
              onWrapTextChange={setInputWrapText}
              placeholder="Enter your list here..."
              showCopyButton={true}
              showClearButton={true}
              headerActions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      Load Example
                      <ChevronDownIcon className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                    {LIST_CONVERTER_OPTIONS.formats.map((format) => (
                      <DropdownMenuItem
                        key={format.value}
                        onClick={() => handleLoadExample(format.value as typeof options.inputFormat)}
                      >
                        {format.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <>
                  {conversionStats && (
                    <>
                      <span>{conversionStats.inputItems} items</span>
                      <span>{getCharacterCount(input)} chars</span>
                    </>
                  )}
                </>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title={`Output (${LIST_CONVERTER_OPTIONS.formats.find(f => f.value === options.outputFormat)?.label})`}
              value={output}
              readOnly={true}
              language={outputLanguage}
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              footerLeftContent={
                output && conversionStats && (
                  <>
                    <span>{conversionStats.outputItems} items</span>
                    <span>{getCharacterCount(output)} chars</span>
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

          {/* Statistics */}
          {conversionStats && !error && (
            <div className="flex items-center justify-center gap-6 py-3 px-4 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[10px] flex-wrap text-sm text-muted-foreground">
              <span>
                Input: <span className="font-medium">{conversionStats.inputItems}</span> items,{' '}
                <span className="font-medium">{conversionStats.inputSize}</span> chars
              </span>
              <span>
                Output: <span className="font-medium">{conversionStats.outputItems}</span> items,{' '}
                <span className="font-medium">{conversionStats.outputSize}</span> chars
              </span>
              {conversionStats.inputSize > 0 && (
                <span>
                  Size change:{' '}
                  <span
                    className={cn(
                      'font-medium',
                      conversionStats.outputSize > conversionStats.inputSize
                        ? 'text-red-600 dark:text-red-400'
                        : conversionStats.outputSize < conversionStats.inputSize
                        ? 'text-green-600 dark:text-green-400'
                        : ''
                    )}
                  >
                    {((conversionStats.outputSize - conversionStats.inputSize) / conversionStats.inputSize) * 100 > 0
                      ? '+'
                      : ''}
                    {(((conversionStats.outputSize - conversionStats.inputSize) / conversionStats.inputSize) * 100).toFixed(1)}%
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

