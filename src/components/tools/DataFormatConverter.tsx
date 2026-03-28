'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DEFAULT_MULTI_FORMAT_OPTIONS,
  FORMAT_OPTIONS,
  INDENT_OPTIONS,
  INPUT_FORMAT_OPTIONS,
  MULTI_FORMAT_EXAMPLES,
  PYTHON_QUOTE_STYLE_OPTIONS,
  type MultiFormatOptions
} from '@/config/data-format-converter-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  convertFormat,
  getConversionStats,
  type FormatType,
  type MultiFormatConversionResult
} from '@/libs/data-format-converter';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface DataFormatConverterProps {
  className?: string;
  instanceId: string;
}

export function DataFormatConverter({ className, instanceId }: DataFormatConverterProps) {
  const { toolState, updateToolState } = useToolState('data-format-converter', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<MultiFormatOptions>(DEFAULT_MULTI_FORMAT_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{
    inputSize: number;
    outputSize: number;
    inputLines: number;
    outputLines: number;
    format: FormatType;
  } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as MultiFormatOptions);
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.stats) setStats(toolState.stats as typeof stats);
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
      setOptions(DEFAULT_MULTI_FORMAT_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
      setStats(null);
    }
  }, [toolState, isHydrated]);

  const handleConvert = async () => {
    if (!input.trim()) {
      setError('Please enter content to convert');
      setOutput('');
      setStats(null);
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const result: MultiFormatConversionResult = convertFormat(
        input,
        options.inputFormat,
        options.outputFormat,
        options.indentSize,
        options.pythonQuoteStyle
      );

      if (result.success) {
        setOutput(result.output);
        setStats(getConversionStats(input, result.output, result.format));
      } else {
        setError(result.error || 'Conversion failed');
        setOutput('');
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setOutput('');
      setStats(null);
    } finally {
      setIsConverting(false);
    }
  };

  const handleLoadExample = (example: typeof MULTI_FORMAT_EXAMPLES[0]) => {
    // Load example based on input format
    let exampleInput = '';
    if (options.inputFormat === 'json') {
      exampleInput = example.json;
    } else if (options.inputFormat === 'yaml') {
      exampleInput = example.yaml;
    } else if (options.inputFormat === 'python') {
      exampleInput = example.python;
    } else if (options.inputFormat === 'typescript') {
      exampleInput = example.typescript;
    } else if (options.inputFormat === 'xml') {
      exampleInput = example.xml || example.json;
    } else {
      // Default to JSON
      exampleInput = example.json;
    }

    setInput(exampleInput);
    setError('');
    setOutput('');
    setStats(null);
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  // Get language for syntax highlighting
  const getInputLanguage = (): string => {
    if (options.inputFormat === 'python') {
      return 'python';
    }
    if (options.inputFormat === 'typescript') {
      return 'typescript';
    }
    if (options.inputFormat === 'xml') {
      return 'xml';
    }
    return options.inputFormat;
  };

  const getOutputLanguage = (): string => {
    if (options.outputFormat === 'python') {
      return 'python';
    }
    if (options.outputFormat === 'typescript') {
      return 'typescript';
    }
    if (options.outputFormat === 'xml') {
      return 'xml';
    }
    return options.outputFormat;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          Data Format Converter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Convert between JSON, YAML, Python Dictionary, TypeScript Map, and XML formats. JSON is used as the common intermediate format.
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Input Format Select */}
              <Select
                value={options.inputFormat}
                onValueChange={(value: FormatType) =>
                  setOptions(prev => ({ ...prev, inputFormat: value }))
                }
              >
                <SelectTrigger label="Input Format:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Output Format Select */}
              <Select
                value={options.outputFormat}
                onValueChange={(value: FormatType) =>
                  setOptions(prev => ({ ...prev, outputFormat: value }))
                }
              >
                <SelectTrigger label="Output Format:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Indent Size */}
              <Select
                value={options.indentSize.toString()}
                onValueChange={(value) =>
                  setOptions(prev => ({ ...prev, indentSize: parseInt(value) }))
                }
              >
                <SelectTrigger label="Indent Size:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Python Quote Style - Only show when output format is Python */}
              {options.outputFormat === 'python' && (
                <Select
                  value={options.pythonQuoteStyle}
                  onValueChange={(value: 'single' | 'double') =>
                    setOptions(prev => ({ ...prev, pythonQuoteStyle: value }))
                  }
                >
                  <SelectTrigger label="Quote Style:" className="min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PYTHON_QUOTE_STYLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
              title={`Input (${options.inputFormat.toUpperCase()})`}
              value={input}
              onChange={setInput}
              language={getInputLanguage()}
              height="500px"
              theme={theme}
              wrapText={inputWrapText}
              onWrapTextChange={setInputWrapText}
              showCopyButton={false}
              showClearButton={true}
              headerActions={
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
                  <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                    {MULTI_FORMAT_EXAMPLES.map((example, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleLoadExample(example)}
                      >
                        {example.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <span>{getCharacterCount(input)} characters</span>
              }
              footerRightContent={
                <Button
                  onClick={handleConvert}
                  disabled={!input.trim() || isConverting}
                  variant="default"
                  size="sm"
                  className="h-8 px-4"
                >
                  {isConverting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Converting...
                    </>
                  ) : (
                    'Convert'
                  )}
                </Button>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title={`Output (${options.outputFormat.toUpperCase()})`}
              value={output}
              language={getOutputLanguage()}
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              footerLeftContent={
                output && (
                  <>
                    <span>{getCharacterCount(output)} characters</span>
                    <span>{getLineCount(output)} lines</span>
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

