'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LabeledInput } from '@/components/ui/labeled-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_URL_OPTIONS, URL_ENCODED_EXAMPLES, URL_ENCODING_TYPES } from '@/config/url-encoder-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { decodeUrl, type UrlEncoderOptions, type UrlEncoderResult } from '@/libs/url-encoder';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

interface UrlDecoderToolProps {
  className?: string;
  instanceId: string;
}

export function UrlDecoderTool({ className, instanceId }: UrlDecoderToolProps) {
  const { toolState, updateToolState } = useToolState('url-decoder-tool', instanceId);

  const [options, setOptions] = useState<UrlEncoderOptions>(DEFAULT_URL_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{
    originalLength: number;
    decodedLength: number;
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
      if (toolState.options) setOptions(toolState.options as UrlEncoderOptions);
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.stats) setStats(toolState.stats as { originalLength: number; decodedLength: number });
    } else if (!hasHydratedRef.current) {
      // Still mark as hydrated even if no toolState exists
      hasHydratedRef.current = true;
      setIsHydrated(true);
    }
  }, [toolState]);

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
  }, [options, input, output, error, stats, isHydrated, updateToolState]);

  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_URL_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
      setStats(null);
    }
  }, [toolState, isHydrated]);

  const handleDecode = async () => {
    if (!input.trim()) {
      setError('Please enter encoded text to decode');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const result: UrlEncoderResult = decodeUrl(input, options);

      if (result.isValid) {
        setOutput(result.decoded);
        setStats({
          originalLength: result.originalLength,
          decodedLength: result.decoded.length
        });
      } else {
        setError(result.error || 'Decoding failed');
        setOutput('');
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode');
      setOutput('');
      setStats(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadExample = (key: keyof typeof URL_ENCODED_EXAMPLES) => {
    setInput(URL_ENCODED_EXAMPLES[key]);
    setError('');
  };

  const getCharacterCount = (text: string): number => text.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          URL Decoder
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Decode URL-encoded text back to its original form with support for multiple encoding types
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
                onValueChange={(value: 'url' | 'uri' | 'custom') =>
                  setOptions(prev => ({ ...prev, encodingType: value }))
                }
              >
                <SelectTrigger label="Encoding Type:" className="min-w-[420px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URL_ENCODING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Characters (only for custom encoding) */}
              {options.encodingType === 'custom' && (
                <LabeledInput
                  label="Custom Characters:"
                  value={options.customChars}
                  onChange={(value) => setOptions(prev => ({ ...prev, customChars: value }))}
                  placeholder="Enter characters to decode (e.g., ' &?=#/:;,')"
                  containerClassName="w-[280px]"
                />
              )}
            </div>
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title="Encoded Text"
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
                      Simple Encoded URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('withParams')}>
                      Encoded URL with Parameters
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('specialChars')}>
                      Encoded Special Characters
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('unicode')}>
                      Encoded Unicode
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoadExample('complex')}>
                      Complex Encoded URL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <span>{getCharacterCount(input)} characters</span>
              }
              footerRightContent={
                <Button
                  onClick={handleDecode}
                  disabled={!input.trim() || isProcessing}
                  variant="default"
                  size="sm"
                  className="h-8 px-4"
                >
                  {isProcessing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Decoding...
                    </>
                  ) : (
                    'Decode'
                  )}
                </Button>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title="Decoded Text"
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
                      <span>
                        {stats.decodedLength < stats.originalLength ? '-' : '+'}{Math.abs(((stats.decodedLength - stats.originalLength) / stats.originalLength) * 100).toFixed(1)}% size change
                      </span>
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
