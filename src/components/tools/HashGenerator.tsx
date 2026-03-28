'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LabeledInput } from '@/components/ui/labeled-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_HASH_OPTIONS,
  HASH_ALGORITHMS,
  HASH_EXAMPLE_INPUTS,
  HASH_OUTPUT_FORMATS,
  HASH_SALT_POSITIONS,
} from '@/config/hash-generator-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { generateHash, type HashAlgorithm, type HashGenerationOptions } from '@/libs/hash-generator';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface HashGeneratorProps {
  className?: string;
  instanceId: string;
}

export function HashGenerator({ className, instanceId }: HashGeneratorProps) {
  const { toolState, updateToolState } = useToolState('hash-generator', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<HashGenerationOptions>(DEFAULT_HASH_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<{
    hash: string;
    algorithm: HashAlgorithm;
    inputLength: number;
    hashLength: number;
    saltUsed: boolean;
    outputFormat: 'hex' | 'base64';
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
      if (toolState.options) {
        const opts = toolState.options as HashGenerationOptions;
        setOptions(opts);
      }
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.result) setResult(toolState.result as typeof result);
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
        result: result || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, input, output, error, result, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_HASH_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
      setResult(null);
    }
  }, [toolState, isHydrated]);

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter text to hash');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const hashResult = await generateHash({
        ...options,
        input: input.trim(),
      });

      setOutput(hashResult.hash);
      setResult({
        hash: hashResult.hash,
        algorithm: hashResult.algorithm,
        inputLength: hashResult.inputLength,
        hashLength: hashResult.hashLength,
        saltUsed: hashResult.saltUsed,
        outputFormat: hashResult.outputFormat,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hash');
      setOutput('');
      setResult(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadExample = (algorithm: HashAlgorithm) => {
    const exampleInput = HASH_EXAMPLE_INPUTS[algorithm];
    if (exampleInput) {
      setInput(exampleInput);
      setOptions(prev => ({ ...prev, algorithm }));
      setError('');
    }
  };

  const handleOptionChange = (key: keyof HashGenerationOptions, value: unknown) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const selectedAlgorithm = HASH_ALGORITHMS.find(a => a.value === options.algorithm);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          Hash Generator
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Generate cryptographic hashes using SHA-1, SHA-256, SHA-512, and SHA-3 algorithms
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Algorithm Selection */}
              <Select
                value={options.algorithm}
                onValueChange={(value) => handleOptionChange('algorithm', value)}
              >
                <SelectTrigger label="Algorithm:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HASH_ALGORITHMS.map((algorithm) => (
                    <SelectItem key={algorithm.value} value={algorithm.value}>
                      {algorithm.label} - {algorithm.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Output Format Selection */}
              <Select
                value={options.outputFormat}
                onValueChange={(value) => handleOptionChange('outputFormat', value)}
              >
                <SelectTrigger label="Format:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HASH_OUTPUT_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Uppercase Toggle */}
              <div className="flex items-center gap-2 min-w-[150px]">
                <Switch
                  id="uppercase"
                  checked={options.uppercase}
                  onCheckedChange={(checked) => handleOptionChange('uppercase', checked)}
                />
                <label htmlFor="uppercase" className="text-sm font-medium cursor-pointer">
                  Uppercase
                </label>
              </div>
            </div>

            {/* Salt Options Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Salt Position */}
              <Select
                value={options.saltPosition}
                onValueChange={(value) => handleOptionChange('saltPosition', value)}
              >
                <SelectTrigger label="Salt Position:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HASH_SALT_POSITIONS.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Salt Input */}
              <LabeledInput
                label="Salt:"
                value={options.salt || ''}
                onChange={(value) => handleOptionChange('salt', value)}
                placeholder="Enter salt value (optional)"
                containerClassName="min-w-[300px]"
                disabled={options.saltPosition === 'none'}
              />
            </div>

          </div>

          {/* Side-by-side Editor Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title="Input Text"
              value={input}
              onChange={setInput}
              language="plaintext"
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
                    {HASH_ALGORITHMS.map((algorithm) => {
                      const exampleInput = HASH_EXAMPLE_INPUTS[algorithm.value];
                      if (exampleInput) {
                        return (
                          <DropdownMenuItem
                            key={algorithm.value}
                            onClick={() => handleLoadExample(algorithm.value)}
                          >
                            {algorithm.label} Example
                          </DropdownMenuItem>
                        );
                      }
                      return null;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <span>{input.length} characters</span>
              }
              footerRightContent={
                <Button
                  onClick={handleGenerate}
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
                    'Generate Hash'
                  )}
                </Button>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title="Hash Output"
              value={output}
              language="plaintext"
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              readOnly={true}
              footerLeftContent={
                <>
                  {error && (
                    <span className="text-red-700 dark:text-red-300">
                      Error: {error}
                    </span>
                  )}
                  {!error && selectedAlgorithm && selectedAlgorithm.security === 'deprecated' && (
                    <span className="text-yellow-700 dark:text-yellow-300">
                      ⚠️ {selectedAlgorithm.label} is deprecated
                    </span>
                  )}
                  {!error && output && (
                    <>
                      <span>{output.length} characters</span>
                      {result && (
                        <>
                          {result.saltUsed && <span>• Salted</span>}
                          <span>• {result.algorithm}</span>
                        </>
                      )}
                    </>
                  )}
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

