'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LabeledInput } from '@/components/ui/labeled-input';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DEFAULT_UUID_OPTIONS,
  UUID_EXAMPLE_SETS,
  UUID_FORMATS,
  UUID_HYPHENS,
  UUID_NAMESPACE_OPTIONS,
  UUID_QUANTITY_LIMITS,
  UUID_VERSIONS
} from '@/config/uuid-generator-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { cn } from '@/libs/utils';
import { generateUuids, getUuidStats, type UuidGenerationOptions } from '@/libs/uuid-generator';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface UuidGeneratorProps {
  className?: string;
  instanceId: string;
}

export function UuidGenerator({ className, instanceId }: UuidGeneratorProps) {
  const { toolState, updateToolState } = useToolState('uuid-generator', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<UuidGenerationOptions>(DEFAULT_UUID_OPTIONS);
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{ count: number; totalLength: number; averageLength: number; uniqueCount: number; duplicates: number } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) {
        const opts = toolState.options as UuidGenerationOptions;
        setOptions(opts);
      }
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
        output,
        error,
        stats: stats || undefined
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, output, error, stats, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_UUID_OPTIONS);
      setOutput('');
      setError('');
      setStats(null);
    }
  }, [toolState, isHydrated]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      if (options.quantity < UUID_QUANTITY_LIMITS.min || options.quantity > UUID_QUANTITY_LIMITS.max) {
        setError(`Quantity must be between ${UUID_QUANTITY_LIMITS.min} and ${UUID_QUANTITY_LIMITS.max}`);
        return;
      }

      if (options.version === 'v5' && (!options.namespace || !options.name)) {
        setError('Namespace and name are required for v5 UUIDs');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const result = generateUuids(options);
      setOutput(result.uuids.join('\n'));
      setStats(getUuidStats(result.uuids));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate UUIDs');
      setOutput('');
      setStats(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadExample = (version: 'v1' | 'v4' | 'v5' | 'v7') => {
    const examples = UUID_EXAMPLE_SETS[version];
    setOutput(examples.join('\n'));
    setStats(getUuidStats(examples));
    setError('');
  };

  const handleOptionChange = (key: keyof UuidGenerationOptions, value: unknown) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleQuantityChange = (quantity: number) => {
    setOptions(prev => ({ ...prev, quantity }));
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
          UUID Generator
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Generate UUIDs in different versions and formats
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Version Selection */}
              <Select
                value={options.version}
                onValueChange={(value) => handleOptionChange('version', value)}
              >
                <SelectTrigger label="Version:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UUID_VERSIONS.map((version) => (
                    <SelectItem key={version.value} value={version.value}>
                      {version.symbol} {version.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Format Selection */}
              <Select
                value={options.format}
                onValueChange={(value) => handleOptionChange('format', value)}
              >
                <SelectTrigger label="Format:" className="min-w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UUID_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.symbol} {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Hyphens Selection */}
              <Select
                value={options.hyphens}
                onValueChange={(value) => handleOptionChange('hyphens', value)}
              >
                <SelectTrigger label="Hyphens:" className="min-w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UUID_HYPHENS.map((hyphen) => (
                    <SelectItem key={hyphen.value} value={hyphen.value}>
                      {hyphen.symbol} {hyphen.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quantity Input */}
              <NumberInput
                value={options.quantity}
                onChange={handleQuantityChange}
                min={UUID_QUANTITY_LIMITS.min}
                max={UUID_QUANTITY_LIMITS.max}
              />

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="default"
                size="default"
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
            </div>

            {/* V5 Options Row */}
            {options.version === 'v5' && (
              <div className="flex items-center gap-3 flex-wrap">
                {/* Namespace */}
                <Select
                  value={options.namespace}
                  onValueChange={(value) => handleOptionChange('namespace', value)}
                >
                  <SelectTrigger label="Namespace:" className="min-w-[380px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UUID_NAMESPACE_OPTIONS.map((namespace) => (
                      <SelectItem key={namespace.value} value={namespace.value}>
                        {namespace.label} - {namespace.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Name Input */}
                <LabeledInput
                  label="Name:"
                  value={options.name || ''}
                  onChange={(value) => handleOptionChange('name', value)}
                  placeholder="Enter name for v5 UUID"
                  containerClassName="min-w-[380px]"
                />
              </div>
            )}
          </div>

          {/* Output Panel */}
          <CodePanel fillHeight={true}
            title="Generated UUIDs"
            value={output}
            language="plaintext"
            className="flex-1"
            height="500px"
            theme={theme}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
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
                  <DropdownMenuItem onClick={() => handleLoadExample('v1')}>
                    v1 Examples (Timestamp)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLoadExample('v4')}>
                    v4 Examples (Random)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLoadExample('v5')}>
                    v5 Examples (Namespace)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLoadExample('v7')}>
                    v7 Examples (Time-ordered)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
            footerLeftContent={
              output && (
                <>
                  <span>{getLineCount(output)} UUIDs</span>
                  {stats && <span>{stats.uniqueCount} unique</span>}
                </>
              )
            }
          />

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
