'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import {
  CameraManager
} from '@/libs/qr-code-decoder';
import { cn } from '@/libs/utils';
import {
  QrDecoderOptions,
  QrDecoderResult
} from '@/types/qr-decoder';
import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle,
  Copy,
  Download,
  Flashlight,
  FlashlightOff,
  Loader2,
  RotateCcw,
  Share,
  Trash2
} from 'lucide-react';
import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { QR_SCANNER_CONFIG } from '../../config/qr-code-scanner-config';

interface QrCodeScannerProps {
  className?: string;
  instanceId: string;
  onResult?: (result: QrDecoderResult) => void;
  onError?: (error: string) => void;
}

export function QrCodeScanner({ className, instanceId, onResult, onError }: QrCodeScannerProps) {
  // State management
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [results, setResults] = useState<QrDecoderResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<string>('idle');
  const [options, setOptions] = useState<QrDecoderOptions>(QR_SCANNER_CONFIG.DEFAULT_OPTIONS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Camera state
  const [currentCamera, setCurrentCamera] = useState<string>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<any>(null);

  // UI state
  const [showParsedData, setShowParsedData] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const prevStateRef = useRef<any>(null);

  // Tool state management
  const { toolState, updateToolState, clearToolState } = useToolState('qr-code-scanner', instanceId);

  useEffect(() => {
    startTransition(() => {
      setIsHydrated(true);
    });
  }, []);

  // Initialize camera manager
  useEffect(() => {
    if (!cameraManagerRef.current) {
      cameraManagerRef.current = new CameraManager();
    }
    return () => {
      if (cameraManagerRef.current) {
        cameraManagerRef.current.cleanup();
      }
    };
  }, []);

  // Handle tool state updates
  useEffect(() => {
    if (toolState && Object.keys(toolState).length > 0) {
      const { options: savedOptions, results: savedResults, state: savedState } = toolState;
      startTransition(() => {
        if (savedOptions) setOptions(savedOptions as QrDecoderOptions);
        if (savedResults) setResults(savedResults as QrDecoderResult[]);
        if (savedState) setState(savedState as string);
      });
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
      startTransition(() => {
        setOptions(QR_SCANNER_CONFIG.DEFAULT_OPTIONS);
        setResults([]);
        setError(null);
        setState('idle');
        setIsScanning(false);
        setIsCameraActive(false);
      });
      if (cameraManagerRef.current) {
        cameraManagerRef.current.cleanup();
      }
      prevStateRef.current = null;
    }
  }, [toolState, clearToolState]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) {
      setError('Video element not available');
      return;
    }

    setState('camera initializing');
    setError(null);

    try {
      const cameraManager = cameraManagerRef.current!;
      const result = await cameraManager.initializeCamera(videoRef.current, {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (result.success) {
        setIsCameraActive(true);
        setState('idle');

        const flashStatus = await cameraManager.getFlashStatus();
        setIsFlashOn(flashStatus.isOn || false);

        const status = await cameraManager.getCameraStatus();
        setCameraStatus(status);
      } else {
        setError(result.error || 'Failed to initialize camera');
        setState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera initialization failed');
      setState('error');
    }
  }, [currentCamera]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!cameraManagerRef.current || !isCameraActive) {
      setError('Camera not initialized');
      return;
    }

    setState('scanning');
    setError(null);

    try {
      const cameraManager = cameraManagerRef.current;
      await cameraManager.startScanning(
        (result: QrDecoderResult) => {
          setResults([result]);
          setState('qr detected');
          onResult?.(result);

          setIsScanning(false);
          if (cameraManagerRef.current) {
            cameraManagerRef.current.stopScanning();
          }
        },
        (error: string) => {
          setError(error);
          setState('error');
          onError?.(error);
        },
        {
          scanIntervalMs: 100,
          maxResults: 1,
          qualityThreshold: 0.5,
          enableMultipleDetection: false
        }
      );

      setIsScanning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scanning');
      setState('error');
    }
  }, [isCameraActive, onResult, onError]);

  // Stop scanning only (keep camera active)
  const stopScanningOnly = useCallback(async () => {
    if (cameraManagerRef.current) {
      await cameraManagerRef.current.stopScanning();
    }
    setIsScanning(false);
    setState('camera ready');
  }, []);

  // Stop camera completely
  const stopCamera = useCallback(async () => {
    if (cameraManagerRef.current) {
      await cameraManagerRef.current.stopScanning();
      await cameraManagerRef.current.cleanup();
    }
    setIsScanning(false);
    setIsCameraActive(false);
    setState('idle');
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!cameraManagerRef.current || !isCameraActive) return;

    try {
      await cameraManagerRef.current.stopScanning();
      await cameraManagerRef.current.cleanup();

      const newFacingMode = currentCamera === 'environment' ? 'user' : 'environment';
      setCurrentCamera(newFacingMode);

      const result = await cameraManagerRef.current.initializeCamera(videoRef.current!, {
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (result.success) {
        const status = await cameraManagerRef.current.getCameraStatus();
        setCameraStatus(status);

        if (isScanning) {
          await cameraManagerRef.current.startScanning(
            (result) => {
              setResults([result]);
              setIsScanning(false);
              setState('qr detected');
            },
            (error) => {
              setError(error);
              setState('error');
            },
            {
              scanIntervalMs: 100,
              maxResults: 1,
              qualityThreshold: 0.5,
              enableMultipleDetection: false
            }
          );
          setIsScanning(true);
          setState('scanning');
        }
      } else {
        setError(result.error || 'Failed to switch camera');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch camera');
    }
  }, [currentCamera, isCameraActive, isScanning]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!cameraManagerRef.current) return;

    try {
      const result = await cameraManagerRef.current.toggleFlash();
      setIsFlashOn(result.isFlashOn || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle flash');
    }
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

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          QR Code Scanner
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Scan QR codes using your device camera with real-time detection
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Main Content - Side by Side */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel - Camera */}
            <CodePanel fillHeight={true}
              title="Camera Scanner"
              height="600px"
              showCopyButton={false}
              showWrapToggle={false}
              headerActions={
                isCameraActive && (
                  <div className="flex items-center gap-1">
                    <button onClick={switchCamera} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                      <RotateCcw className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                    </button>
                    <button onClick={toggleFlash} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                      {isFlashOn ? <FlashlightOff className="h-4 w-4 text-neutral-900 dark:text-neutral-300" /> : <Flashlight className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />}
                    </button>
                    <button onClick={stopCamera} className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                      <CameraOff className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                )
              }
              footerRightContent={
                !isCameraActive ? (
                  <Button
                    onClick={initializeCamera}
                    size="sm"
                    className="h-8 px-4"
                    disabled={state === 'camera initializing'}
                  >
                    {state === 'camera initializing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>
                ) : !isScanning ? (
                  <Button onClick={startScanning} size="sm" className="h-8 px-4">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button onClick={stopScanningOnly} variant="destructive" size="sm" className="h-8 px-4">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </Button>
                )
              }
            >
              <div className="h-full flex flex-col">
                {/* Camera Video */}
                <div className="relative bg-black rounded-lg overflow-hidden flex-1 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-contain ${!isCameraActive ? 'hidden' : ''}`}
                    playsInline
                    muted
                  />
                  {!isCameraActive && (
                    <div className="text-center space-y-4">
                      <Camera className="h-12 w-12 mx-auto text-white/50" />
                      <p className="text-white/70 text-sm">Camera not active</p>
                      {state === 'camera initializing' && (
                        <div className="flex items-center justify-center gap-2 text-white/70">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Initializing...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-pulse">
                      <div className="absolute top-2 left-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Scanning for QR codes...
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Info */}
                {cameraStatus && isCameraActive && (
                  <div className="text-xs text-muted-foreground mt-2 flex gap-4">
                    <span>{cameraStatus.facingMode === 'environment' ? 'Back' : 'Front'} Camera</span>
                    <span>{cameraStatus.width}x{cameraStatus.height}</span>
                  </div>
                )}
              </div>
            </CodePanel>

            {/* Output Panel - Results */}
            <CodePanel fillHeight={true}
              title="Scan Result"
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
                <div className="space-y-3">
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

                      {showParsedData && (
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <div className="flex gap-4">
                            <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                            <span>Position: {result.position.x}, {result.position.y}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                  <Camera className="h-12 w-12 mb-4 opacity-50" />
                  Scanned QR content will appear here
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
