'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_QR_OPTIONS,
  QR_CODE_COLOR_PRESETS,
  QR_CODE_ERROR_CORRECTIONS,
  QR_CODE_EXAMPLES,
  QR_CODE_FORMATS,
  QR_CODE_SIZE_LIMITS,
  QR_CODE_TYPES
} from '@/config/qr-code-generator-config';
import {
  copyQrCodeToClipboard,
  downloadQrCode,
  generateQrCode,
  getQrCodeStats,
  type QrCodeInput,
  type QrCodeOptions,
  type QrCodeResult
} from '@/libs/qr-code-generator';
import { cn } from '@/libs/utils';
import { ArrowDownTrayIcon, ArrowPathIcon, ChevronDownIcon, ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

interface QrCodeGeneratorProps {
  className?: string;
  instanceId: string;
}

export function QrCodeGenerator({ className, instanceId }: QrCodeGeneratorProps) {
  const { toolState, updateToolState } = useToolState('qr-code-generator', instanceId);

  const [options, setOptions] = useState<QrCodeOptions>(
    (toolState?.options as QrCodeOptions) || DEFAULT_QR_OPTIONS
  );
  const [input, setInput] = useState<QrCodeInput>(
    (toolState?.input as QrCodeInput) || { text: '' }
  );
  const [output, setOutput] = useState<string>(toolState?.output || '');
  const [qrCodeResult, setQrCodeResult] = useState<QrCodeResult | null>(
    (toolState?.qrCodeResult as QrCodeResult) || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>(toolState?.error || '');
  const [stats, setStats] = useState<{
    type: string;
    size: number;
    errorCorrection: string;
    format: string;
    dataUrlLength: number;
    estimatedCapacity: number;
  } | null>(
    (toolState?.stats as {
      type: string;
      size: number;
      errorCorrection: string;
      format: string;
      dataUrlLength: number;
      estimatedCapacity: number;
    }) || null
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sizeInput, setSizeInput] = useState<string>('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Track if we've already hydrated to prevent re-hydration on toolState changes
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      setIsHydrated(true);
      if (toolState?.options) {
        const opts = toolState.options as QrCodeOptions;
        setSizeInput(opts.size.toString());
      } else {
        setSizeInput(DEFAULT_QR_OPTIONS.size.toString());
      }
    }
  }, [toolState]);

  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        input,
        output,
        error,
        qrCodeResult: qrCodeResult || undefined,
        stats: stats || undefined
      });
    }
  }, [options, input, output, error, qrCodeResult, stats, isHydrated, updateToolState]);

  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_QR_OPTIONS);
      setSizeInput(DEFAULT_QR_OPTIONS.size.toString());
      setInput({ text: '' });
      setOutput('');
      setQrCodeResult(null);
      setError('');
      setStats(null);
    }
  }, [toolState, isHydrated]);

  // Sync sizeInput when options.size changes externally
  useEffect(() => {
    setSizeInput(options.size.toString());
  }, [options.size]);

  const handleGenerateQrCode = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const result = await generateQrCode(input, optionsRef.current);
      setQrCodeResult(result);
      setOutput(result.dataUrl);

      const qrStats = getQrCodeStats(result);
      setStats(qrStats);
    } catch (err) {
      let errorMessage = 'Failed to generate QR code';

      if (err instanceof Error) {
        if (err.message.includes('Text is required')) {
          errorMessage = 'Please enter some text to generate a QR code';
        } else if (err.message.includes('URL is required')) {
          errorMessage = 'Please enter a URL to generate a QR code';
        } else if (err.message.includes('Contact name is required')) {
          errorMessage = 'Please enter a contact name';
        } else if (err.message.includes('WiFi SSID is required')) {
          errorMessage = 'Please enter a WiFi SSID';
        } else if (err.message.includes('Phone number is required')) {
          errorMessage = 'Please enter a phone number for SMS QR code';
        } else if (err.message.includes('Email address is required')) {
          errorMessage = 'Please enter an email address';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setOutput('');
      setQrCodeResult(null);
      setStats(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyOutput = async () => {
    if (!qrCodeResult) return;

    try {
      await copyQrCodeToClipboard(qrCodeResult);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeResult) return;

    try {
      downloadQrCode(qrCodeResult);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to download:', err);
    }
  };

  const handleOptionChange = (key: keyof QrCodeOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleSizeChange = (value: string) => {
    setSizeInput(value);
    if (value === '') {
      return;
    }
    const size = parseInt(value, 10);
    if (!isNaN(size) && size >= QR_CODE_SIZE_LIMITS.min && size <= QR_CODE_SIZE_LIMITS.max) {
      handleOptionChange('size', size);
    }
  };

  const handleSizeBlur = () => {
    if (sizeInput === '' || sizeInput.trim() === '') {
      setSizeInput(QR_CODE_SIZE_LIMITS.min.toString());
      handleOptionChange('size', QR_CODE_SIZE_LIMITS.min);
      return;
    }

    const size = parseInt(sizeInput, 10);

    if (isNaN(size) || size < QR_CODE_SIZE_LIMITS.min) {
      setSizeInput(QR_CODE_SIZE_LIMITS.min.toString());
      handleOptionChange('size', QR_CODE_SIZE_LIMITS.min);
    } else if (size > QR_CODE_SIZE_LIMITS.max) {
      setSizeInput(QR_CODE_SIZE_LIMITS.max.toString());
      handleOptionChange('size', QR_CODE_SIZE_LIMITS.max);
    } else {
      handleOptionChange('size', size);
    }
  };

  const handleInputChange = (key: keyof QrCodeInput, value: any) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const handleContactChange = (key: string, value: string) => {
    setInput(prev => ({
      ...prev,
      contact: {
        name: '',
        ...(prev.contact || {}),
        [key]: value
      }
    }));
  };

  const handleWifiChange = (key: string, value: any) => {
    setInput(prev => ({
      ...prev,
      wifi: {
        ssid: '',
        password: '',
        security: 'WPA' as const,
        ...(prev.wifi || {}),
        [key]: value
      }
    }));
  };

  const handleSmsChange = (key: string, value: string) => {
    setInput(prev => ({
      ...prev,
      sms: {
        phone: '',
        message: '',
        ...(prev.sms || {}),
        [key]: value
      }
    }));
  };

  const handleEmailChange = (key: string, value: string) => {
    setInput(prev => ({
      ...prev,
      email: {
        to: '',
        ...(prev.email || {}),
        [key]: value
      }
    }));
  };

  const handleColorPreset = (preset: typeof QR_CODE_COLOR_PRESETS[0]) => {
    setOptions(prev => ({
      ...prev,
      color: {
        dark: preset.dark,
        light: preset.light
      }
    }));
  };

  const handleExample = (example: typeof QR_CODE_EXAMPLES[keyof typeof QR_CODE_EXAMPLES]) => {
    setInput(example.input);
    setOptions(example.options);
  };

  const renderInputFields = () => {
    switch (options.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              placeholder="Enter text content for QR code..."
              value={input.text || ''}
              onChange={(e) => handleInputChange('text', e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        );

      case 'url':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={input.url || ''}
              onChange={(e) => handleInputChange('url', e.target.value)}
            />
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name *</Label>
                <Input
                  id="contact-name"
                  placeholder="John Doe"
                  value={input.contact?.name || ''}
                  onChange={(e) => handleContactChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  placeholder="+1-555-123-4567"
                  value={input.contact?.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="john@example.com"
                  value={input.contact?.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-organization">Organization</Label>
                <Input
                  id="contact-organization"
                  placeholder="Company Name"
                  value={input.contact?.organization || ''}
                  onChange={(e) => handleContactChange('organization', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-title">Title</Label>
                <Input
                  id="contact-title"
                  placeholder="Software Developer"
                  value={input.contact?.title || ''}
                  onChange={(e) => handleContactChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-address">Address</Label>
                <Input
                  id="contact-address"
                  placeholder="123 Main St, City, State 12345"
                  value={input.contact?.address || ''}
                  onChange={(e) => handleContactChange('address', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wifi-ssid">Network Name (SSID) *</Label>
                <Input
                  id="wifi-ssid"
                  placeholder="MyWiFiNetwork"
                  value={input.wifi?.ssid || ''}
                  onChange={(e) => handleWifiChange('ssid', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifi-password">Password</Label>
                <div className="relative">
                  <Input
                    id="wifi-password"
                    type={showWifiPassword ? 'text' : 'password'}
                    placeholder="password123"
                    value={input.wifi?.password || ''}
                    onChange={(e) => handleWifiChange('password', e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWifiPassword(!showWifiPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label={showWifiPassword ? 'Hide password' : 'Show password'}
                  >
                    {showWifiPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifi-security">Security Type</Label>
                <Select
                  value={input.wifi?.security || 'WPA'}
                  onValueChange={(value) => handleWifiChange('security', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nopass">No Password</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="wifi-hidden"
                  checked={input.wifi?.hidden || false}
                  onCheckedChange={(checked) => handleWifiChange('hidden', checked)}
                />
                <Label htmlFor="wifi-hidden">Hidden Network</Label>
              </div>
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sms-phone">Phone Number *</Label>
                <Input
                  id="sms-phone"
                  placeholder="+1-555-123-4567"
                  value={input.sms?.phone || ''}
                  onChange={(e) => handleSmsChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-message">Message *</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Enter your message..."
                  value={input.sms?.message || ''}
                  onChange={(e) => handleSmsChange('message', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-to">Email Address *</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={input.email?.to || ''}
                  onChange={(e) => handleEmailChange('to', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="Email Subject"
                  value={input.email?.subject || ''}
                  onChange={(e) => handleEmailChange('subject', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email-body">Message Body</Label>
                <Textarea
                  id="email-body"
                  placeholder="Enter your email message..."
                  value={input.email?.body || ''}
                  onChange={(e) => handleEmailChange('body', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          QR Code Generator
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Generate QR codes for text, URLs, contacts, WiFi, SMS, and email with customizable options
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* QR Code Type */}
            <Select
              value={options.type}
              onValueChange={(value) => handleOptionChange('type', value)}
            >
              <SelectTrigger label="QR Type:" className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_CODE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.symbol} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Size Input with inline label */}
            <div className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-background pl-3 pr-2 py-[9.5px] text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 dark:border-neutral-700 w-[160px]">
              <div className="flex items-center gap-3 text-sm leading-normal tracking-[0.07px] flex-1 min-w-0">
                <span className="text-neutral-500 whitespace-nowrap dark:text-neutral-400">Size:</span>
                <input
                  type="number"
                  min={QR_CODE_SIZE_LIMITS.min}
                  max={QR_CODE_SIZE_LIMITS.max}
                  value={sizeInput}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  onBlur={handleSizeBlur}
                  className="font-mono bg-transparent text-neutral-900 dark:text-neutral-100 outline-hidden flex-1 min-w-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-neutral-500 whitespace-nowrap dark:text-neutral-400 text-xs">px</span>
              </div>
            </div>

            {/* Error Correction */}
            <Select
              value={options.errorCorrection}
              onValueChange={(value) => handleOptionChange('errorCorrection', value)}
            >
              <SelectTrigger label="Error Correction:" className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_CODE_ERROR_CORRECTIONS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.symbol} {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Format */}
            <Select
              value={options.format}
              onValueChange={(value) => handleOptionChange('format', value)}
            >
              <SelectTrigger label="Format:" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_CODE_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Color Theme */}
            <Select
              value={QR_CODE_COLOR_PRESETS.find(preset =>
                preset.dark === options.color.dark && preset.light === options.color.light
              )?.name || 'Default'}
              onValueChange={(value) => {
                const preset = QR_CODE_COLOR_PRESETS.find(p => p.name === value);
                if (preset) {
                  handleColorPreset(preset);
                }
              }}
            >
              <SelectTrigger label="Theme:" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_CODE_COLOR_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: preset.dark }}
                      />
                      {preset.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* Main Content - Side by Side */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title="Input Data"
              height="600px"
              showCopyButton={false}
              showWrapToggle={false}
              headerActions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      Load Examples
                      <ChevronDownIcon className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(QR_CODE_EXAMPLES).map(([key, example]) => (
                      <DropdownMenuItem key={key} onClick={() => handleExample(example)}>
                        {example.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerRightContent={
                <Button
                  onClick={handleGenerateQrCode}
                  disabled={isGenerating}
                  size="sm"
                  className="h-8 px-4"
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
              }
            >
              {renderInputFields()}
            </CodePanel>

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              title="Generated QR Code"
              height="600px"
              showCopyButton={false}
              showWrapToggle={false}
              headerActions={
                qrCodeResult && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyOutput}
                      disabled={copySuccess}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                    </button>
                    <button
                      onClick={handleDownloadQrCode}
                      disabled={downloadSuccess}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                    </button>
                  </div>
                )
              }
              footerLeftContent={
                stats && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">{stats.type}</Badge>
                    <Badge variant="secondary" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">{stats.size}px</Badge>
                    <Badge variant="secondary" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">EC: {stats.errorCorrection}</Badge>
                    <Badge variant="secondary" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">{stats.format.toUpperCase()}</Badge>
                  </div>
                )
              }
              alwaysShowFooter={true}
            >
              <div className="h-full flex flex-col items-center justify-center p-4">
                {qrCodeResult ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeResult.dataUrl}
                    alt="Generated QR Code"
                    className="max-w-full max-h-full w-auto h-auto border rounded-lg"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">
                    QR code will appear here after generation
                  </div>
                )}
              </div>
            </CodePanel>
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
