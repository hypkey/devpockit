'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadFileButton } from '@/components/ui/load-file-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_XML_OPTIONS, XML_EXAMPLES, XML_FORMAT_OPTIONS } from '@/config/xml-formatter-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { cn } from '@/libs/utils';
import { formatXml, getXmlStats, type XmlFormatOptions, type XmlFormatResult } from '@/libs/xml-formatter';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface XmlFormatterProps {
  className?: string;
  instanceId: string;
}

export function XmlFormatter({ className, instanceId }: XmlFormatterProps) {
  const { toolState, updateToolState } = useToolState('xml-formatter', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<XmlFormatOptions>(DEFAULT_XML_OPTIONS);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{ size: number; lines: number; depth: number; tags: number; attributes: number } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as XmlFormatOptions);
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.stats) setStats(toolState.stats as { size: number; lines: number; depth: number; tags: number; attributes: number });
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
      setOptions(DEFAULT_XML_OPTIONS);
      setInput('');
      setOutput('');
      setError('');
      setStats(null);
    }
  }, [toolState, isHydrated]);

  const handleFormat = async () => {
    if (!input.trim()) {
      setError('Please enter XML to format');
      return;
    }

    setIsFormatting(true);
    setError('');

    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const result: XmlFormatResult = formatXml(input, options);

      if (result.isValid) {
        setOutput(result.formatted);
        setStats(getXmlStats(result.formatted));
      } else {
        setError(result.error || 'Invalid XML');
        setOutput('');
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to format XML');
      setOutput('');
      setStats(null);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleLoadExample = (type: 'valid' | 'minified' | 'invalid') => {
    setInput(XML_EXAMPLES[type]);
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
          XML Formatter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Format, minify, and validate XML with syntax highlighting and statistics
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 bg-background px-[24px] pt-6 pb-10">
        <div className="flex flex-col gap-4">
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
                  {XML_FORMAT_OPTIONS.formats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preserve Whitespace */}
              <Select
                value={options.preserveWhitespace.toString()}
                onValueChange={(value) =>
                  setOptions(prev => ({ ...prev, preserveWhitespace: value === 'true' }))
                }
              >
                <SelectTrigger label="Whitespace:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {XML_FORMAT_OPTIONS.preserveWhitespace.map((whitespace) => (
                    <SelectItem key={whitespace.value.toString()} value={whitespace.value.toString()}>
                      {whitespace.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Self-Closing Tags */}
              <Select
                value={options.selfClosingTags}
                onValueChange={(value: 'auto' | 'always' | 'never') =>
                  setOptions(prev => ({ ...prev, selfClosingTags: value }))
                }
              >
                <SelectTrigger label="Self-Closing:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {XML_FORMAT_OPTIONS.selfClosingTags.map((selfClosing) => (
                    <SelectItem key={selfClosing.value} value={selfClosing.value}>
                      {selfClosing.label}
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
                    {XML_FORMAT_OPTIONS.indentSizes.map((indent) => (
                      <SelectItem key={indent.value} value={indent.value.toString()}>
                        {indent.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Panel */}
            <CodePanel
              title="XML Input"
              value={input}
              onChange={setInput}
              language="xml"
              height="500px"
              theme={theme}
              wrapText={inputWrapText}
              onWrapTextChange={setInputWrapText}
              showCopyButton={false}
              showClearButton={true}
              headerActions={
                <>
                  <LoadFileButton
                    accept=".xml,.svg,.xhtml,.xsd,.wsdl,*/*"
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
            <CodePanel
              title="Formatted XML"
              value={output}
              language="xml"
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              footerLeftContent={
                output && (
                  <>
                    <span>{getCharacterCount(output)} characters</span>
                    <span>{getLineCount(output)} lines</span>
                    {stats && <span>{stats.tags} tags</span>}
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
