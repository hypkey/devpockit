'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DEFAULT_SCHEMA_CONVERTER_OPTIONS,
  SCHEMA_EXAMPLES,
  SCHEMA_FORMAT_OPTIONS,
  type SchemaConverterOptions,
  type SchemaFormat
} from '@/config/schema-converter-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { convertSchema } from '@/libs/schema-converter';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ArrowsRightLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface SchemaConverterProps {
  className?: string;
  instanceId: string;
}

export function SchemaConverter({ className, instanceId }: SchemaConverterProps) {
  const { toolState, updateToolState } = useToolState('schema-converter', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<SchemaConverterOptions>(DEFAULT_SCHEMA_CONVERTER_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as SchemaConverterOptions);
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
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
        error
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, input, output, error, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_SCHEMA_CONVERTER_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
    }
  }, [toolState, isHydrated]);

  const handleConvert = async () => {
    if (!input.trim()) {
      setError('Please enter schema content to convert');
      setOutput('');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = convertSchema(input, options);

      if (result.success) {
        setOutput(result.output);
      } else {
        setError(result.error || 'Conversion failed');
        setOutput('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setOutput('');
    } finally {
      setIsConverting(false);
    }
  };

  const handleLoadExample = (example: typeof SCHEMA_EXAMPLES[0]) => {
    setInput(example.content);
    setOptions(prev => ({
      ...prev,
      sourceFormat: example.format as SchemaFormat
    }));
    setError('');
    setOutput('');
  };

  const handleSwapFormats = () => {
    setOptions(prev => ({
      ...prev,
      sourceFormat: prev.targetFormat,
      targetFormat: prev.sourceFormat
    }));
    // Swap input and output
    const tempInput = input;
    setInput(output);
    setOutput(tempInput);
  };

  const getSourceLanguage = (): string => {
    const format = SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.sourceFormat);
    return format?.language || 'json';
  };

  const getTargetLanguage = (): string => {
    const format = SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.targetFormat);
    return format?.language || 'json';
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  // Get available target formats based on source format
  const getAvailableTargetFormats = (): typeof SCHEMA_FORMAT_OPTIONS => {
    return SCHEMA_FORMAT_OPTIONS.filter(f => f.value !== options.sourceFormat);
  };

  // Check if conversion is supported
  // Simplified: All formats convert to JSON Schema first, then to target
  const isConversionSupported = (source: SchemaFormat, target: SchemaFormat): boolean => {
    // Supported source formats (can convert to JSON Schema)
    const supportedSources: SchemaFormat[] = ['json-schema', 'spark', 'mongo', 'bigquery', 'typescript', 'python', 'sql', 'pandas', 'polars', 'protobuf', 'avro', 'duckdb', 'pyspark'];
    // Supported target formats (can convert from JSON Schema)
    const supportedTargets: SchemaFormat[] = ['json-schema', 'typescript', 'python', 'sql', 'spark', 'mongo', 'bigquery', 'pandas', 'polars', 'protobuf', 'avro', 'duckdb', 'pyspark'];

    // Special case: Same format conversions (not useful)
    if (source === target) {
      return false;
    }

    return supportedSources.includes(source) && supportedTargets.includes(target);
  };

  // Check if current conversion is supported
  const isCurrentConversionSupported = isConversionSupported(options.sourceFormat, options.targetFormat);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          Schema Converter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Convert schemas between formats using JSON Schema as the central hub. All formats convert to JSON Schema first, then to your target format.
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Source Format Select */}
              <Select
                value={options.sourceFormat}
                onValueChange={(value: SchemaFormat) =>
                  setOptions(prev => ({ ...prev, sourceFormat: value }))
                }
              >
                <SelectTrigger label="Source Format:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMA_FORMAT_OPTIONS.map((option) => {
                    const supportedSources: SchemaFormat[] = ['json-schema', 'spark', 'mongo', 'bigquery', 'typescript', 'python', 'sql', 'pandas', 'polars', 'protobuf', 'avro', 'duckdb', 'pyspark'];
                    const isSupported = supportedSources.includes(option.value as SchemaFormat);
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={!isSupported}
                        className={!isSupported ? 'opacity-50' : ''}
                      >
                        {option.label}
                        {!isSupported && ' (Coming Soon)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Swap Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapFormats}
                className="h-8 px-3"
                title="Swap source and target formats"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
              </Button>

              {/* Target Format Select */}
              <Select
                value={options.targetFormat}
                onValueChange={(value: SchemaFormat) =>
                  setOptions(prev => ({ ...prev, targetFormat: value }))
                }
              >
                <SelectTrigger label="Target Format:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTargetFormats().map((option) => {
                    const isSupported = isConversionSupported(options.sourceFormat, option.value as SchemaFormat);
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={!isSupported}
                        className={!isSupported ? 'opacity-50' : ''}
                      >
                        {option.label}
                        {!isSupported && ' (Coming Soon)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Unsupported Format Warning */}
            {!isCurrentConversionSupported && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Coming Soon:</strong> Conversion from {SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.sourceFormat)?.label} to {SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.targetFormat)?.label} is not yet supported.
                  Currently supported sources: JSON Schema, Spark Schema (JSON), MongoDB Schema, BigQuery Schema, TypeScript, Python, SQL, Pandas, Polars, Protocol Buffers, Apache Avro, DuckDB Schema, PySpark Schema.
                  Currently supported targets: JSON Schema, TypeScript, Python, SQL, Spark Schema (JSON), MongoDB Schema, BigQuery Schema, Pandas, Polars, Protocol Buffers, Apache Avro, DuckDB Schema, PySpark Schema.
                </div>
              </div>
            )}

            {/* Advanced Options Row - Show conditionally based on target format */}
            {isCurrentConversionSupported && (options.targetFormat === 'typescript' ||
              options.targetFormat === 'python' ||
              options.targetFormat === 'sql') && (
              <div className="flex items-center gap-3 flex-wrap text-xs">
                {options.targetFormat === 'typescript' && (
                  <Select
                    value={options.typescriptStyle}
                    onValueChange={(value: 'interface' | 'type' | 'class') =>
                      setOptions(prev => ({ ...prev, typescriptStyle: value }))
                    }
                  >
                    <SelectTrigger label="Style:" className="min-w-[150px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interface">Interface</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {options.targetFormat === 'python' && (
                  <Select
                    value={options.pythonStyle}
                    onValueChange={(value: 'dataclass' | 'pydantic' | 'attrs' | 'class') =>
                      setOptions(prev => ({ ...prev, pythonStyle: value }))
                    }
                  >
                    <SelectTrigger label="Style:" className="min-w-[150px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dataclass">Dataclass</SelectItem>
                      <SelectItem value="pydantic">Pydantic</SelectItem>
                      <SelectItem value="attrs">Attrs</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {options.targetFormat === 'sql' && (
                  <Select
                    value={options.sqlDialect}
                    onValueChange={(value: 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'oracle') =>
                      setOptions(prev => ({ ...prev, sqlDialect: value }))
                    }
                  >
                    <SelectTrigger label="SQL Dialect:" className="min-w-[150px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="mssql">SQL Server</SelectItem>
                      <SelectItem value="oracle">Oracle</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title={`Input (${SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.sourceFormat)?.label || 'Source'})`}
              value={input}
              onChange={setInput}
              language={getSourceLanguage()}
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
                  <DropdownMenuContent align="end">
                    {SCHEMA_EXAMPLES.map((example, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleLoadExample(example)}
                      >
                        {example.name} ({example.format})
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
                  disabled={!input.trim() || isConverting || !isCurrentConversionSupported}
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
              title={`Output (${SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.targetFormat)?.label || 'Target'})`}
              readOnly={true}
              value={!isCurrentConversionSupported
                ? `// Conversion from ${SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.sourceFormat)?.label} to ${SCHEMA_FORMAT_OPTIONS.find(f => f.value === options.targetFormat)?.label} is not yet supported.

// How it works:
// All formats convert to JSON Schema first, then JSON Schema converts to the target format.

// Supported source formats (→ JSON Schema):
// - JSON Schema
// - Spark Schema (JSON)
// - MongoDB Schema
// - BigQuery Schema
// - TypeScript (interface/type/class)
// - Python (class/dataclass/pydantic)
// - SQL (CREATE TABLE)
// - Pandas (DataFrame dtypes)
// - Polars (DataFrame schema)
// - Protocol Buffers (.proto)
// - Apache Avro (JSON)
// - DuckDB Schema (SQL)
// - PySpark Schema (Python)

// Supported target formats (from JSON Schema):
// - JSON Schema
// - TypeScript
// - Python
// - SQL
// - Spark Schema (JSON)
// - MongoDB Schema
// - BigQuery Schema
// - Pandas
// - Polars
// - Protocol Buffers
// - Apache Avro
// - DuckDB Schema
// - PySpark Schema`
                : output}
              language={getTargetLanguage()}
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              footerLeftContent={
                output && isCurrentConversionSupported && (
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

