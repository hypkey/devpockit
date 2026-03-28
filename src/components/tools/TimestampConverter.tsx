'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LabeledInput } from '@/components/ui/labeled-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DEFAULT_OPTIONS,
  INPUT_FORMATS,
  TIMESTAMP_EXAMPLES,
  TIMESTAMP_PRESETS,
  TIMEZONES,
  type InputFormat,
} from '@/config/timestamp-converter-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface TimestampConverterProps {
  className?: string;
  instanceId: string;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffSec) < 60) {
    return diffSec === 0 ? 'now' : diffSec > 0 ? `in ${diffSec}s` : `${Math.abs(diffSec)}s ago`;
  }
  if (Math.abs(diffMin) < 60) {
    return diffMin > 0 ? `in ${diffMin}m` : `${Math.abs(diffMin)}m ago`;
  }
  if (Math.abs(diffHour) < 24) {
    return diffHour > 0 ? `in ${diffHour}h` : `${Math.abs(diffHour)}h ago`;
  }
  return diffDay > 0 ? `in ${diffDay}d` : `${Math.abs(diffDay)}d ago`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function parseTimestamp(input: string, format: InputFormat): Date | null {
  if (!input.trim()) return null;

  const trimmed = input.trim();

  if (format === 'auto') {
    if (/^\d{10}$/.test(trimmed)) {
      return new Date(parseInt(trimmed) * 1000);
    }
    if (/^\d{13}$/.test(trimmed)) {
      return new Date(parseInt(trimmed));
    }
    if (/^\d{16}$/.test(trimmed)) {
      return new Date(parseInt(trimmed) / 1000);
    }
    if (/^\d{19}$/.test(trimmed)) {
      return new Date(parseInt(trimmed) / 1000000);
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  }

  switch (format) {
    case 'unix-s':
      return new Date(parseInt(trimmed) * 1000);
    case 'unix-ms':
      return new Date(parseInt(trimmed));
    case 'unix-us':
      return new Date(parseInt(trimmed) / 1000);
    case 'unix-ns':
      return new Date(parseInt(trimmed) / 1000000);
    case 'iso8601':
    case 'rfc2822':
    case 'custom': {
      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    default:
      return null;
  }
}

function formatInTimezone(date: Date, timezone: string): string {
  try {
    if (timezone === 'local') {
      return date.toLocaleString();
    }
    return date.toLocaleString('en-US', { timeZone: timezone });
  } catch {
    return date.toLocaleString();
  }
}

function convertTimestamp(date: Date, timezone: string): string {
  const ms = date.getTime();
  const tz = timezone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone;
  const offset = `UTC${date.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(Math.floor(date.getTimezoneOffset() / 60)).toString().padStart(2, '0')}:${Math.abs(date.getTimezoneOffset() % 60).toString().padStart(2, '0')}`;

  const result = `=== Unix Timestamps ===
Seconds:      ${Math.floor(ms / 1000)}
Milliseconds: ${ms}
Microseconds: ${ms * 1000}
Nanoseconds:  ${ms * 1000000}

=== Standard Formats ===
ISO 8601:     ${date.toISOString()}
RFC 2822:     ${date.toUTCString()}
Relative:     ${getRelativeTime(date)}

=== Time Display ===
${tz}: ${formatInTimezone(date, timezone)}
UTC:          ${date.toUTCString()}
Offset:       ${offset}

=== Date Information ===
Day of Week:  ${date.toLocaleDateString('en-US', { weekday: 'long' })}
Week Number:  ${getWeekNumber(date)}
Day of Year:  ${getDayOfYear(date)}
Quarter:      Q${Math.floor(date.getMonth() / 3) + 1}
Leap Year:    ${new Date(date.getFullYear(), 1, 29).getDate() === 29 ? 'Yes' : 'No'}`;

  return result;
}

export function TimestampConverter({ className, instanceId }: TimestampConverterProps) {
  const { toolState, updateToolState } = useToolState('timestamp-converter', instanceId);

  const [input, setInput] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<InputFormat>(DEFAULT_OPTIONS.inputFormat);
  const [timezone, setTimezone] = useState<string>(DEFAULT_OPTIONS.timezone);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Hydrate state
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.inputFormat) setInputFormat(toolState.inputFormat as InputFormat);
      if (toolState.timezone) setTimezone(toolState.timezone as string);
      if (toolState.output) setOutput(toolState.output as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state
  useEffect(() => {
    if (isHydrated) {
      updateToolState({ input, inputFormat, timezone, output });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, inputFormat, timezone, output, isHydrated]);

  // Reset state when tool is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setInput('');
      setInputFormat(DEFAULT_OPTIONS.inputFormat);
      setTimezone(DEFAULT_OPTIONS.timezone);
      setOutput('');
      setError('');
    }
  }, [toolState, isHydrated]);

  const handleConvert = async () => {
    if (!input.trim()) {
      setError('Please enter a timestamp');
      setOutput('');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const parsed = parseTimestamp(input, inputFormat);
      if (!parsed) {
        throw new Error('Unable to parse timestamp. Check the format and try again.');
      }

      setOutput(convertTimestamp(parsed, timezone));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
      setOutput('');
    } finally {
      setIsConverting(false);
    }
  };

  const handleLoadExample = (value: string, format: InputFormat) => {
    setInput(value);
    setInputFormat(format);
    setError('');
  };

  const handleLoadPreset = (getValue: () => number) => {
    setInput(Math.floor(getValue() / 1000).toString());
    setInputFormat('unix-s');
    setError('');
  };

  const handleUseNow = () => {
    const now = new Date();
    setInput(Math.floor(now.getTime() / 1000).toString());
    setInputFormat('unix-s');
    setError('');
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
          Timestamp Converter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Convert between Unix timestamps, ISO 8601, RFC 2822, and other date formats across timezones
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Input Row */}
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={inputFormat}
                onValueChange={(value) => setInputFormat(value as InputFormat)}
              >
                <SelectTrigger label="Format:" className="min-w-[250px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <LabeledInput
                label="Timestamp:"
                value={input}
                onChange={setInput}
                placeholder="e.g., 1734537600"
                onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
                containerClassName="flex-1 min-w-[200px]"
              />

              <Button variant="outline" size="sm" className="h-10 w-[60px] shrink-0 px-3 text-xs" onClick={handleUseNow}>
                Now
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-[100px] shrink-0 px-3 text-xs">
                    Examples
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  {TIMESTAMP_EXAMPLES.map((example) => (
                    <DropdownMenuItem key={example.label} onClick={() => handleLoadExample(example.value, example.format)}>
                      <div className="flex flex-col">
                        <span>{example.label}</span>
                        <span className="text-xs text-muted-foreground font-mono">{example.value.substring(0, 25)}{example.value.length > 25 ? '...' : ''}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-[90px] shrink-0 px-3 text-xs">
                    Presets
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {TIMESTAMP_PRESETS.map((preset) => (
                    <DropdownMenuItem key={preset.label} onClick={() => handleLoadPreset(preset.getValue)}>
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Options Row */}
            <div className="flex items-center gap-3">
              <Select
                value={timezone}
                onValueChange={setTimezone}
              >
                <SelectTrigger label="Timezone:" className="min-w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleConvert}
                disabled={isConverting || !input.trim()}
                variant="default"
                size="default"
                className="w-[100px]"
              >
                {isConverting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    ...
                  </>
                ) : (
                  'Convert'
                )}
              </Button>
            </div>
          </div>

          {/* Output Panel */}
          <CodePanel fillHeight={true}
            title="Conversion Result"
            value={output}
            language="plaintext"
            height="500px"
            className="flex-1"
            theme={theme}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
            footerLeftContent={
              output && <span>{getLineCount(output)} lines</span>
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
