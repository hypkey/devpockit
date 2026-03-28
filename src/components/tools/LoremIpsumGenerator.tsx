'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel, type CodeOutputTab } from '@/components/ui/code-panel';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_OPTIONS, LOREM_OPTIONS } from '@/config/lorem-ipsum-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import { generateLoremIpsum, validateLoremOptions, type LoremOptions } from '@/libs/lorem-ipsum';
import { cn } from '@/libs/utils';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';

interface LoremIpsumGeneratorProps {
  className?: string;
  instanceId: string;
}

export function LoremIpsumGenerator({ className, instanceId }: LoremIpsumGeneratorProps) {
  const { toolState, updateToolState } = useToolState('lorem-ipsum', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<LoremOptions>(DEFAULT_OPTIONS);
  const [outputPlain, setOutputPlain] = useState<string>('');
  const [outputHtml, setOutputHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'plain' | 'html'>('plain');
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Track if we've already hydrated to prevent re-hydration on toolState changes
  const hasHydratedRef = useRef(false);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    if (!hasHydratedRef.current && toolState) {
      hasHydratedRef.current = true;
      setIsHydrated(true);
      if (toolState.options) {
        const opts = toolState.options as LoremOptions;
        setOptions(opts);
      }
      if (toolState.outputPlain) setOutputPlain(toolState.outputPlain as string);
      if (toolState.outputHtml) setOutputHtml(toolState.outputHtml as string);
      if (toolState.error) setError(toolState.error as string);
      if ((toolState.options as LoremOptions)?.format) {
        setActiveTab((toolState.options as LoremOptions).format);
      }
    } else if (!hasHydratedRef.current) {
      // Still mark as hydrated even if no toolState exists
      hasHydratedRef.current = true;
      setIsHydrated(true);
    }
  }, [toolState]);

  // Update persistent state whenever local state changes
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        outputPlain,
        outputHtml,
        error
      });
    }
  }, [options, outputPlain, outputHtml, error, isHydrated, updateToolState]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_OPTIONS);
      setOutputPlain('');
      setOutputHtml('');
      setError('');
      setActiveTab('plain');
    }
  }, [toolState, isHydrated]);

  // Sync format with active tab
  useEffect(() => {
    setOptions(prev => ({ ...prev, format: activeTab }));
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'plain' | 'html');
  };

  const convertPlainToHtml = (plainText: string, unit: 'words' | 'sentences' | 'paragraphs'): string => {
    if (!plainText) return '';

    switch (unit) {
      case 'words':
      case 'sentences':
        // Wrap entire content in a single <p> tag
        return `<p>${plainText}</p>`;

      case 'paragraphs':
        // Split by double newlines and wrap each paragraph in <p> tags
        const paragraphs = plainText.split('\n\n').filter(p => p.trim().length > 0);
        return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');

      default:
        return plainText;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Validate options before generation
      const validationErrors = validateLoremOptions(options);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate plain text once (same content)
      const plainOptions = { ...options, format: 'plain' as const };
      const plainResult = generateLoremIpsum(plainOptions);

      // Convert the same plain text to HTML format
      const htmlResult = convertPlainToHtml(plainResult, options.unit);

      setOutputPlain(plainResult);
      setOutputHtml(htmlResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      setOutputPlain('');
      setOutputHtml('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setOptions(prev => ({ ...prev, quantity }));
  };

  // Prepare tabs for CodePanel
  const outputTabs: CodeOutputTab[] = useMemo(
    () => [
      {
        id: 'plain',
        label: 'Plain text',
        value: outputPlain,
        language: 'plaintext',
      },
      {
        id: 'html',
        label: 'HTML',
        value: outputHtml,
        language: 'xml',
      },
    ],
    [outputPlain, outputHtml]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          Lorem Ipsum Generator
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Generate placeholder text in Latin or Bacon Ipsum format
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Type Select */}
              <Select
                value={options.type}
                onValueChange={(value: 'latin' | 'bacon' | 'gen-alpha' | 'tech-bro' | 'wibu' | 'climber-bro') =>
                  setOptions(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger label="Ipsum Type:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOREM_OPTIONS.types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Unit Select */}
              <Select
                value={options.unit}
                onValueChange={(value: 'words' | 'sentences' | 'paragraphs') =>
                  setOptions(prev => ({ ...prev, unit: value }))
                }
              >
                <SelectTrigger label="Unit:" className="min-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOREM_OPTIONS.units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quantity Input */}
              <NumberInput
                value={options.quantity}
                onChange={handleQuantityChange}
                min={1}
                max={100}
              />

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="default"
                size="default"
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {error ? (
            <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          ) : (
            <CodePanel fillHeight={true}
              tabs={outputTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              showStats={true}
              className="flex-1"
              height="500px"
              theme={theme}
              wrapText={wrapText}
              onWrapTextChange={setWrapText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
