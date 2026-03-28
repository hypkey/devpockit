'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_LIST_COMPARISON_OPTIONS,
  LIST_COMPARISON_EXAMPLES,
  LIST_COMPARISON_OPTIONS,
  type ListComparisonOptions,
} from '@/config/list-comparison-config';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  calculateStats,
  parseListInput,
  performOperation,
  sortListItems,
  type ListComparisonStats,
  type ListItem,
} from '@/libs/list-comparison';
import { cn } from '@/libs/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Check, Copy, Download, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { stringify } from 'yaml';

interface ListComparisonProps {
  className?: string;
  instanceId: string;
}

export function ListComparison({ className, instanceId }: ListComparisonProps) {
  const { toolState, updateToolState } = useToolState('list-comparison', instanceId);

  // State
  const [listAText, setListAText] = useState<string>('');
  const [listBText, setListBText] = useState<string>('');
  const [options, setOptions] = useState<ListComparisonOptions>(DEFAULT_LIST_COMPARISON_OPTIONS);
  const [stats, setStats] = useState<ListComparisonStats | null>(null);
  const [results, setResults] = useState<ListItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [copySuccess, setCopySuccess] = useState<'results' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [listAWrapText, setListAWrapText] = useState(true);
  const [listBWrapText, setListBWrapText] = useState(true);

  // Hydrate state from toolState after mount
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.listAText) setListAText(toolState.listAText as string);
      if (toolState.listBText) setListBText(toolState.listBText as string);
      if (toolState.options) setOptions(toolState.options as ListComparisonOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        listAText,
        listBText,
        options,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listAText, listBText, options, isHydrated]);

  // Reset state when tool state is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setListAText('');
      setListBText('');
      setOptions(DEFAULT_LIST_COMPARISON_OPTIONS);
      setStats(null);
      setResults([]);
      setSearchQuery('');
    }

  }, [toolState, isHydrated]);

  // Parse lists and calculate comparison
  const compareLists = useCallback(() => {
    try {
      const listA = parseListInput(listAText, options.inputFormat, options.caseSensitive);
      const listB = parseListInput(listBText, options.inputFormat, options.caseSensitive);

      // Calculate statistics
      const calculatedStats = calculateStats(listA, listB, options.caseSensitive);
      setStats(calculatedStats);

      // Perform operation
      let operationResults = performOperation(listA, listB, options.operation, options.caseSensitive);

      // Sort based on sort order
      operationResults = sortListItems(operationResults, options.sortOrder);

      setResults(operationResults);
    } catch (error) {
      // Handle parsing errors silently or show in UI
      setStats(null);
      setResults([]);
    }
  }, [listAText, listBText, options]);

  // Auto-compare when inputs or options change
  useEffect(() => {
    if (isHydrated && (listAText.trim() || listBText.trim())) {
      compareLists();
    } else {
      setStats(null);
      setResults([]);
    }
    // compareLists already includes listAText, listBText, and options in its dependencies

  }, [compareLists, isHydrated, listAText, listBText]);

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return results;
    }
    const query = searchQuery.toLowerCase();
    return results.filter(item => item.originalValue.toLowerCase().includes(query));
  }, [results, searchQuery]);

  // Handlers
  const handleLoadExample = (side: 'list-a' | 'list-b') => {
    const example = LIST_COMPARISON_EXAMPLES[side][options.inputFormat];
    if (side === 'list-a') {
      setListAText(example);
    } else {
      setListBText(example);
    }
  };

  // Format results based on input format
  const formatResults = (items: ListItem[], format: typeof options.inputFormat): string => {
    const values = items.map(item => item.originalValue);

    switch (format) {
      case 'line-by-line':
        // Multi-line format
        return values.join('\n');

      case 'comma-separated':
        // Single line with commas
        return values.join(', ');

      case 'space-separated':
        // Single line with spaces
        return values.join(' ');

      case 'pipe-separated':
        // Single line with pipe separators
        return values.join(' | ');

      case 'tab-separated':
        // Single line with tab separators
        return values.join('\t');

      case 'json-array':
        // Single line JSON array (no indentation)
        return JSON.stringify(values);

      case 'python-list': {
        // Single line Python list with single quotes
        const formatted = values.map(item => {
          // Escape single quotes in the item
          const escaped = item.replace(/'/g, "\\'");
          // Check if it's a number
          const num = Number(item);
          if (!isNaN(num) && item.trim() === num.toString()) {
            return num.toString();
          }
          return `'${escaped}'`;
        });
        return `[${formatted.join(', ')}]`;
      }

      case 'javascript-array': {
        // Single line JavaScript array with single quotes
        const formatted = values.map(item => {
          // Escape single quotes in the item
          const escaped = item.replace(/'/g, "\\'");
          // Check if it's a number
          const num = Number(item);
          if (!isNaN(num) && item.trim() === num.toString()) {
            return num.toString();
          }
          return `'${escaped}'`;
        });
        return `[${formatted.join(', ')}]`;
      }

      case 'yaml-array': {
        // Format as YAML array
        // Try to preserve numeric types
        const yamlValues = values.map(item => {
          const num = Number(item);
          if (!isNaN(num) && item.trim() === num.toString()) {
            return num;
          }
          return item;
        });
        return stringify(yamlValues, {
          indent: 2,
          lineWidth: 0,
        });
      }

      default:
        return values.join('\n');
    }
  };

  const handleCopyResults = async () => {
    if (filteredResults.length === 0) return;

    const text = formatResults(filteredResults, options.inputFormat);

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('results');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const data = filteredResults.map(item => item.originalValue);
    let content = '';
    let mimeType = '';
    let filename = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename = 'list-comparison-results.json';
        break;
      case 'csv':
        content = data.map(item => `"${item.replace(/"/g, '""')}"`).join('\n');
        mimeType = 'text/csv';
        filename = 'list-comparison-results.csv';
        break;
      case 'txt':
        content = data.join('\n');
        mimeType = 'text/plain';
        filename = 'list-comparison-results.txt';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getItemCount = (text: string): number => {
    if (!text.trim()) return 0;
    try {
      return parseListInput(text, options.inputFormat, options.caseSensitive).length;
    } catch {
      return 0;
    }
  };

  const getUniqueCount = (text: string): number => {
    if (!text.trim()) return 0;
    try {
      const items = parseListInput(text, options.inputFormat, options.caseSensitive);
      const normalized = options.caseSensitive
        ? items
        : items.map(item => item.toLowerCase());
      return new Set(normalized).size;
    } catch {
      return 0;
    }
  };

  const hasListAContent = listAText.trim().length > 0;
  const hasListBContent = listBText.trim().length > 0;
  const hasContent = hasListAContent || hasListBContent;

  // Determine language based on input format
  const getLanguage = (): string => {
    switch (options.inputFormat) {
      case 'json-array':
        return 'json';
      case 'python-list':
        return 'python';
      case 'javascript-array':
        return 'javascript';
      case 'yaml-array':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  const editorLanguage = getLanguage();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          List Comparison Tool
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Compare two lists of strings and numbers to find differences, intersections, unions, and more
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0 overflow-auto">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap min-h-[40px]">
              {/* Input Format Select */}
              <Select
                value={options.inputFormat}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, inputFormat: value as typeof options.inputFormat }))
                }
              >
                <SelectTrigger label="Input Format:" className="min-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIST_COMPARISON_OPTIONS.inputFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Order Selector */}
              <Select
                value={options.sortOrder}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, sortOrder: value as 'none' | 'asc' | 'desc' }))
                }
              >
                <SelectTrigger label="Sort Order:" className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>

              {/* Case Sensitive Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Case Sensitive:</span>
                <Switch
                  checked={options.caseSensitive}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, caseSensitive: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Side-by-side Input Panels */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* List A Panel */}
            <CodePanel fillHeight={true}
              title="List A"
              value={listAText}
              onChange={setListAText}
              language={editorLanguage}
              height="500px"
              theme={theme}
              wrapText={listAWrapText}
              onWrapTextChange={setListAWrapText}
              placeholder="Enter items, one per line..."
              showCopyButton={true}
              showClearButton={true}
              headerActions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      Load Example
                      <ChevronDownIcon className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleLoadExample('list-a')}>
                      Load Example
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <>
                  <span>{getItemCount(listAText)} items</span>
                  <span>{getUniqueCount(listAText)} unique</span>
                </>
              }
            />

            {/* List B Panel */}
            <CodePanel fillHeight={true}
              title="List B"
              value={listBText}
              onChange={setListBText}
              language={editorLanguage}
              height="500px"
              theme={theme}
              wrapText={listBWrapText}
              onWrapTextChange={setListBWrapText}
              placeholder="Enter items, one per line..."
              showCopyButton={true}
              showClearButton={true}
              headerActions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      Load Example
                      <ChevronDownIcon className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleLoadExample('list-b')}>
                      Load Example
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              footerLeftContent={
                <>
                  <span>{getItemCount(listBText)} items</span>
                  <span>{getUniqueCount(listBText)} unique</span>
                </>
              }
            />
          </div>

          {/* Statistics Bar */}
          {stats && (
            <div className="flex items-center justify-center gap-6 py-3 px-4 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[10px] flex-wrap">
              <span className="text-sm text-muted-foreground">
                List A: <span className="font-medium">{stats.listASize}</span> items (
                <span className="font-medium">{stats.listAUnique}</span> unique)
              </span>
              <span className="text-sm text-muted-foreground">
                List B: <span className="font-medium">{stats.listBSize}</span> items (
                <span className="font-medium">{stats.listBUnique}</span> unique)
              </span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Common: {stats.commonItems}
              </span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Only in A: {stats.onlyInA}
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Only in B: {stats.onlyInB}
              </span>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Similarity: {stats.similarity}%
              </span>
            </div>
          )}

          {/* Results Section */}
          {hasContent && (
            <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[10px] overflow-hidden">
              {/* Operation Selector */}
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground mr-2">Operation:</span>
                  {LIST_COMPARISON_OPTIONS.operations.map((op) => (
                    <Button
                      key={op.value}
                      variant={options.operation === op.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOptions((prev) => ({ ...prev, operation: op.value as typeof options.operation }))}
                      className="h-8 px-3 text-xs"
                      title={op.description}
                    >
                      {op.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search results..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent w-48"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyResults}
                    disabled={filteredResults.length === 0}
                    className="h-8 px-3 text-xs"
                  >
                    {copySuccess === 'results' ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy All
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs" disabled={filteredResults.length === 0}>
                        <Download className="h-3 w-3 mr-1" />
                        Export
                        <ChevronDownIcon className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport('json')}>Export as JSON</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('txt')}>Export as TXT</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Results List */}
              <div className="p-4">
                {filteredResults.length > 0 ? (
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {filteredResults.map((item, index) => {
                      const bgColor =
                        item.source === 'both'
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : item.source === 'a-only'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                          : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';

                      const textColor =
                        item.source === 'both'
                          ? 'text-green-700 dark:text-green-300'
                          : item.source === 'a-only'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-blue-700 dark:text-blue-300';

                      const badgeText =
                        item.source === 'both'
                          ? '(in both)'
                          : item.source === 'a-only'
                          ? '(in A only)'
                          : '(in B only)';

                      return (
                        <div
                          key={index}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md border',
                            bgColor
                          )}
                        >
                          <Check className={cn('h-4 w-4 shrink-0', textColor)} />
                          <span className={cn('font-mono text-sm flex-1', textColor)}>{item.originalValue}</span>
                          <span className={cn('text-xs font-medium', textColor)}>{badgeText}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No results match your search' : 'No results to display'}
                  </div>
                )}
              </div>

              {/* Results Footer */}
              <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700 text-sm text-muted-foreground">
                {filteredResults.length} {filteredResults.length === 1 ? 'item' : 'items'}
                {searchQuery && filteredResults.length !== results.length && (
                  <span> (filtered from {results.length} total)</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

