'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  DEFAULT_SYSTEM_INFO_OPTIONS,
  SystemInfoOptions,
  SystemInfo as SystemInfoType,
  collectSystemInfo,
  formatSystemInfo,
} from '@/libs/system-info';
import { SYSTEM_INFO_FORMAT_OPTIONS } from '@/config/system-info-config';
import { cn } from '@/libs/utils';
import {
  ArrowPathIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PhotoIcon,
  ShieldCheckIcon,
  Square3Stack3DIcon,
  VideoCameraIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SystemInfoProps {
  className?: string;
  instanceId: string;
}

export function SystemInfo({ className, instanceId }: SystemInfoProps) {
  const { toolState, updateToolState } = useToolState('system-info', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<SystemInfoOptions>(DEFAULT_SYSTEM_INFO_OPTIONS);
  const [output, setOutput] = useState<string>(toolState?.output || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>(toolState?.error || '');
  const [systemInfo, setSystemInfo] = useState<SystemInfoType | null>(
    (toolState?.systemInfo as SystemInfoType) || null
  );
  const [lastChecked, setLastChecked] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Use ref to get current options in callback
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Track if we've already hydrated to prevent re-hydration on toolState changes
  const hasHydratedRef = useRef(false);

  const handleCollectInfo = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const info = await collectSystemInfo();
      setSystemInfo(info);

      const formatted = formatSystemInfo(info, optionsRef.current);
      setOutput(formatted);
      setLastChecked(new Date().toLocaleString());
    } catch (err) {
      let errorMessage = 'Failed to collect system information';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    if (!hasHydratedRef.current && toolState) {
      hasHydratedRef.current = true;
      setIsHydrated(true);
      if (toolState.options) setOptions(toolState.options as SystemInfoOptions);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.systemInfo) setSystemInfo(toolState.systemInfo as SystemInfoType);
    } else if (!hasHydratedRef.current) {
      // Still mark as hydrated even if no toolState exists
      hasHydratedRef.current = true;
      setIsHydrated(true);
    }
  }, [toolState]);

  // Update persistent state
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        output,
        error,
        systemInfo: systemInfo || undefined,
      });
    }
  }, [options, output, error, systemInfo, isHydrated, updateToolState]);

  // Auto-collect on mount if no data exists
  useEffect(() => {
    if (isHydrated && !systemInfo && !isLoading) {
      handleCollectInfo();
    }
  }, [isHydrated, systemInfo, isLoading, handleCollectInfo]);

  // Reset state when tool is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_SYSTEM_INFO_OPTIONS);
      setOutput('');
      setError('');
      setSystemInfo(null);
      setLastChecked('');
    }
  }, [toolState, isHydrated]);

  // Update output when options change
  useEffect(() => {
    if (isHydrated && systemInfo) {
      const formatted = formatSystemInfo(systemInfo, options);
      setOutput(formatted);
    }
  }, [options, systemInfo, isHydrated]);

  const handleOptionChange = (key: keyof SystemInfoOptions, value: unknown) => {
    setOptions(prev => ({ ...prev, [key]: value }));
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
          System Information
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          View detailed information about your browser, device, display, network, and system capabilities
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Format Selection */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={options.format}
                onValueChange={(value) => handleOptionChange('format', value as 'json' | 'formatted')}
              >
                <SelectTrigger label="Output Format:">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_INFO_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Collect Button */}
              <Button
                onClick={handleCollectInfo}
                disabled={isLoading}
                variant="default"
                size="default"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Collecting...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh Info
                  </>
                )}
              </Button>
            </div>

            {/* Section Toggles */}
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Show Sections:
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showBrowser}
                    onCheckedChange={(checked) => handleOptionChange('showBrowser', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <GlobeAltIcon className="h-4 w-4" />
                    Browser
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showDevice}
                    onCheckedChange={(checked) => handleOptionChange('showDevice', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <DevicePhoneMobileIcon className="h-4 w-4" />
                    Device
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showDisplay}
                    onCheckedChange={(checked) => handleOptionChange('showDisplay', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <ComputerDesktopIcon className="h-4 w-4" />
                    Display
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showNetwork}
                    onCheckedChange={(checked) => handleOptionChange('showNetwork', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <WifiIcon className="h-4 w-4" />
                    Network
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showPerformance}
                    onCheckedChange={(checked) => handleOptionChange('showPerformance', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <CpuChipIcon className="h-4 w-4" />
                    Performance
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showStorage}
                    onCheckedChange={(checked) => handleOptionChange('showStorage', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <Square3Stack3DIcon className="h-4 w-4" />
                    Storage
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showMedia}
                    onCheckedChange={(checked) => handleOptionChange('showMedia', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <VideoCameraIcon className="h-4 w-4" />
                    Media
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showPermissions}
                    onCheckedChange={(checked) => handleOptionChange('showPermissions', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <LockClosedIcon className="h-4 w-4" />
                    Permissions
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showTimeLocale}
                    onCheckedChange={(checked) => handleOptionChange('showTimeLocale', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <PhotoIcon className="h-4 w-4" />
                    Time & Locale
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.showSecurity}
                    onCheckedChange={(checked) => handleOptionChange('showSecurity', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <ShieldCheckIcon className="h-4 w-4" />
                    Security
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <CodePanel fillHeight={true}
            title="System Information"
            value={output}
            language={options.format === 'json' ? 'json' : 'text'}
            height="500px"
            className="flex-1"
            theme={theme}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
            footerLeftContent={
              output && (
                <>
                  <span>{getLineCount(output)} lines</span>
                  {lastChecked && <span>Last checked: {lastChecked}</span>}
                </>
              )
            }
          />

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

