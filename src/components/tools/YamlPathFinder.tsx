'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import type { CodeOutputTab } from '@/components/ui/code-panel';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { JsonTreeView } from '@/components/ui/json-tree-view';
import { Label } from '@/components/ui/label';
import {
  DEFAULT_YAML_PATH_OPTIONS,
  YAML_PATH_COMMON_PATTERNS,
  YAML_PATH_EXAMPLES,
  type YamlPathFinderOptions
} from '@/config/yaml-path-finder-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  evaluateYamlPath,
  formatYamlPathResults,
  parseYamlWithMetadata,
  validateYamlPath,
  type YamlPathResult
} from '@/libs/yaml-path-finder';
import { cn } from '@/libs/utils';
import { stringify } from 'yaml';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface YamlPathFinderProps {
  className?: string;
  instanceId: string;
}

export function YamlPathFinder({ className, instanceId }: YamlPathFinderProps) {
  const { toolState, updateToolState } = useToolState('yaml-path-finder', instanceId);

  // Initialize with defaults to avoid hydration mismatch
  const [options, setOptions] = useState<YamlPathFinderOptions>(DEFAULT_YAML_PATH_OPTIONS);
  const [yamlInput, setYamlInput] = useState<string>('');
  const [pathInput, setPathInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<YamlPathResult | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('tree');
  const [getExpandedJson, setGetExpandedJson] = useState<(() => string) | null>(null);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [inputWrapText, setInputWrapText] = useState(true);
  const [outputWrapText, setOutputWrapText] = useState(true);

  // Hydrate state from toolState after mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.options) setOptions(toolState.options as YamlPathFinderOptions);
      if (toolState.yamlInput) setYamlInput(toolState.yamlInput as string);
      if (toolState.pathInput) setPathInput(toolState.pathInput as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
      if (toolState.result) setResult(toolState.result as YamlPathResult);
      if (toolState.activeTab) setActiveTab(toolState.activeTab as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state whenever local state changes
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        options,
        yamlInput,
        pathInput,
        output,
        error,
        result: result || undefined,
        activeTab
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, yamlInput, pathInput, output, error, result, activeTab, isHydrated]);

  // Reset local state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setOptions(DEFAULT_YAML_PATH_OPTIONS);
      setYamlInput('');
      setPathInput('');
      setOutput('');
      setError('');
      setResult(null);
      setActiveTab('tree');
    }
  }, [toolState, isHydrated]);

  const handleEvaluate = async () => {
    if (!yamlInput.trim()) {
      setError('Please enter YAML data');
      setOutput('');
      setResult(null);
      return;
    }

    if (!pathInput.trim()) {
      setError('Please enter a YAMLPath expression');
      setOutput('');
      setResult(null);
      return;
    }

    setIsEvaluating(true);
    setError('');

    try {
      // Validate YAMLPath syntax
      const pathValidation = validateYamlPath(pathInput);
      if (!pathValidation.isValid) {
        setError(pathValidation.error || 'Invalid YAMLPath expression');
        setOutput('');
        setResult(null);
        return;
      }

      // Parse YAML with metadata
      const parseResult = parseYamlWithMetadata(yamlInput);
      if (parseResult.error) {
        setError(parseResult.error);
        setOutput('');
        setResult(null);
        return;
      }

      if (parseResult.documents.length === 0) {
        setError('No YAML documents found');
        setOutput('');
        setResult(null);
        return;
      }

      // For now, evaluate against the first document
      // TODO: Support multi-document evaluation
      const firstDoc = parseResult.documents[0];
      const metadata = {
        anchors: firstDoc.anchors,
        aliases: firstDoc.aliases,
        tags: firstDoc.tags
      };

      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Evaluate YAMLPath
      const pathResult = evaluateYamlPath(
        firstDoc.content,
        pathInput,
        options,
        metadata
      );

      if (pathResult.success) {
        setResult(pathResult);
        setOutput(formatYamlPathResults(pathResult));
      } else {
        setError(pathResult.error || 'YAMLPath evaluation failed');
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

  const handleLoadExample = (example: typeof YAML_PATH_EXAMPLES[0]) => {
    setYamlInput(example.yaml);
    setPathInput(example.path);
    setError('');
    setOutput('');
    setResult(null);
  };

  const handleLoadPattern = (pattern: typeof YAML_PATH_COMMON_PATTERNS[0]) => {
    setPathInput(pattern.example);
    // Focus on path input
    setTimeout(() => {
      const pathInputElement = document.querySelector('input[placeholder*="YAMLPath"]') as HTMLInputElement;
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

  // Parse YAML safely
  const parsedYamlData = useMemo(() => {
    if (!yamlInput.trim()) return null;
    try {
      const parseResult = parseYamlWithMetadata(yamlInput);
      if (parseResult.error || parseResult.documents.length === 0) {
        return null;
      }
      return parseResult.documents[0].content;
    } catch {
      return null;
    }
  }, [yamlInput]);

  // Create output tabs - Always show both tabs
  const outputTabs: CodeOutputTab[] = useMemo(() => {
    const tabs: CodeOutputTab[] = [
      {
        id: 'tree',
        label: 'Tree View',
        value: '', // Not used for tree view
        language: 'yaml'
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
  useEffect(() => {
    if (outputTabs.length > 0) {
      const treeTab = outputTabs.find(tab => tab.id === 'tree');
      const currentTab = outputTabs.find(tab => tab.id === activeTab);

      if (!currentTab) {
        setActiveTab(treeTab ? 'tree' : outputTabs[0].id);
      }
    }
  }, [outputTabs, activeTab]);

  // Custom tab content renderer
  const renderCustomTabContent = (tabId: string): React.ReactNode => {
    if (tabId === 'tree') {
      // Show tree view if YAML is valid, otherwise show empty state message
      if (parsedYamlData !== null) {
        return (
          <div className="h-full w-full">
            <JsonTreeView
              data={parsedYamlData}
              highlightedPaths={result?.paths || []}
              onPathClick={(path) => {
                // Copy path to clipboard
                navigator.clipboard.writeText(path).catch(console.error);
              }}
              onGetExpandedJson={(fn: () => string) => setGetExpandedJson(() => fn)}
              maxDepth={3}
              height="500px"
            />
          </div>
        );
      }
      // Show empty state when no YAML is provided
      return (
        <div className="h-full w-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          <div className="text-center">
            <p className="text-sm">Enter YAML data to view the tree structure</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom copy handler for tree view and results
  const handleTreeViewCopy = useCallback(async (): Promise<string | null> => {
    if (activeTab === 'tree') {
      if (getExpandedJson) {
        try {
          const json = getExpandedJson();
          if (!json) return '';

          // Parse JSON and convert to YAML
          try {
            const jsonData = JSON.parse(json);
            const yaml = stringify(jsonData, { indent: 2, lineWidth: 0 });
            return yaml;
          } catch {
            // If JSON parsing fails, return the JSON string as-is
            return json;
          }
        } catch {
          return null;
        }
      }
      // Function not ready yet, but button should still be enabled
      return '';
    } else if (activeTab === 'results') {
      // For results tab, convert JSON output to YAML
      if (output) {
        try {
          // Try to parse the output as JSON and convert to YAML
          const jsonData = JSON.parse(output);
          const yaml = stringify(jsonData, { indent: 2, lineWidth: 0 });
          return yaml;
        } catch (parseErr) {
          // If it's not valid JSON, return as-is (might already be YAML or error message)
          return output;
        }
      }
      return null;
    }
    return null; // Use default copy behavior for other tabs
  }, [activeTab, getExpandedJson, output]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          YAML Path Finder
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Query and extract data from YAML using YAMLPath expressions
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* YAMLPath Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="yamlpath-input" className="text-sm font-medium">
              YAMLPath Expression
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="yamlpath-input"
                placeholder="Enter YAMLPath (e.g., $.users[*].name)"
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
                disabled={!yamlInput.trim() || !pathInput.trim() || isEvaluating}
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
                  {YAML_PATH_COMMON_PATTERNS.map((pattern, index) => (
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
              title="YAML Input"
              value={yamlInput}
              onChange={setYamlInput}
              language="yaml"
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
                    {YAML_PATH_EXAMPLES.map((example, index) => (
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
                <span>{getCharacterCount(yamlInput)} characters</span>
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

