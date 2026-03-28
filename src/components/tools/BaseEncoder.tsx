'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BASE64_VARIANTS, BASE_ENCODING_TYPES, BASE_EXAMPLES, DEFAULT_BASE_OPTIONS, HEX_CASE_OPTIONS, LINE_WRAP_OPTIONS } from '@/config/base-encoder-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { decodeBase, encodeBase, type BaseEncoderOptions, type BaseEncoderResult } from '@/libs/base-encoder';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';

interface BaseEncoderProps {
  className?: string;
  instanceId: string;
}

export function BaseEncoder({ className, instanceId }: BaseEncoderProps) {
  const { toolState, updateToolState } = useToolState('base-encoder', instanceId);

  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [options, setOptions] = useState<BaseEncoderOptions>(DEFAULT_BASE_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{
    originalLength: number;
    encodedLength: number;
    compressionRatio: number;
    encodingEfficiency: number;
  } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Track if we've already hydrated to prevent re-hydration on toolState changes
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedRef.current && toolState) {
      hasHydratedRef.current = true;
      setIsHydrated(true);
      if (toolState.mode) setMode(toolState.mode as 'encode' | 'decode');
      if (toolState.options) setOptions(toolState.options as BaseEncoderOptions);
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.stats) setStats(toolState.stats as { originalLength: number; encodedLength: number; compressionRatio: number; encodingEfficiency: number });
    } else if (!hasHydratedRef.current) {
      // Still mark as hydrated even if no toolState exists
      hasHydratedRef.current = true;
      setIsHydrated(true);
    }
  }, [toolState]);

  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        mode,
        options,
        input,
        output,
        error,
        stats: stats || undefined
      });
    }
  }, [mode, options, input, output, error, stats, isHydrated, updateToolState]);

  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setMode('encode');
      setOptions(DEFAULT_BASE_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
      setStats(null);
    }
  }, [toolState, isHydrated]);

  const handleProcess = async () => {
    if (!input.trim()) {
      setError('Please enter text to process');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const result: BaseEncoderResult = mode === 'encode'
        ? encodeBase(input, options)
        : decodeBase(input, options);

      if (result.isValid) {
        setOutput(mode === 'encode' ? result.encoded : result.decoded);
        setStats({
          originalLength: result.originalLength,
          encodedLength: result.encodedLength,
          compressionRatio: result.compressionRatio,
          encodingEfficiency: result.encodingEfficiency
        });
      } else {
        setError(result.error || `${mode === 'encode' ? 'Encoding' : 'Decoding'} failed`);
        setOutput('');
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode}`);
      setOutput('');
      setStats(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadExample = (key: keyof typeof BASE_EXAMPLES) => {
    setInput(BASE_EXAMPLES[key]);
    setError('');
  };

  const handleModeChange = (tabId: string) => {
    const newMode = tabId === 'encode' ? 'encode' : 'decode';
    if (newMode !== mode) {
      setMode(newMode);
      // Swap input and output when switching modes
      const temp = input;
      setInput(output);
      setOutput(temp);
      setError('');
    }
  };

  const getCharacterCount = (text: string): number => text.length;

  const showBase64Variant = options.encodingType === 'base64';
  const showHexCase = options.encodingType === 'base16';
  const showLineWrap = options.encodingType === 'base64' || options.encodingType === 'base32' || options.encodingType === 'base32hex' || options.encodingType === 'base16';

  // Create input tabs
  const inputTabs = useMemo(() => [
    {
      id: 'encode',
      label: 'Encode',
      value: input,
      language: 'plaintext'
    },
    {
      id: 'decode',
      label: 'Decode',
      value: input,
      language: 'plaintext'
    }
  ], [input]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          Base Encoder/Decoder
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Encode and decode text using Base64, Base32, Base16 (hex), Base85, and other base encodings
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Encoding Type Select */}
              <Select
                value={options.encodingType}
                onValueChange={(value: BaseEncoderOptions['encodingType']) =>
                  setOptions(prev => ({ ...prev, encodingType: value }))
                }
              >
                <SelectTrigger label="Encoding Type:" className="min-w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_ENCODING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Base64 Variant (only for Base64) */}
              {showBase64Variant && (
                <Select
                  value={options.variant || 'standard'}
                  onValueChange={(value: string) =>
                    setOptions(prev => ({ ...prev, variant: value as BaseEncoderOptions['variant'] }))
                  }
                >
                  <SelectTrigger label="Variant:" className="min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE64_VARIANTS.map((variant) => (
                      <SelectItem key={variant.value} value={variant.value}>
                        {variant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Hex Case (only for Base16) */}
              {showHexCase && (
                <Select
                  value={options.hexCase || 'lowercase'}
                  onValueChange={(value: string) =>
                    setOptions(prev => ({ ...prev, hexCase: value as BaseEncoderOptions['hexCase'] }))
                  }
                >
                  <SelectTrigger label="Case:" className="min-w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEX_CASE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Padding Toggle (for Base64, Base32) */}
              {(options.encodingType === 'base64' || options.encodingType === 'base32' || options.encodingType === 'base32hex') && (
                <Select
                  value={options.padding !== false ? 'with' : 'without'}
                  onValueChange={(value) =>
                    setOptions(prev => ({ ...prev, padding: value === 'with' }))
                  }
                >
                  <SelectTrigger label="Padding:" className="min-w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="with">With padding</SelectItem>
                    <SelectItem value="without">Without padding</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Line Wrapping (for Base64, Base32, Base16) */}
              {showLineWrap && (
                <Select
                  value={String(options.lineWrap || 0)}
                  onValueChange={(value) =>
                    setOptions(prev => ({ ...prev, lineWrap: parseInt(value, 10) }))
                  }
                >
                  <SelectTrigger label="Line Wrap:" className="min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINE_WRAP_OPTIONS.map((option) => (
                      <SelectItem key={String(option.value)} value={String(option.value)}>
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
              tabs={inputTabs}
              activeTab={mode}
              onTabChange={handleModeChange}
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
                    <DropdownMenuItem onClick={() => handleLoadExample('simple')}>
                      Simple Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('json')}>
                      JSON Data
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('url')}>
                      URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('unicode')}>
                      Unicode Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('multiline')}>
                      Multiline Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('specialChars')}>
                      Special Characters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <span>{getCharacterCount(input)} characters</span>
              }
              footerRightContent={
                <Button
                  onClick={handleProcess}
                  disabled={!input.trim() || isProcessing}
                  variant="default"
                  size="sm"
                  className="h-8 px-4"
                >
                  {isProcessing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      {mode === 'encode' ? 'Encoding...' : 'Decoding...'}
                    </>
                  ) : (
                    mode === 'encode' ? 'Encode' : 'Decode'
                  )}
                </Button>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title="Output"
              value={output}
              language="plaintext"
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              footerLeftContent={
                output && (
                  <>
                    <span>{getCharacterCount(output)} characters</span>
                    {stats && (
                      <>
                        <span className="mx-2">•</span>
                        <span>
                          {stats.compressionRatio > 0 ? '+' : ''}{stats.compressionRatio.toFixed(1)}% size change
                        </span>
                      </>
                    )}
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

