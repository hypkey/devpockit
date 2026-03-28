'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { CronFieldBuilder } from '@/components/tools/CronFieldBuilder';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LabeledInput } from '@/components/ui/labeled-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CRON_PRESETS,
  DEFAULT_CRON_PARSER_OPTIONS,
  TIMEZONES,
  type CronParserOptions,
  type CronFieldValue
} from '@/config/cron-parser-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { buildCronExpression, parseCronToBuilder, validateCronExpression } from '@/libs/cron-builder';
import { EXPORT_FORMATS, exportCronExpression } from '@/libs/cron-exporter';
import { parseCronExpression } from '@/libs/cron-parser';
import { cn } from '@/libs/utils';
import { ArrowDownTrayIcon, ChevronDownIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CronParserProps {
  className?: string;
  instanceId: string;
}

export function CronParser({ className, instanceId }: CronParserProps) {
  const { toolState, updateToolState } = useToolState('cron-parser', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<CronParserOptions>(DEFAULT_CRON_PARSER_OPTIONS);
  const [expression, setExpression] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('plain');
  const [compareTimezone, setCompareTimezone] = useState<string>('UTC');
  const [nextRunCount, setNextRunCount] = useState<number>(5);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as CronParserOptions);
      if (toolState.expression) setExpression(toolState.expression as string);
      if (toolState.preview) setPreview(toolState.preview as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.compareTimezone) setCompareTimezone(toolState.compareTimezone as string);
      if (toolState.nextRunCount) setNextRunCount(toolState.nextRunCount as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state whenever local state changes
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        expression,
        preview,
        error,
        compareTimezone,
        nextRunCount
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, expression, preview, error, compareTimezone, nextRunCount, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_CRON_PARSER_OPTIONS);
      setExpression('');
      setPreview('');
      setError('');
      setCompareTimezone('UTC');
      setNextRunCount(5);
    }
  }, [toolState, isHydrated]);

  // Build expression and preview when options change
  useEffect(() => {
    if (isHydrated) {
      const newExpression = buildCronExpression(options);
      setExpression(newExpression);
      updatePreview(newExpression);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, compareTimezone, nextRunCount, isHydrated]);

  const updatePreview = async (expr: string) => {
    if (!expr.trim()) {
      setPreview('');
      setError('');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const validation = validateCronExpression(expr);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid cron expression');
        setPreview('');
        return;
      }

      const timezone = options.timezone === 'local' ? undefined : options.timezone;
      const runCount = nextRunCount === 0 ? 0 : nextRunCount;
      const result = parseCronExpression(expr, runCount > 0 ? runCount : 1, timezone);
      if (result.isValid) {
        let previewText = `📅 Human Readable:\n${result.humanReadable}\n\n`;

        if (result.nextRuns.length > 0 && runCount > 0) {
          const cronTzLabel = options.timezone === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : options.timezone || 'UTC';
          const compareTzLabel = compareTimezone === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : compareTimezone || 'UTC';

          // Check if timezones are the same
          const cronTzValue = options.timezone === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : options.timezone || 'UTC';
          const compareTzValue = compareTimezone === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : compareTimezone || 'UTC';
          const timezonesMatch = cronTzValue === compareTzValue;

          previewText += `⏰ Next ${result.nextRuns.length} Execution Times:\n\n`;
          result.nextRuns.forEach((run, index) => {
            const date = new Date(run);

            // Format in cron timezone
            const cronFormatted = date.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'short',
              timeZone: timezone || undefined
            });

            previewText += `${index + 1}. Cron Timezone (${cronTzLabel}):\n   ${cronFormatted}\n`;

            // Only show comparison if timezones are different
            if (!timezonesMatch) {
              const compareTz = compareTimezone === 'local' ? undefined : compareTimezone;
              const compareFormatted = date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
                timeZone: compareTz || undefined
              });
              previewText += `   Compare Timezone (${compareTzLabel}):\n   ${compareFormatted}\n`;
            }

            previewText += '\n';
          });
        }

        setPreview(previewText);
      } else {
        setError(result.error || 'Invalid cron expression');
        setPreview('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate cron expression');
      setPreview('');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoadPreset = (preset: typeof CRON_PRESETS[0]) => {
    setOptions(preset.options);
    setError('');
  };

  const handleCopyExpression = async () => {
    if (expression) {
      await navigator.clipboard.writeText(expression);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async () => {
    if (!expression) return;

    const exported = exportCronExpression(expression, exportFormat, options);
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const format = EXPORT_FORMATS.find(f => f.id === exportFormat);
    a.download = `cron-expression.${format?.extension || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateField = (fieldName: keyof CronParserOptions, value: CronFieldValue) => {
    setOptions(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleExpressionInput = (value: string) => {
    setExpression(value);
    const parsed = parseCronToBuilder(value);
    if (parsed) {
      setOptions(parsed);
    }
    updatePreview(value);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          Cron Expression Parser
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Build and parse cron expressions visually with a step-by-step form builder. Get real-time validation and preview.
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Expression Display */}
            <div className="flex items-center gap-3">
              <LabeledInput
                label="Expression:"
                value={expression}
                onChange={handleExpressionInput}
                placeholder="e.g., 0 9 * * *"
                containerClassName="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyExpression}
                disabled={!expression || copied}
                className="h-10 px-3"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 text-xs"
                  >
                    Load Preset
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  {CRON_PRESETS.map((preset, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => handleLoadPreset(preset)}
                    >
                      <div className="flex flex-col">
                        <span>{preset.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{preset.expression}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Field Builders */}
          <div className="flex flex-wrap items-start gap-4">
            <CronFieldBuilder
              fieldName="minute"
              field={options.minute}
              onChange={(value) => updateField('minute', value)}
              className="min-w-[480px] max-w-[480px]"
            />
            <CronFieldBuilder
              fieldName="hour"
              field={options.hour}
              onChange={(value) => updateField('hour', value)}
              className="min-w-[480px] max-w-[480px]"
            />
            <CronFieldBuilder
              fieldName="day"
              field={options.day}
              onChange={(value) => updateField('day', value)}
              className="min-w-[480px] max-w-[480px]"
            />
            <CronFieldBuilder
              fieldName="month"
              field={options.month}
              onChange={(value) => updateField('month', value)}
              className="min-w-[480px] max-w-[480px]"
            />
            <CronFieldBuilder
              fieldName="weekday"
              field={options.weekday}
              onChange={(value) => updateField('weekday', value)}
              className="min-w-[480px] max-w-[480px]"
            />
          </div>

          {/* Timezone Options */}
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={nextRunCount === 0 ? 'none' : nextRunCount.toString()}
              onValueChange={(value) => {
                if (value === 'none') {
                  setNextRunCount(0);
                } else {
                  setNextRunCount(parseInt(value));
                }
              }}
            >
              <SelectTrigger label="Number of Runs:" className="w-[220px]" valueAlign="center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="3">3 runs</SelectItem>
                <SelectItem value="5">5 runs</SelectItem>
                <SelectItem value="10">10 runs</SelectItem>
                <SelectItem value="20">20 runs</SelectItem>
                <SelectItem value="50">50 runs</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={options.timezone || 'UTC'}
              onValueChange={(value) => {
                setOptions(prev => ({ ...prev, timezone: value }));
              }}
            >
              <SelectTrigger label="Cron Timezone:" className="w-[280px]" valueAlign="center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={compareTimezone}
              onValueChange={setCompareTimezone}
            >
              <SelectTrigger label="Compare Timezone:" className="w-[310px]" valueAlign="center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Panel */}
          <CodePanel fillHeight={true}
            title="Preview"
            value={preview || (isValidating ? 'Validating...' : '// Build your cron expression above to see preview')}
            language="plaintext"
            height="400px"
            className="flex-1"
            theme={theme}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
            footerLeftContent={
              preview && (
                <>
                  <span className="text-green-600 dark:text-green-400">✓ Valid expression</span>
                </>
              )
            }
            footerRightContent={
              <div className="flex items-center gap-3">
                <Select
                  value={exportFormat}
                  onValueChange={setExportFormat}
                >
                  <SelectTrigger className="min-w-[180px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        {format.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!expression}
                  className="h-8 px-3 text-xs"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
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

