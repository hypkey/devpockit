'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { LabeledInput } from '@/components/ui/labeled-input';
import { Switch } from '@/components/ui/switch';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { DEFAULT_IP_OPTIONS, IpCheckerOptions, IpInfo, formatIpInfo, getIpInfo } from '@/libs/ip-checker';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, BuildingOfficeIcon, ClockIcon, GlobeAltIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';

interface IpCheckerProps {
  className?: string;
  instanceId: string;
}

export function IpChecker({ className, instanceId }: IpCheckerProps) {
  const { toolState, updateToolState } = useToolState('ip-checker', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<IpCheckerOptions>(DEFAULT_IP_OPTIONS);
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [customIp, setCustomIp] = useState<string>('');

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Use ref to get current options in callback
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Track if we've already hydrated to prevent re-hydration on toolState changes
  const hasHydratedRef = useRef(false);

  const handleCheckMyIp = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const info = await getIpInfo();
      setIpInfo(info);

      const formatted = formatIpInfo(info, optionsRef.current);
      setOutput(formatted);
      setLastChecked(new Date().toLocaleString());
    } catch (err) {
      let errorMessage = 'Failed to get IP information';

      if (err instanceof Error) {
        if (err.message.includes('Rate limit')) {
          errorMessage = err.message;
        } else if (err.message.includes('All IP services failed')) {
          errorMessage = 'Unable to connect to IP services. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to reach IP services. This could be due to network issues or rate limiting. Please try again later.';
        } else if (err.message.includes('HTTP error')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }

      setError(errorMessage);
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCheckCustomIp = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const ipToCheck = customIp.trim();

      // Validate custom IP
      if (!ipToCheck) {
        setError('Please enter an IP address to check');
        setIsLoading(false);
        return;
      }

      const info = await getIpInfo(ipToCheck);
      setIpInfo(info);

      const formatted = formatIpInfo(info, optionsRef.current);
      setOutput(formatted);
      setLastChecked(new Date().toLocaleString());
    } catch (err) {
      let errorMessage = 'Failed to get IP information';

      if (err instanceof Error) {
        if (err.message.includes('Rate limit')) {
          errorMessage = err.message;
        } else if (err.message.includes('Invalid IP address')) {
          errorMessage = err.message;
        } else if (err.message.includes('All IP services failed')) {
          errorMessage = 'Unable to connect to IP services. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to reach IP services. This could be due to network issues or rate limiting. Please try again later.';
        } else if (err.message.includes('HTTP error')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }

      setError(errorMessage);
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  }, [customIp]);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    if (!hasHydratedRef.current && toolState) {
      hasHydratedRef.current = true;
      setIsHydrated(true);
      if (toolState.options) setOptions(toolState.options as IpCheckerOptions);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.ipInfo) setIpInfo(toolState.ipInfo as IpInfo);
      if (toolState.customIp) setCustomIp(toolState.customIp as string);
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
        ipInfo: ipInfo || undefined,
        customIp
      });
    }
  }, [options, output, error, ipInfo, isHydrated, updateToolState, customIp]);


  // Reset state when tool is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_IP_OPTIONS);
      setOutput('');
      setError('');
      setIpInfo(null);
      setLastChecked('');
      setCustomIp('');
    }
  }, [toolState, isHydrated]);

  const handleOptionChange = (key: keyof IpCheckerOptions, value: unknown) => {
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
          IP Address Lookup
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Look up information about any IP address or your current public IP address and network details
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* IP Input Section */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <LabeledInput
                  label="IP Address:"
                  value={customIp}
                  onChange={(value) => setCustomIp(value)}
                  placeholder="Enter IP address (e.g., 8.8.8.8 or 2001:4860:4860::8888)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading && customIp.trim()) {
                      handleCheckCustomIp();
                    }
                  }}
                  disabled={isLoading}
                  containerClassName="min-w-[650px] max-w-md"
                />

                {/* Check Custom IP Button */}
                <Button
                  onClick={handleCheckCustomIp}
                  disabled={isLoading || !customIp.trim()}
                  variant="default"
                  size="default"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    'Check Custom IP'
                  )}
                </Button>
              </div>

              {/* Check My IP Button */}
              <Button
                onClick={handleCheckMyIp}
                disabled={isLoading}
                variant="default"
                size="default"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  'Check My IP'
                )}
              </Button>
            </div>

            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Show Location */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={options.showLocation}
                  onCheckedChange={(checked) => handleOptionChange('showLocation', checked)}
                  size="sm"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  Location
                </span>
              </div>

              {/* Show ISP */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={options.showISP}
                  onCheckedChange={(checked) => handleOptionChange('showISP', checked)}
                  size="sm"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  ISP
                </span>
              </div>

              {/* Show Timezone */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={options.showTimezone}
                  onCheckedChange={(checked) => handleOptionChange('showTimezone', checked)}
                  size="sm"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  Timezone
                </span>
              </div>

              {/* Show IPv6 */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={options.showIPv6}
                  onCheckedChange={(checked) => handleOptionChange('showIPv6', checked)}
                  size="sm"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <GlobeAltIcon className="h-4 w-4" />
                  IPv6
                </span>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <CodePanel fillHeight={true}
            title="IP Information"
            value={output}
            language="json"
            height="500px"
            className="flex-1"
            theme={theme}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
            alwaysShowFooter={!!error || !!lastChecked || !!output}
            footerLeftContent={
              <div className="flex items-center gap-4 flex-wrap">
                {output && (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {getLineCount(output)} lines
                  </span>
                )}
                {lastChecked && !error && (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Last checked: {lastChecked}
                  </span>
                )}
                {error && (
                  <span className="text-red-700 dark:text-red-300 font-medium">
                    ⚠ {error}
                  </span>
                )}
                {error && lastChecked && (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Last checked: {lastChecked}
                  </span>
                )}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
