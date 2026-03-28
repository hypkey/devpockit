'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_SCHEMA_OPTIONS,
  SCHEMA_GENERATOR_EXAMPLES,
  type JsonSchemaGeneratorOptions
} from '@/config/json-schema-generator-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  formatSchema,
  generateSchema,
  type JsonSchemaResult
} from '@/libs/json-schema-generator';
import { detectFormat } from '@/libs/json-yaml';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

interface JsonSchemaGeneratorProps {
  className?: string;
  instanceId: string;
}

export function JsonSchemaGenerator({ className, instanceId }: JsonSchemaGeneratorProps) {
  const { toolState, updateToolState } = useToolState('json-schema-generator', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<JsonSchemaGeneratorOptions>(DEFAULT_SCHEMA_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [schemaResult, setSchemaResult] = useState<JsonSchemaResult | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as JsonSchemaGeneratorOptions);
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.schemaResult) setSchemaResult(toolState.schemaResult as JsonSchemaResult);
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
        schemaResult: schemaResult || undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, input, output, error, schemaResult, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_SCHEMA_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
      setSchemaResult(null);
    }
  }, [toolState, isHydrated]);

  const handleGenerateSchema = async () => {
    if (!input.trim()) {
      setError('Please enter JSON or YAML data');
      setOutput('');
      setSchemaResult(null);
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate schema
      const result = generateSchema(input, options);

      if (result.success) {
        setSchemaResult(result);
        setOutput(formatSchema(result.schema));
      } else {
        setError(result.error || 'Schema generation failed');
        setOutput('');
        setSchemaResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Schema generation failed');
      setOutput('');
      setSchemaResult(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadExample = (example: typeof SCHEMA_GENERATOR_EXAMPLES[0]) => {
    if ('json' in example && example.json) {
      setInput(example.json);
    } else if ('yaml' in example && example.yaml) {
      setInput(example.yaml);
    }
    setError('');
    setOutput('');
    setSchemaResult(null);
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  // Auto-detect language for syntax highlighting
  const detectedLanguage = useMemo(() => {
    if (!input.trim()) return 'json';
    const format = detectFormat(input);
    return format === 'yaml' ? 'yaml' : 'json';
  }, [input]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          JSON/YAML Schema Generator
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Generate JSON Schema from JSON or YAML data
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="strict-types" className="text-sm">
                  Strict Types:
                </Label>
                <Switch
                  id="strict-types"
                  checked={options.strictTypes}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, strictTypes: checked })
                  }
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="include-examples" className="text-sm">
                  Include Examples:
                </Label>
                <Switch
                  id="include-examples"
                  checked={options.includeExamples}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeExamples: checked })
                  }
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="include-descriptions" className="text-sm">
                  Include Descriptions:
                </Label>
                <Switch
                  id="include-descriptions"
                  checked={options.includeDescriptions}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeDescriptions: checked })
                  }
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="make-required" className="text-sm">
                  Make All Required:
                </Label>
                <Switch
                  id="make-required"
                  checked={options.makeRequired}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, makeRequired: checked })
                  }
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="additional-props" className="text-sm">
                  Allow Additional Properties:
                </Label>
                <Switch
                  id="additional-props"
                  checked={options.additionalProperties}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, additionalProperties: checked })
                  }
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title="JSON/YAML Input"
              value={input}
              onChange={setInput}
              language={detectedLanguage}
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
                    {SCHEMA_GENERATOR_EXAMPLES.map((example, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleLoadExample(example)}
                        className="flex flex-col items-start gap-1"
                      >
                        <span className="font-medium">{example.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {example.description}
                        </span>
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
                  onClick={handleGenerateSchema}
                  disabled={!input.trim() || isGenerating}
                  variant="default"
                  size="sm"
                  className="h-8 px-4"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Schema'
                  )}
                </Button>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title="JSON Schema"
              value={output}
              language="json"
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

          {/* Schema Generation Success */}
          {schemaResult && schemaResult.success && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-sm text-green-700 dark:text-green-300">
                <strong>Schema generated successfully!</strong>
                <div className="mt-2 text-xs">
                  Format: {schemaResult.format.toUpperCase()} → JSON Schema
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

