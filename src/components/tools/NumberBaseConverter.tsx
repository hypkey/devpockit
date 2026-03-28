'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import type { CodeOutputTab } from '@/components/ui/code-panel';
import { CodePanel } from '@/components/ui/code-panel';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ALL_BASES,
  BASE_EXAMPLES,
  DEFAULT_OPTIONS,
  SUPPORTED_BASES,
  type NumberBase,
  type NumberBaseOptions,
} from '@/config/number-base-converter-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  convertBatch,
  convertToMultipleBases,
  getAllRangesForBase,
  getBitVisualization,
  isValidForBase,
  type BitVisualization,
} from '@/libs/number-base-converter';
import { cn } from '@/libs/utils';
import { CheckIcon, ChevronDownIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface NumberBaseConverterProps {
  className?: string;
  instanceId: string;
}

export function NumberBaseConverter({ className, instanceId }: NumberBaseConverterProps) {
  const { toolState, updateToolState } = useToolState('number-base-converter', instanceId);

  const [options, setOptions] = useState<NumberBaseOptions>(DEFAULT_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [bitVisualization, setBitVisualization] = useState<BitVisualization | null>(null);
  const [rangeInfo, setRangeInfo] = useState<ReturnType<typeof getAllRangesForBase> | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('converted');
  const hasHydratedRef = useRef(false);

  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Hydrate state from toolState after mount
  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsHydrated(true);
        if (toolState) {
          if (toolState.options) {
            setOptions(toolState.options as NumberBaseOptions);
          }
          if (toolState.input) setInput(toolState.input as string);
          if (toolState.output) setOutput(toolState.output as string);
          if (toolState.error) setError(toolState.error as string);
          if (toolState.activeTab) setActiveTab(toolState.activeTab as string);
        }
      }, 0);
    }
  }, [toolState]);

  // Update persistent state whenever local state changes
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        input,
        output,
        error,
        activeTab,
      });
    }
  }, [options, input, output, error, activeTab, isHydrated, updateToolState]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setOptions(DEFAULT_OPTIONS);
        setInput('');
        setOutput('');
        setError('');
        setBitVisualization(null);
        setRangeInfo(null);
        setActiveTab('converted');
      }, 0);
    }
  }, [toolState, isHydrated]);

  const handleConvert = useCallback(() => {
    setError('');
    setBitVisualization(null);
    setRangeInfo(null);

    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (options.batchMode) {
        const lines = input.split('\n').filter(line => line.trim());
        const results = convertBatch(lines, options.inputBase, options.outputBases, {
          showPrefix: options.showPrefix,
          uppercase: options.uppercase,
        });

        const outputLines: string[] = [];
        results.forEach((result, index) => {
          if (!result.isValid) {
            outputLines.push(`Line ${index + 1}: ${result.error || 'Invalid input'}`);
          } else {
            const conversions = options.outputBases
              .map(base => {
                const value = result.outputs[base] || '';
                const baseLabel = ALL_BASES.find(b => b.value === base)?.label || `Base ${base}`;
                return `${baseLabel.padEnd(12)}: ${value}`;
              })
              .join('\n');
            outputLines.push(`Input: ${result.input} (Base ${result.inputBase})\n${conversions}`);
          }
        });

        setOutput(outputLines.join('\n\n'));
      } else {
        const cleanInput = input.trim();
        if (!isValidForBase(cleanInput, options.inputBase)) {
          setError(`Invalid number for base ${options.inputBase}`);
          setOutput('');
          return;
        }

        const results = convertToMultipleBases(cleanInput, options.inputBase, options.outputBases, {
          showPrefix: options.showPrefix,
          uppercase: options.uppercase,
        });

        const outputLines = options.outputBases.map(base => {
          const value = results[base] || '';
          const baseLabel = ALL_BASES.find(b => b.value === base)?.label || `Base ${base}`;
          return `${baseLabel.padEnd(12)}: ${value}`;
        });

        setOutput(outputLines.join('\n'));

        // Get bit visualization
        const bitViz = getBitVisualization(cleanInput, options.inputBase);
        if (bitViz) {
          setBitVisualization(bitViz);
        }

        // Get range info for input base
        const ranges = getAllRangesForBase(options.inputBase);
        setRangeInfo(ranges);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setOutput('');
    }
  }, [input, options]);

  // Auto-convert on input change
  useEffect(() => {
    if (isHydrated && input.trim()) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        handleConvert();
      }, 0);
    } else if (isHydrated && !input.trim()) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setOutput('');
        setError('');
        setBitVisualization(null);
      }, 0);
    }
  }, [input, options, isHydrated, handleConvert]);

  const handleOptionChange = (key: keyof NumberBaseOptions, value: unknown) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleOutputBasesChange = (base: NumberBase, checked: boolean) => {
    setOptions(prev => {
      if (checked) {
        return { ...prev, outputBases: [...prev.outputBases, base] };
      } else {
        return { ...prev, outputBases: prev.outputBases.filter(b => b !== base) };
      }
    });
  };

  const handleLoadExample = (base: NumberBase) => {
    const examples = BASE_EXAMPLES[base] || [];
    if (examples.length > 0) {
      setInput(examples[0]);
      setOptions(prev => ({ ...prev, inputBase: base }));
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(id);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getBaseOption = (base: NumberBase) => {
    return ALL_BASES.find(b => b.value === base) || {
      value: base,
      label: `Base ${base}`,
      symbol: '🔣',
      prefix: '',
      description: `Base ${base}`,
    };
  };

  // Create output tabs
  const outputTabs: CodeOutputTab[] = useMemo(() => [
    {
      id: 'converted',
      label: 'Converted Values',
      value: output || '',
      language: 'plaintext',
    },
    {
      id: 'bits',
      label: 'Bit Visualization',
      value: '',
      language: 'plaintext',
    },
    {
      id: 'ranges',
      label: 'Range Calculator',
      value: '',
      language: 'plaintext',
    },
  ], [output]);

  // Custom tab content renderer
  const renderCustomTabContent = (tabId: string): React.ReactNode => {
    if (tabId === 'bits') {
      if (!bitVisualization || options.batchMode) {
        return (
          <div className="h-full w-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <div className="text-center">
              <p className="text-sm">
                {options.batchMode
                  ? 'Bit visualization is not available in batch mode'
                  : 'Enter a number to see bit visualization'}
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="h-full w-full p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Bit Groups */}
            <div>
              <div className="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Binary Representation ({bitVisualization.bitCount} bits)
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-sm">
                {bitVisualization.groups.map((group, groupIndex) => (
                  <div key={groupIndex} className="flex gap-1">
                    {group.map((bit, bitIndex) => (
                      <span
                        key={bitIndex}
                        className={cn(
                          'w-6 h-6 flex items-center justify-center rounded border',
                          bit === '1'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600'
                        )}
                      >
                        {bit}
                      </span>
                    ))}
                    {groupIndex < bitVisualization.groups.length - 1 && (
                      <span className="text-neutral-400 mx-1">|</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Range Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Signed Range</div>
                <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  Min: {bitVisualization.signedRange.min}
                  <br />
                  Max: {bitVisualization.signedRange.max}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Unsigned Range</div>
                <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  Min: {bitVisualization.unsignedRange.min}
                  <br />
                  Max: {bitVisualization.unsignedRange.max}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tabId === 'ranges') {
      if (!rangeInfo || options.batchMode) {
        return (
          <div className="h-full w-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <div className="text-center">
              <p className="text-sm">
                {options.batchMode
                  ? 'Range calculator is not available in batch mode'
                  : 'Enter a number to see range calculator'}
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="h-full w-full p-4 overflow-y-auto">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Range Calculator (Base {options.inputBase})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Signed 8-bit', range: rangeInfo.signed8 },
              { label: 'Unsigned 8-bit', range: rangeInfo.unsigned8 },
              { label: 'Signed 16-bit', range: rangeInfo.signed16 },
              { label: 'Unsigned 16-bit', range: rangeInfo.unsigned16 },
              { label: 'Signed 32-bit', range: rangeInfo.signed32 },
              { label: 'Unsigned 32-bit', range: rangeInfo.unsigned32 },
              { label: 'Signed 64-bit', range: rangeInfo.signed64 },
              { label: 'Unsigned 64-bit', range: rangeInfo.unsigned64 },
            ].map(({ label, range }) => (
              <div key={label} className="border rounded p-3 bg-white dark:bg-neutral-800">
                <div className="text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100">{label}</div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Min:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{range.minValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Max:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{range.maxValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Decimal Max:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{range.maxDecimal.toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-6 text-xs"
                  onClick={() => handleCopy(`${range.minValue} to ${range.maxValue}`, `range-${label}`)}
                >
                  {copiedIndex === `range-${label}` ? (
                    <>
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                      Copy Range
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          Number Base Converter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Convert numbers between different number bases (binary, octal, decimal, hexadecimal, and more)
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Input Base Selection */}
              <Select
                value={options.inputBase.toString()}
                onValueChange={(value) => handleOptionChange('inputBase', parseInt(value) as NumberBase)}
              >
                <SelectTrigger label="Input Base:" className="min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_BASES.map((base) => (
                    <SelectItem key={base.value} value={base.value.toString()}>
                      {base.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Batch Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Batch Mode:</span>
                <Switch
                  checked={options.batchMode}
                  onCheckedChange={(checked) => handleOptionChange('batchMode', checked)}
                />
              </div>

              {/* Options */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Prefix:</span>
                  <Switch
                    checked={options.showPrefix}
                    onCheckedChange={(checked) => handleOptionChange('showPrefix', checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Uppercase:</span>
                  <Switch
                    checked={options.uppercase}
                    onCheckedChange={(checked) => handleOptionChange('uppercase', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              key={`input-${options.batchMode ? 'multi' : 'single'}`}
              title="Input"
              value={input}
              onChange={setInput}
              language="plaintext"
              height="500px"
              theme={theme}
              wrapText={wrapText}
              onWrapTextChange={setWrapText}
              placeholder={options.batchMode ? "Enter numbers (one per line)" : "Enter a number"}
              showClearButton={true}
              singleLine={!options.batchMode}
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
                    {SUPPORTED_BASES.map((base) => (
                      <DropdownMenuItem key={base.value} onClick={() => handleLoadExample(base.value)}>
                        {base.label} Examples
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
            tabs={outputTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            customTabContent={renderCustomTabContent}
            language="plaintext"
            height="500px"
            theme={theme}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
            showWrapToggle={activeTab === 'converted'}
            headerActions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    Output Bases ({options.outputBases.length})
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Output Bases</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SUPPORTED_BASES.map((base) => (
                    <DropdownMenuCheckboxItem
                      key={base.value}
                      checked={options.outputBases.includes(base.value)}
                      onCheckedChange={(checked) => handleOutputBasesChange(base.value, checked)}
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                    >
                      {base.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            }
            footerLeftContent={
              <>
                {error && (
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-semibold',
                      'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    )}
                  >
                    {error}
                  </span>
                )}
                {activeTab === 'converted' && output && !error && (
                  <>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold',
                        'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      )}
                    >
                      {options.batchMode
                        ? `${output.split('\n\n').length} number${output.split('\n\n').length !== 1 ? 's' : ''} converted`
                        : `Converted to ${options.outputBases.length} base${options.outputBases.length !== 1 ? 's' : ''}`}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {output.length} characters
                    </span>
                    <span className="text-xs text-neutral-500">
                      {output.split('\n').length} line{output.split('\n').length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {activeTab === 'bits' && bitVisualization && !options.batchMode && !error && (
                  <span className="text-xs text-neutral-500">
                    {bitVisualization.bitCount} bits
                  </span>
                )}
                {activeTab === 'ranges' && rangeInfo && !options.batchMode && !error && (
                  <span className="text-xs text-neutral-500">
                    Base {options.inputBase} ranges
                  </span>
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

