/**
 * CodePanel Component
 * A unified code panel component that supports both input (editable) and output (read-only) modes
 * Supports single content or tabbed outputs
 */

'use client';

import { CodeEditorCore } from '@/components/ui/code-editor-core';
import { EditorSettingsMenu } from '@/components/ui/editor-settings-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type CodeEditorTheme } from '@/config/code-editor-themes';
import { cn } from '@/libs/utils';
import { Check, Copy, Trash2 } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import React, { useEffect, useState } from 'react';

export interface CodePanelTab {
  id: string;
  label: string;
  value: string;
  language?: string;
}

// Re-export for backward compatibility
export type CodeOutputTab = CodePanelTab;

export interface CodePanelProps {
  // Content (single mode)
  title?: string;
  value?: string;
  onChange?: (value: string) => void; // If provided, editable mode
  language?: string;

  // Tabbed mode
  tabs?: CodePanelTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  // Editor settings
  height?: string;
  theme?: CodeEditorTheme;
  wrapText?: boolean;
  onWrapTextChange?: (wrapText: boolean) => void;
  showLineNumbers?: boolean;
  onShowLineNumbersChange?: (showLineNumbers: boolean) => void;
  placeholder?: string;
  readOnly?: boolean; // If not provided, auto-detect from onChange
  singleLine?: boolean; // If true, editor only allows single line input

  // Optional features
  showCopyButton?: boolean;
  showClearButton?: boolean;
  showWrapToggle?: boolean;
  showStats?: boolean; // words, characters, lines

  // Custom content
  headerActions?: React.ReactNode;
  footerLeftContent?: React.ReactNode;
  footerRightContent?: React.ReactNode;
  customTabContent?: (tabId: string) => React.ReactNode; // Custom render function for specific tabs
  children?: React.ReactNode; // Custom content for single mode (alternative to code editor)
  onCopy?: () => Promise<string | null>; // Custom copy handler, returns content to copy or null to use default
  alwaysShowFooter?: boolean; // Whether to always show footer even if no content

  // Editor mount callback
  onEditorMount?: (editor: any, monaco: any) => void;

  // Styling
  className?: string;
  // When true (or when className includes flex-1/h-full), panels grow AND shrink with
  // their flex/grid container instead of enforcing a hard minHeight floor.
  fillHeight?: boolean;
  // Minimum height when in fill mode. Defaults to '160px' to keep the editor usable.
  minFillHeight?: string;
}

