'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DEFAULT_QR_DECODER_OPTIONS } from '@/config/qr-code-decoder-config';
import {
  decodeQrFromImage,
  getErrorMessage,
  validateImageFile
} from '@/libs/qr-code-decoder';
import { cn } from '@/libs/utils';
import {
  QrDecoderOptions,
  QrDecoderResult
} from '@/types/qr-decoder';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  FileImage,
  Loader2,
  Share,
  Trash2,
  Upload,
  XCircle
} from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface QrCodeDecoderProps {
  className?: string;
  instanceId: string;
  onResult?: (result: QrDecoderResult) => void;
  onError?: (error: string) => void;
}

export function QrCodeDecoder({ className, instanceId, onResult, onError }: QrCodeDecoderProps) {
  // State management
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<QrDecoderResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<string>('idle');
  const [options, setOptions] = useState<QrDecoderOptions>(DEFAULT_QR_DECODER_OPTIONS);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayedImage, setDisplayedImage] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef<any>(null);
  const displayedImageRef = useRef<string | null>(null);
  const filesRef = useRef<File[]>([]);
  const onResultRef = useRef<((result: QrDecoderResult) => void) | undefined>(undefined);
  const onErrorRef = useRef<((error: string) => void) | undefined>(undefined);

  // Tool state management
  const { toolState, updateToolState, clearToolState } = useToolState('qr-code-decoder', instanceId);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Update refs when props change
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  // Force UI update when results change
  useLayoutEffect(() => {
    if (results.length > 0) {
      setForceUpdate(prev => prev + 1);
    }
  }, [results]);

  // Force UI update when displayed image changes
  useLayoutEffect(() => {
    if (displayedImage) {
      setForceUpdate(prev => prev + 1);
    }
  }, [displayedImage]);

  // Handle tool state updates
  useEffect(() => {
    if (toolState && Object.keys(toolState).length > 0) {
      const { options: savedOptions, results: savedResults, state: savedState } = toolState;
      if (savedOptions) setOptions(savedOptions as QrDecoderOptions);
      if (savedResults) setResults(savedResults as QrDecoderResult[]);
      if (savedState) setState(savedState as string);
    }
  }, [toolState]);

  // Update tool state when state changes
  useEffect(() => {
    if (!isHydrated) return;
    const currentState = { options, results, error: error || undefined, state };
    const prevState = prevStateRef.current;

    if (!prevState || JSON.stringify(currentState) !== JSON.stringify(prevState)) {
      updateToolState(currentState);
      prevStateRef.current = currentState;
    }
  }, [options, results, error, state, updateToolState, isHydrated]);

  // Clear tool state when switching tools
  useEffect(() => {
    if (!toolState || Object.keys(toolState).length === 0) {
      if (displayedImageRef.current) {
        URL.revokeObjectURL(displayedImageRef.current);
        displayedImageRef.current = null;
        setDisplayedImage(null);
      }
      setOptions(DEFAULT_QR_DECODER_OPTIONS);
      setResults([]);
      setError(null);
      setState('idle');
      filesRef.current = [];
      setFiles([]);
      prevStateRef.current = null;
    }
  }, [toolState, clearToolState]);

  // Cleanup displayed image on unmount
  useEffect(() => {
    return () => {
      if (displayedImageRef.current) {
        URL.revokeObjectURL(displayedImageRef.current);
      }
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const file = selectedFiles[0];
    const validation = validateImageFile(file);

    if (validation.isValid) {
      filesRef.current = [file];
      setFiles([file]);
      setError(null);
    } else {
      setError(`${file.name}: ${validation.error}`);
    }
  }, []);

  // Process files
  const processFiles = useCallback(async () => {
    if (filesRef.current.length === 0) {
      setError('No file selected');
      return;
    }

    setIsProcessing(true);
    setState('file processing');
    setError(null);

    try {
      const file = filesRef.current[0];
      const imageUrl = URL.createObjectURL(file);

      if (displayedImageRef.current) {
        URL.revokeObjectURL(displayedImageRef.current);
      }

      displayedImageRef.current = imageUrl;
      setDisplayedImage(imageUrl);
      setForceUpdate(prev => prev + 1);

      const results = await decodeQrFromImage(file);

      if (results && results.length > 0) {
        setResults(results);
        setState('qr detected');
        setForceUpdate(prev => prev + 1);
        results.forEach(result => onResultRef.current?.(result));
      } else {
        setError('No QR codes found in the uploaded image');
        setState('error');
      }
    } catch (err) {
      setError(getErrorMessage(err as Error));
      setState('error');
      onErrorRef.current?.(getErrorMessage(err as Error));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Remove file
  const removeFile = useCallback((index: number) => {
    const newFiles = filesRef.current.filter((_, i) => i !== index);
    filesRef.current = newFiles;
    setFiles(newFiles);
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    if (displayedImageRef.current) {
      URL.revokeObjectURL(displayedImageRef.current);
      displayedImageRef.current = null;
      setDisplayedImage(null);
    }
    filesRef.current = [];
    setFiles([]);
    setResults([]);
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  }, []);

  // Share results
  const shareResults = useCallback(async (result: QrDecoderResult) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QR Code Result',
          text: result.data,
          url: result.format === 'url' ? result.data : undefined
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await copyToClipboard(result.data);
    }
  }, [copyToClipboard]);

  // Export results
  const exportResults = useCallback((format: 'json' | 'csv' | 'txt') => {
    const data = results;
    let content = '';
    let filename = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = 'qr-results.json';
        break;
      case 'csv':
        const headers = ['ID', 'Format', 'Data', 'Timestamp'];
        const rows = data.map(r => [r.id, r.format, r.data, new Date(r.timestamp).toISOString()]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        filename = 'qr-results.csv';
        break;
      case 'txt':
        content = data.map(r => `${r.format}: ${r.data}`).join('\n');
        filename = 'qr-results.txt';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          QR Code Decoder
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Upload an image containing a QR code to decode it with support for multiple formats
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Main Content - Side by Side */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel - Upload */}
            <CodePanel fillHeight={true}
              title="Upload Image"
              height="600px"
              showCopyButton={false}
              showWrapToggle={false}
              headerActions={
                files.length > 0 && (
                  <button
                    onClick={clearFiles}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                  </button>
                )
              }
              footerRightContent={
                <Button
                  onClick={processFiles}
                  disabled={isProcessing || files.length === 0}
                  size="sm"
                  className="h-8 px-4"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Decoding...
                    </>
                  ) : (
                    'Decode'
                  )}
                </Button>
              }
            >
              {/* Drop Zone */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={handleDrop}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors h-full flex flex-col items-center justify-center"
              >
                {files.length === 0 ? (
                  <>
                    <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-2">Drop an image here or click to select</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports JPG, PNG, GIF, WebP (max 10MB)
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </>
                ) : (
                  <div className="w-full space-y-4">
                    {displayedImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayedImage}
                        alt="Uploaded QR code"
                        className="max-w-full h-auto max-h-48 object-contain border rounded-lg mx-auto"
                      />
                    ) : (
                      <FileImage className="h-16 w-16 mx-auto text-muted-foreground" />
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <FileImage className="h-4 w-4" />
                      <span className="text-sm">{files[0].name}</span>
                      <Badge variant="outline">
                        {(files[0].size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                      <button
                        onClick={() => removeFile(0)}
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>
            </CodePanel>

            {/* Output Panel - Results */}
            <CodePanel fillHeight={true}
              title="Decoded Result"
              height="600px"
              showCopyButton={false}
              showWrapToggle={false}
              headerActions={
                results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(results[0].data)}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                    </button>
                    <button onClick={clearResults} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                      <Trash2 className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                    </button>
                  </div>
                )
              }
              footerRightContent={
                results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => exportResults('json')}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      onClick={() => shareResults(results[0])}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                )
              }
              alwaysShowFooter={true}
            >
              {results.length > 0 ? (
                <div key={`results-${forceUpdate}`} className="space-y-3">
                  {results.map((result) => (
                    <div key={result.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge variant="outline">{result.format}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="font-mono text-sm bg-muted p-3 rounded break-all">
                        {result.data}
                      </div>

                      <div className="text-sm space-y-1 text-muted-foreground">
                        <div className="flex gap-4">
                          <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                          <span>Position: {result.position.x}, {result.position.y}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                  <FileImage className="h-12 w-12 mb-4 opacity-50" />
                  Decoded QR content will appear here
                </div>
              )}
            </CodePanel>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
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
