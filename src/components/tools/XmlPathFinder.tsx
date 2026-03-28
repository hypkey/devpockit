'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import type { CodeOutputTab } from '@/components/ui/code-panel';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { XmlTreeView } from '@/components/ui/xml-tree-view';
import { Label } from '@/components/ui/label';
import {
  DEFAULT_XML_PATH_OPTIONS,
  XML_PATH_COMMON_PATTERNS,
  XML_PATH_EXAMPLES,
  type XmlPathFinderOptions
} from '@/config/xml-path-finder-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  evaluateXPath,
  formatXPathResults,
  validateXPath,
  type XmlPathResult
} from '@/libs/xml-path-finder';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface XmlPathFinderProps {
  className?: string;
  instanceId: string;
}

export function XmlPathFinder({ className, instanceId }: XmlPathFinderProps) {
  const { toolState, updateToolState } = useToolState('xml-path-finder', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<XmlPathFinderOptions>(DEFAULT_XML_PATH_OPTIONS);
  const [xmlInput, setXmlInput] = useState<string>('');
  const [pathInput, setPathInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<XmlPathResult | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('tree');
  const [getExpandedXml, setGetExpandedXml] = useState<(() => string) | null>(null);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as XmlPathFinderOptions);
      if (toolState.xmlInput) setXmlInput(toolState.xmlInput as string);
      if (toolState.pathInput) setPathInput(toolState.pathInput as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.result) setResult(toolState.result as XmlPathResult);
      if (toolState.activeTab) setActiveTab(toolState.activeTab as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state whenever local state changes
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        xmlInput,
        pathInput,
        output,
        error,
        result: result || undefined,
        activeTab
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, xmlInput, pathInput, output, error, result, activeTab, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_XML_PATH_OPTIONS);
      setXmlInput('');
      setPathInput('');
      setOutput('');
      setError('');
      setResult(null);
      setActiveTab('tree');
    }
  }, [toolState, isHydrated]);

  const handleEvaluate = async () => {
    if (!xmlInput.trim()) {
      setError('Please enter XML data');
      setOutput('');
      setResult(null);
      return;
    }

    if (!pathInput.trim()) {
      setError('Please enter an XPath expression');
      setOutput('');
      setResult(null);
      return;
    }

    setIsEvaluating(true);
    setError('');

    try {
      // Validate XPath syntax
      const pathValidation = validateXPath(pathInput);
      if (!pathValidation.isValid) {
        setError(pathValidation.error || 'Invalid XPath expression');
        setOutput('');
        setResult(null);
        return;
      }

      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Evaluate XPath
      const pathResult = evaluateXPath(xmlInput, pathInput);

      if (pathResult.success) {
        setResult(pathResult);
        setOutput(formatXPathResults(pathResult));
      } else {
        setError(pathResult.error || 'XPath evaluation failed');
        setOutput('');
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
      setOutput('');
      setResult(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleLoadExample = (example: typeof XML_PATH_EXAMPLES[0]) => {
    setXmlInput(example.xml);
    setPathInput(example.path);
    setError('');
    setOutput('');
    setResult(null);
  };

  const handleLoadPattern = (pattern: typeof XML_PATH_COMMON_PATTERNS[0]) => {
    setPathInput(pattern.example);
    // Focus on path input
    setTimeout(() => {
      const pathInputElement = document.querySelector('input[placeholder*="XPath"]') as HTMLInputElement;
      if (pathInputElement) {
        pathInputElement.focus();
      }
    }, 100);
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  // Validate XML safely
  const isValidXml = useMemo(() => {
    if (!xmlInput.trim()) return false;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlInput, 'text/xml');
      const parserError = doc.querySelector('parsererror');
      return !parserError;
    } catch {
      return false;
    }
  }, [xmlInput]);

  // Create output tabs - Always show both tabs
  const outputTabs: CodeOutputTab[] = useMemo(() => {
    const tabs: CodeOutputTab[] = [
      {
        id: 'tree',
        label: 'Tree View',
        value: '', // Not used for tree view
        language: 'xml'
      },
      {
        id: 'results',
        label: 'Results',
        value: output || '',
        language: 'json'
      }
    ];

    return tabs;
  }, [output]);

  // Ensure activeTab is valid when outputTabs change
  // Default to 'tree' if available, otherwise use first available tab
  useEffect(() => {
    if (outputTabs.length > 0) {
      const treeTab = outputTabs.find(tab => tab.id === 'tree');
      const currentTab = outputTabs.find(tab => tab.id === activeTab);

      if (!currentTab) {
        // If current tab is not available, switch to tree if available, otherwise first tab
        setActiveTab(treeTab ? 'tree' : outputTabs[0].id);
      }
    }
  }, [outputTabs, activeTab]);

  // Custom tab content renderer
  const renderCustomTabContent = (tabId: string): React.ReactNode => {
    if (tabId === 'tree') {
      // Show tree view if XML is valid, otherwise show empty state message
      if (isValidXml && xmlInput.trim()) {
        return (
          <div className="h-full w-full">
            <XmlTreeView
              xmlString={xmlInput}
              highlightedPaths={result?.paths || []}
              onPathClick={(path) => {
                // Copy path to clipboard
                navigator.clipboard.writeText(path).catch(console.error);
              }}
              onGetExpandedXml={(fn: () => string) => setGetExpandedXml(() => fn)}
              maxDepth={3}
              height="500px"
            />
          </div>
        );
      }
      // Show empty state when no XML is provided
      return (
        <div className="h-full w-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          <div className="text-center">
            <p className="text-sm">Enter XML data to view the tree structure</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom copy handler for tree view
  const handleTreeViewCopy = useCallback(async (): Promise<string | null> => {
    if (activeTab === 'tree') {
      if (getExpandedXml) {
        try {
          const xml = getExpandedXml();
          return xml || '';
        } catch {
          return null;
        }
      }
      // Function not ready yet, but button should still be enabled
      return '';
    }
    return null; // Use default copy behavior for other tabs
  }, [activeTab, getExpandedXml]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          XML Path Finder
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Query and extract data from XML using XPath expressions
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* XPath Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="xpath-input" className="text-sm font-medium">
              XPath Expression
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="xpath-input"
                placeholder="Enter XPath (e.g., /root/child or //element[@attr='value'])"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleEvaluate();
                  }
                }}
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={handleEvaluate}
                disabled={!xmlInput.trim() || !pathInput.trim() || isEvaluating}
                variant="default"
                size="sm"
                className="h-10 px-4"
              >
                {isEvaluating ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Evaluating...
                  </>
                ) : (
                  'Evaluate'
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 text-xs"
                  >
                    Patterns
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto w-64">
                  {XML_PATH_COMMON_PATTERNS.map((pattern, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => handleLoadPattern(pattern)}
                      className="flex flex-col items-start gap-1"
                    >
                      <span className="font-mono text-xs">{pattern.pattern}</span>
                      <span className="text-xs text-muted-foreground">{pattern.description}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter (Cmd+Enter on Mac) to evaluate
            </p>
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Panel */}
            <CodePanel fillHeight={true}
              title="XML Input"
              value={xmlInput}
              onChange={setXmlInput}
              language="xml"
              height="500px"
              theme={theme}
              wrapText={inputWrapText}
              onWrapTextChange={setInputWrapText}
              showCopyButton={false}
              showClearButton={true}
              headerActions={
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
                  <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                    {XML_PATH_EXAMPLES.map((example, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleLoadExample(example)}
                        className="flex flex-col items-start gap-1"
                      >
                        <span className="font-medium">{example.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {example.path}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {example.description}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <span>{getCharacterCount(xmlInput)} characters</span>
              }
            />

            {/* Output Panel */}
            <CodePanel fillHeight={true}
              tabs={outputTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              customTabContent={renderCustomTabContent}
              onCopy={handleTreeViewCopy}
              language="json"
              height="500px"
              theme={theme}
              wrapText={outputWrapText}
              onWrapTextChange={setOutputWrapText}
              showWrapToggle={activeTab === 'results'}
              footerLeftContent={
                <>
                  {activeTab === 'tree' && result && (
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold',
                        result.success && result.count > 0
                          ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                          : result.success && result.count === 0
                          ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                          : ''
                      )}
                    >
                      {result.success && result.count > 0
                        ? `Found ${result.count} match${result.count !== 1 ? 'es' : ''}`
                        : result.success && result.count === 0
                        ? 'No matches found'
                        : ''}
                    </span>
                  )}
                  {activeTab === 'results' && output && result && (
                    <>
                      <span>{result.count} match{result.count !== 1 ? 'es' : ''}</span>
                      <span>{getCharacterCount(output)} characters</span>
                      <span>{getLineCount(output)} lines</span>
                    </>
                  )}
                </>
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