export function CodePanel({
  title,
  value,
  onChange,
  language = 'plaintext',
  tabs,
  activeTab,
  onTabChange,
  height = '374px',
  theme = 'basicDark',
  wrapText = true,
  onWrapTextChange,
  showLineNumbers = true,
  onShowLineNumbersChange,
  placeholder,
  readOnly: readOnlyProp,
  singleLine = false,
  showCopyButton = true,
  showClearButton = false,
  showWrapToggle = true,
  showStats = false,
  headerActions,
  footerLeftContent,
  footerRightContent,
  customTabContent,
  children,
  onCopy: customOnCopy,
  alwaysShowFooter = false,
  onEditorMount,
  className,
  fillHeight = false,
  minFillHeight = '160px',
}: CodePanelProps) {
  // Detect fill-height mode: the panel is a flex/grid child that should grow and shrink
  // with its container rather than enforce a hard minHeight floor.
  const isFillMode = fillHeight || (className?.split(/\s+/).some(c => c === 'flex-1' || c === 'h-full') ?? false);
  // Auto-detect read-only mode: if onChange is not provided, it's read-only
  const readOnly = readOnlyProp !== undefined ? readOnlyProp : !onChange;

  // State
  const [copySuccess, setCopySuccess] = useState(false);
  const [stickyScroll, setStickyScroll] = useState(false);
  const [renderWhitespace, setRenderWhitespace] = useState(false);
  const [renderControlCharacters, setRenderControlCharacters] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(showLineNumbers);
  const [autoComplete, setAutoComplete] = useState(false); // Disabled by default
  // For tabbed mode: store editors by tab ID. For single mode: use 'single' as key
  const [editorInstances, setEditorInstances] = useState<Map<string, Monaco.editor.IStandaloneCodeEditor>>(new Map());

  // Determine if we're in tabbed mode
  const isTabbedMode = tabs && tabs.length > 0;

  // Determine if we're in custom content mode (children provided, no code editor)
  const isCustomContentMode = !isTabbedMode && !value && !onChange && children !== undefined;

  // Get current content based on mode
  const currentTab = isTabbedMode ? tabs.find(t => t.id === activeTab) || tabs[0] : null;
  const currentValue = isTabbedMode ? (currentTab?.value || '') : (value || '');
  const currentLanguage = isTabbedMode ? (currentTab?.language || 'plaintext') : language;
  const currentEditorKey = isTabbedMode ? (activeTab || tabs[0]?.id || '') : 'single';
  const currentEditorInstance = editorInstances.get(currentEditorKey) || null;

  const hasContent = currentValue && currentValue.trim().length > 0;
  const hasCustomCopy = customOnCopy !== undefined;
  const canCopy = hasContent || hasCustomCopy;

  // Debug: Log copy button state
  // console.log('Copy button state:', { hasContent, hasCustomCopy, canCopy, customOnCopy: !!customOnCopy });

  // Copy handler
  const handleCopy = async () => {
    try {
      let textToCopy = '';

      // Use custom copy handler if provided
      if (customOnCopy) {
        const customContent = await customOnCopy();
        if (customContent !== null && customContent !== '') {
          textToCopy = customContent;
        } else if (customContent === null && currentValue) {
          // Custom handler returned null, fall back to currentValue
          textToCopy = currentValue;
        } else {
          // Custom handler returned empty or null with no currentValue
          return; // Nothing to copy
        }
      } else {
        // No custom handler, use currentValue
        if (!currentValue) {
          return; // Nothing to copy
        }
        textToCopy = currentValue;
      }

      if (!textToCopy) {
        return; // Nothing to copy
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Clear handler (only for editable mode)
  const handleClear = () => {
    if (onChange) {
      onChange('');
    }
  };

  // Editor mount handler
  const handleEditorMount = (editor: any, monaco: any) => {
    // Calculate the editor key based on current mode (tab ID or 'single')
    const editorKey = isTabbedMode ? (activeTab || tabs?.[0]?.id || '') : 'single';
    // Store editor instance for the current key (tab ID or 'single')
    setEditorInstances(prev => {
      const newMap = new Map(prev);
      newMap.set(editorKey, editor);
      return newMap;
    });
    // Apply initial editor settings
    editor.updateOptions({
      stickyScroll: {
        enabled: stickyScroll,
      },
      renderWhitespace: renderWhitespace ? 'all' : 'none',
      renderControlCharacters: renderControlCharacters,
      lineNumbers: lineNumbers ? 'on' : 'off',
      quickSuggestions: autoComplete,
      suggestOnTriggerCharacters: autoComplete,
      acceptSuggestionOnCommitCharacter: autoComplete,
      tabCompletion: autoComplete ? 'on' : 'off',
    });
    // Call the original onEditorMount if provided
    onEditorMount?.(editor, monaco);
  };

  // Sync lineNumbers state with prop changes
  useEffect(() => {
    setLineNumbers(showLineNumbers);
  }, [showLineNumbers]);

  // Update editor options when state changes (for all editors in tabbed mode, or single editor)
  useEffect(() => {
    if (editorInstances.size > 0) {
      editorInstances.forEach((editor) => {
        editor.updateOptions({
          stickyScroll: {
            enabled: stickyScroll,
          },
          renderWhitespace: renderWhitespace ? 'all' : 'none',
          renderControlCharacters: renderControlCharacters,
          lineNumbers: lineNumbers ? 'on' : 'off',
          quickSuggestions: autoComplete,
          suggestOnTriggerCharacters: autoComplete,
          acceptSuggestionOnCommitCharacter: autoComplete,
          tabCompletion: autoComplete ? 'on' : 'off',
        });
      });
    }
  }, [editorInstances, stickyScroll, renderWhitespace, renderControlCharacters, lineNumbers, autoComplete]);

  // Settings change handlers
  const handleStickyScrollChange = (enabled: boolean) => {
    setStickyScroll(enabled);
  };

  const handleRenderWhitespaceChange = (enabled: boolean) => {
    setRenderWhitespace(enabled);
  };

  const handleRenderControlCharactersChange = (enabled: boolean) => {
    setRenderControlCharacters(enabled);
  };

  const handleShowLineNumbersChange = (enabled: boolean) => {
    setLineNumbers(enabled);
    onShowLineNumbersChange?.(enabled);
  };

  const handleAutoCompleteChange = (enabled: boolean) => {
    setAutoComplete(enabled);
  };

  const handleZoomIn = () => {
    // Zoom is handled by the menu component via editor actions
  };

  const handleZoomOut = () => {
    // Zoom is handled by the menu component via editor actions
  };

  const handleResetZoom = () => {
    // Zoom is handled by the menu component via editor actions
  };

  // Stats helpers
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  // Handle value change (for editable mode)
  const handleValueChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div
      className={cn(
        'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[10px] overflow-hidden flex flex-col',
        isFillMode && 'min-h-0',
        className
      )}
      style={isCustomContentMode ? { height } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-0">
        {/* Title or Tabs */}
        <div className="flex items-center gap-4">
          {isTabbedMode ? (
            tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  'px-2 py-2.5 text-sm font-medium leading-normal tracking-[0.07px] transition-colors border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'text-foreground border-orange-600'
                    : 'text-neutral-600 dark:text-neutral-400 border-transparent hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))
          ) : (
            title && (
              <div className="px-2 py-2.5 text-sm font-medium leading-normal tracking-[0.07px] text-foreground">
                {title}
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Custom header actions */}
          {headerActions}

          {/* Clear Button (only for editable mode) */}
          {showClearButton && !readOnly && (
            <button
              onClick={handleClear}
              disabled={!hasContent}
              className={cn(
                'p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors',
                !hasContent && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="Clear content"
            >
              <Trash2 className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
            </button>
          )}

          {/* Copy Button */}
          {showCopyButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopy();
                    }}
                    disabled={!canCopy}
                    className={cn(
                      'p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors relative z-10 cursor-pointer',
                      !canCopy && 'opacity-50 cursor-not-allowed'
                    )}
                    aria-label="Copy to clipboard"
                    type="button"
                  >
                    {copySuccess ? (
                      <Check className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isTabbedMode && activeTab === 'tree' ? 'Copy expanded JSON' : 'Copy to clipboard'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className={cn(
        'flex-1 pt-px pb-1 px-1',
        isCustomContentMode && 'overflow-hidden'
      )} style={!isCustomContentMode ? { minHeight: isFillMode ? minFillHeight : height } : undefined}>
        <div style={{ height: '100%' }}>
          {(() => {
            // Custom content mode (children provided, no code editor)
            if (isCustomContentMode) {
              return (
                <div className="h-full overflow-auto bg-white dark:bg-neutral-900 rounded-md p-4">
                  {children}
                </div>
              );
            }

            // Check if we have custom content for this tab
            if (isTabbedMode && activeTab && customTabContent) {
              const customContent = customTabContent(activeTab);
              if (customContent !== null && customContent !== undefined) {
                return customContent;
              }
            }

            // Default code editor (for non-tabbed mode or when no custom content)
            return (
              <CodeEditorCore
                key={isTabbedMode ? activeTab : 'single'}
                value={currentValue}
                onChange={readOnly ? undefined : handleValueChange}
                language={currentLanguage}
                theme={theme}
                wrapText={wrapText}
                showLineNumbers={lineNumbers}
                readOnly={readOnly}
                placeholder={placeholder}
                height="100%"
                singleLine={singleLine}
                onMount={handleEditorMount}
              />
            );
          })()}
        </div>
      </div>

      {/* Footer */}
      {(alwaysShowFooter || footerLeftContent || footerRightContent || showStats || (showWrapToggle && onWrapTextChange)) && (
        <div className="flex items-center justify-between px-3 py-2 min-h-[52px] text-sm text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-4">
            {/* Editor Settings Menu */}
            {showWrapToggle && onWrapTextChange && (
              <EditorSettingsMenu
                editorInstance={currentEditorInstance}
                wrapText={wrapText}
                onWrapTextChange={onWrapTextChange}
                stickyScroll={stickyScroll}
                onStickyScrollChange={handleStickyScrollChange}
                renderWhitespace={renderWhitespace}
                onRenderWhitespaceChange={handleRenderWhitespaceChange}
                renderControlCharacters={renderControlCharacters}
                onRenderControlCharactersChange={handleRenderControlCharactersChange}
                showLineNumbers={lineNumbers}
                onShowLineNumbersChange={handleShowLineNumbersChange}
                autoComplete={autoComplete}
                onAutoCompleteChange={handleAutoCompleteChange}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
              />
            )}
            {/* Stats */}
            {showStats && (
              <>
                <span>{getWordCount(currentValue)} words</span>
                <span>{getCharacterCount(currentValue)} characters</span>
                <span>{getLineCount(currentValue)} lines</span>
              </>
            )}
            {footerLeftContent}
          </div>
          {footerRightContent}
        </div>
      )}
    </div>
  );
}

