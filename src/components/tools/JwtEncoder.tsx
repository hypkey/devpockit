'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel, type CodeOutputTab } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SecretInput } from '@/components/ui/secret-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_JWT_ENCODER_OPTIONS,
  JWT_ENCODER_ALGORITHMS,
  JWT_EXPIRATION_OPTIONS,
  JWT_TEMPLATES,
  type JwtEncoderOptions
} from '@/config/jwt-encoder-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { encodeJwt, formatJson, getDefaultHeader, validateJson, type JwtEncodeResult } from '@/libs/jwt-encoder';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

interface JwtEncoderProps {
  className?: string;
  instanceId: string;
}

export function JwtEncoder({ className, instanceId }: JwtEncoderProps) {
  const { toolState, updateToolState } = useToolState('jwt-encoder', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<JwtEncoderOptions>(DEFAULT_JWT_ENCODER_OPTIONS);
  const [encodedResult, setEncodedResult] = useState<JwtEncodeResult | null>(null);
  const [isEncoding, setIsEncoding] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'token' | 'header' | 'payload'>('token');
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [headerWrapText, setHeaderWrapText] = useState(true);
  const [payloadWrapText, setPayloadWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) {
        const opts = toolState.options as JwtEncoderOptions;
        setOptions(opts);
      }
      if (toolState.encodedResult) setEncodedResult(toolState.encodedResult as JwtEncodeResult);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.activeTab) setActiveTab(toolState.activeTab as typeof activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state whenever local state changes
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        encodedResult: encodedResult || undefined,
        error,
        activeTab
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, encodedResult, error, activeTab, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_JWT_ENCODER_OPTIONS);
      setEncodedResult(null);
      setError('');
      setActiveTab('token');
    }
  }, [toolState, isHydrated]);

  // Update header when algorithm changes
  useEffect(() => {
    const headerValidation = validateJson(options.header);
    if (headerValidation.isValid) {
      try {
        const headerObj = JSON.parse(options.header);
        if (headerObj.alg !== options.algorithm) {
          const newHeader = { ...getDefaultHeader(options.algorithm), ...headerObj, alg: options.algorithm };
          setOptions(prev => ({ ...prev, header: JSON.stringify(newHeader, null, 2) }));
        }
      } catch {
        // If header is invalid, set default
        const newHeader = getDefaultHeader(options.algorithm);
        setOptions(prev => ({ ...prev, header: JSON.stringify(newHeader, null, 2) }));
      }
    } else {
      // If header is invalid JSON, set default
      const newHeader = getDefaultHeader(options.algorithm);
      setOptions(prev => ({ ...prev, header: JSON.stringify(newHeader, null, 2) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.algorithm]);

  const handleEncode = async () => {
    // Validate header JSON
    const headerValidation = validateJson(options.header);
    if (!headerValidation.isValid) {
      setError(`Invalid header JSON: ${headerValidation.error}`);
      return;
    }

    // Validate payload JSON
    const payloadValidation = validateJson(options.payload);
    if (!payloadValidation.isValid) {
      setError(`Invalid payload JSON: ${payloadValidation.error}`);
      return;
    }

    // Validate secret
    if (!options.secret || options.secret.trim().length === 0) {
      setError('Secret is required for signing the token');
      return;
    }

    setIsEncoding(true);
    setError('');

    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await encodeJwt(options);
      setEncodedResult(result);

      if (!result.isValid) {
        setError(result.error || 'Failed to encode JWT');
      } else {
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encode JWT');
      setEncodedResult(null);
    } finally {
      setIsEncoding(false);
    }
  };

  const handleLoadTemplate = (template: typeof JWT_TEMPLATES[0]) => {
    setOptions(prev => ({
      ...prev,
      header: JSON.stringify(template.header, null, 2),
      payload: JSON.stringify(template.payload, null, 2)
    }));
    setError('');
    setEncodedResult(null);
  };

  const handleHeaderChange = (value: string) => {
    setOptions(prev => ({ ...prev, header: value }));
    // Try to format JSON on blur
    const validation = validateJson(value);
    if (validation.isValid) {
      const formatted = formatJson(value);
      setOptions(prev => ({ ...prev, header: formatted }));
    }
  };

  const handlePayloadChange = (value: string) => {
    setOptions(prev => ({ ...prev, payload: value }));
    // Try to format JSON on blur
    const validation = validateJson(value);
    if (validation.isValid) {
      const formatted = formatJson(value);
      setOptions(prev => ({ ...prev, payload: formatted }));
    }
  };

  // Prepare tabs for CodePanel
  const outputTabs: CodeOutputTab[] = useMemo(() => {
    if (!encodedResult || !encodedResult.isValid) {
      return [];
    }

    return [
      {
        id: 'token',
        label: 'Token',
        value: encodedResult.token,
        language: 'plaintext'
      },
      {
        id: 'header',
        label: 'Header',
        value: JSON.stringify(encodedResult.header, null, 2),
        language: 'json'
      },
      {
        id: 'payload',
        label: 'Payload',
        value: JSON.stringify(encodedResult.payload, null, 2),
        language: 'json'
      }
    ];
  }, [encodedResult]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          JWT Encoder
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Create and encode JWT tokens with custom headers and payloads.
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
                onValueChange={(value) => setOptions(prev => ({ ...prev, algorithm: value }))}
              >
                <SelectTrigger label="Algorithm:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JWT_ENCODER_ALGORITHMS.map((alg) => (
                    <SelectItem key={alg.value} value={alg.value}>
                      {alg.symbol} {alg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Secret Input with Toggle */}
              <SecretInput
                label="Secret:"
                value={options.secret}
                onChange={(value) => setOptions(prev => ({ ...prev, secret: value }))}
                placeholder="Enter secret for signing"
                name="jwt-secret"
                id="jwt-secret-input"
                containerClassName="min-w-[300px]"
              />
            </div>

            {/* Auto-generate Options Row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch
                  checked={options.autoGenerateIat}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, autoGenerateIat: checked }))}
                  size="sm"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Auto-generate iat (Issued At)</span>
              </div>

              {/* Expiration Dropdown */}
              <Select
                value={options.expirationMinutes === null ? 'null' : options.expirationMinutes.toString()}
                onValueChange={(value) => {
                  const expirationValue = value === 'null' ? null : parseInt(value, 10);
                  setOptions(prev => ({ ...prev, expirationMinutes: expirationValue }));
                }}
              >
                <SelectTrigger label="Expiration:" className="min-w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JWT_EXPIRATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value === null ? 'null' : opt.value.toString()} value={opt.value === null ? 'null' : opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Header Input Panel */}
          <CodePanel fillHeight={true}
            title="Header (JSON)"
            value={options.header}
            onChange={handleHeaderChange}
            language="json"
            height="150px"
            theme={theme}
            wrapText={headerWrapText}
            onWrapTextChange={setHeaderWrapText}
            placeholder='{"alg": "HS256", "typ": "JWT"}'
            showClearButton={false}
          />

          {/* Payload Input Panel */}
          <CodePanel fillHeight={true}
            title="Payload (JSON)"
            value={options.payload}
            onChange={handlePayloadChange}
            language="json"
            height="200px"
            theme={theme}
            wrapText={payloadWrapText}
            onWrapTextChange={setPayloadWrapText}
            placeholder='{"sub": "1234567890", "name": "John Doe"}'
            showClearButton={false}
            headerActions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    Load Template
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {JWT_TEMPLATES.map((template, index) => (
                    <DropdownMenuItem key={index} onClick={() => handleLoadTemplate(template)}>
                      {template.name} - {template.description}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            }
            footerRightContent={
              <Button
                onClick={handleEncode}
                disabled={isEncoding}
                variant="default"
                size="sm"
              >
                {isEncoding ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Encoding...
                  </>
                ) : (
                  'Encode'
                )}
              </Button>
            }
          />

          {/* Output Panel */}
          {encodedResult && encodedResult.isValid ? (
            <CodePanel fillHeight={true}
              tabs={outputTabs}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
              height="300px"
              className="flex-1"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              footerLeftContent={
                encodedResult && (
                  <>
                    <span>{encodedResult.statistics.tokenSize} bytes</span>
                    <span>{encodedResult.statistics.claimCount} claims</span>
                  </>
                )
              }
            />
          ) : (
            error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

