'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/libs/utils';
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, useListRef } from 'react-window';

export interface JsonTreeNode {
  key: string | number;
  value: any;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  isExpanded?: boolean;
  children?: JsonTreeNode[];
  parent?: JsonTreeNode;
  isLastChild: boolean;
  continuations: boolean[]; // per ancestor slot: true = draw vertical continuation line
}

export interface JsonTreeViewProps {
  data: any;
  highlightedPaths?: string[];
  onPathClick?: (path: string) => void;
  onGetExpandedJson?: (getExpandedJson: () => string) => void; // Callback to expose function to get expanded JSON
  maxDepth?: number;
  className?: string;
  height?: string;
}

// Transform JSON data into tree nodes
function transformToTreeNodes(
  data: any,
  key: string | number = 'root',
  path: string = '$',
  level: number = 0,
  maxDepth: number = 3,
  parent?: JsonTreeNode,
  isLastChild: boolean = true,
  continuations: boolean[] = []
): JsonTreeNode[] {
  const nodes: JsonTreeNode[] = [];

  // Continuations to pass down to children of this node:
  // - root (level 0) children get [] (no ancestor slots needed yet)
  // - deeper children get [...parent.continuations, !parent.isLastChild]
  const childContinuations = level === 0 ? [] : [...continuations, !isLastChild];

  if (data === null || data === undefined) {
    nodes.push({
      key,
      value: null,
      path,
      type: 'null',
      level,
      isExpanded: false,
      parent,
      isLastChild,
      continuations,
    });
    return nodes;
  }

  if (Array.isArray(data)) {
    const node: JsonTreeNode = {
      key,
      value: data,
      path,
      type: 'array',
      level,
      isExpanded: level < maxDepth,
      parent,
      children: [],
      isLastChild,
      continuations,
    };
    node.children = data.map((item, index) => {
      const childIsLast = index === data.length - 1;
      const childNodes = transformToTreeNodes(item, index, `${path}[${index}]`, level + 1, maxDepth, node, childIsLast, childContinuations);
      return childNodes[0];
    });
    nodes.push(node);
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    const node: JsonTreeNode = {
      key,
      value: data,
      path,
      type: 'object',
      level,
      isExpanded: level < maxDepth,
      parent,
      children: [],
      isLastChild,
      continuations,
    };
    node.children = keys.map((k, index) => {
      const childIsLast = index === keys.length - 1;
      const childNodes = transformToTreeNodes(data[k], k, `${path}.${k}`, level + 1, maxDepth, node, childIsLast, childContinuations);
      return childNodes[0];
    });
    nodes.push(node);
  } else {
    // Primitive value
    nodes.push({
      key,
      value: data,
      path,
      type: typeof data as 'string' | 'number' | 'boolean',
      level,
      isExpanded: false,
      parent,
      isLastChild,
      continuations,
    });
  }

  return nodes;
}

// Flatten tree nodes for virtual scrolling
function flattenTreeNodes(nodes: JsonTreeNode[], expandedPaths: Set<string>): JsonTreeNode[] {
  const flattened: JsonTreeNode[] = [];

  function traverse(nodeList: JsonTreeNode[]) {
    for (const node of nodeList) {
      flattened.push(node);
      if (node.children && node.children.length > 0 && expandedPaths.has(node.path)) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return flattened;
}

// Get expanded value (full JSON subtree)
function getExpandedValue(node: JsonTreeNode): string {
  if (node.type === 'object' || node.type === 'array') {
    return JSON.stringify(node.value, null, 2);
  }
  return JSON.stringify(node.value);
}

// Format value for display
function formatValue(value: any, type: string): string {
  if (type === 'string') {
    return `"${value}"`;
  }
  if (type === 'null') {
    return 'null';
  }
  if (type === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

// Get type badge color
function getTypeColor(type: string): string {
  switch (type) {
    case 'object':
      return 'text-neutral-600 dark:text-neutral-400';
    case 'array':
      return 'text-neutral-500 dark:text-neutral-500';
    case 'string':
      return 'text-green-600 dark:text-green-400';
    case 'number':
      return 'text-blue-600 dark:text-blue-400';
    case 'boolean':
      return 'text-orange-600 dark:text-orange-400';
    case 'null':
      return 'text-neutral-400 dark:text-neutral-600';
    default:
      return 'text-neutral-600 dark:text-neutral-400';
  }
}

// Get type badge background
function getTypeBg(type: string): string {
  switch (type) {
    case 'object':
      return 'bg-neutral-100 dark:bg-neutral-700';
    case 'array':
      return 'bg-neutral-50 dark:bg-neutral-800';
    case 'string':
      return 'bg-green-50 dark:bg-green-950/20';
    case 'number':
      return 'bg-blue-50 dark:bg-blue-950/20';
    case 'boolean':
      return 'bg-orange-50 dark:bg-orange-950/20';
    case 'null':
      return 'bg-neutral-50 dark:bg-neutral-800';
    default:
      return 'bg-neutral-100 dark:bg-neutral-700';
  }
}

interface TreeNodeItemProps {
  node: JsonTreeNode;
  isHighlighted: boolean;
  isExpanded: boolean;
  onToggle: (path: string) => void;
  onCopy: (node: JsonTreeNode) => void;
  searchTerm: string;
  itemHeight: number;
  isCopied: boolean;
}

function TreeNodeItem({
  node,
  isHighlighted,
  isExpanded,
  onToggle,
  onCopy,
  searchTerm,
  itemHeight,
  isCopied,
}: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = node.key === 'root' && node.level === 0;
  const displayKey = isRoot
    ? (node.type === 'array' ? '[]' : node.type === 'object' ? '{}' : '')
    : (typeof node.key === 'number' ? `[${node.key}]` : String(node.key));
  const displayValue = node.type === 'object' || node.type === 'array'
    ? node.type === 'array' ? `[${node.children?.length || 0}]` : `{${node.children?.length || 0}}`
    : formatValue(node.value, node.type);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(node);
  };

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(node.path);
    }
  };

  const isSearchMatch = searchTerm && (
    displayKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    displayValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={cn(
        'flex items-center gap-2 pr-2 h-full hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
        isHighlighted && 'bg-orange-50 dark:bg-orange-950/30 border-l-2 border-orange-600',
        isSearchMatch && !isHighlighted && 'bg-yellow-50 dark:bg-yellow-950/20'
      )}
    >
      {/* Tree Lines */}
      {node.level === 0 ? (
        <div className="w-2 shrink-0" />
      ) : (
        <div className="flex self-stretch shrink-0">
          {/* Ancestor continuation slots */}
          {node.continuations.map((hasContinuation, i) => (
            <div key={i} className="w-5 relative">
              {hasContinuation && (
                <div className="absolute top-0 bottom-0 left-[9px] w-px bg-neutral-300 dark:bg-neutral-600" />
              )}
            </div>
          ))}
          {/* Current-level connector (├ or └ shape) */}
          <div className="w-5 relative">
            {/* Vertical segment: full height if not last child, half if last */}
            <div className={cn(
              'absolute left-[9px] w-px bg-neutral-300 dark:bg-neutral-600',
              node.isLastChild ? 'top-0 bottom-1/2' : 'top-0 bottom-0'
            )} />
            {/* Horizontal segment */}
            <div className="absolute left-[9px] right-0 top-1/2 h-px bg-neutral-300 dark:bg-neutral-600" />
          </div>
        </div>
      )}

      {/* Copy Button (left of expand, shows path as tooltip on hover) */}
      <div className="relative shrink-0 opacity-0 group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors peer"
          aria-label="Copy JSON path"
        >
          {isCopied ? (
            <CheckIcon className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
          ) : (
            <DocumentDuplicateIcon className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
          )}
        </button>
        {/* Path tooltip */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1.5 px-2 py-1 rounded bg-neutral-800 dark:bg-neutral-200 text-neutral-100 dark:text-neutral-800 text-xs font-mono whitespace-nowrap pointer-events-none z-50 hidden peer-hover:block">
          {node.path}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={handleToggle}
        disabled={!hasChildren}
        className={cn(
          'shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors',
          !hasChildren && 'opacity-0 cursor-default'
        )}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {hasChildren && (
          isExpanded ? (
            <ChevronDownIcon className="h-3 w-3 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 text-neutral-600 dark:text-neutral-400" />
          )
        )}
      </button>

      {/* Type Badge */}
      <span
        className={cn(
          'shrink-0 px-1.5 py-0.5 text-xs font-mono rounded',
          getTypeBg(node.type),
          getTypeColor(node.type)
        )}
      >
        {node.type === 'object' ? '{}' : node.type === 'array' ? '[]' : node.type[0].toUpperCase()}
      </span>

      {/* Key */}
      {!isRoot && (
        <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
          {displayKey}:
        </span>
      )}

      {/* Value */}
      <span className={cn('text-sm flex-1', getTypeColor(node.type))}>
        {displayValue}
      </span>
    </div>
  );
}

export function JsonTreeView({
  data,
  highlightedPaths = [],
  onPathClick,
  onGetExpandedJson,
  maxDepth = 3,
  className,
  height = '500px',
}: JsonTreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const listRef = useListRef(null);
  const highlightedPathSet = useMemo(() => new Set(highlightedPaths), [highlightedPaths]);
  const lastSearchTermRef = useRef<string>('');

  // Transform data to tree nodes
  const rootNodes = useMemo(() => {
    return transformToTreeNodes(data, 'root', '$', 0, maxDepth);
  }, [data, maxDepth]);

  // Initialize expanded paths based on maxDepth
  useEffect(() => {
    const initialExpanded = new Set<string>();
    function markExpanded(nodes: JsonTreeNode[]) {
      for (const node of nodes) {
        if (node.isExpanded && node.children && node.children.length > 0) {
          initialExpanded.add(node.path);
          if (node.children) {
            markExpanded(node.children);
          }
        }
      }
    }
    markExpanded(rootNodes);
    setExpandedPaths(initialExpanded);
  }, [rootNodes]);

  // Flatten tree for virtual scrolling
  const flattenedNodes = useMemo(() => {
    return flattenTreeNodes(rootNodes, expandedPaths);
  }, [rootNodes, expandedPaths]);

  // Filter nodes by search term
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return flattenedNodes;
    return flattenedNodes.filter((node) => {
      const key = String(node.key === 'root' ? '' : node.key);
      const value = node.type === 'object' || node.type === 'array'
        ? `${node.type}`
        : formatValue(node.value, node.type);
      return (
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [flattenedNodes, searchTerm]);

  // Auto-expand paths that match search (only when search term changes)
  useEffect(() => {
    if (searchTerm && searchTerm !== lastSearchTermRef.current) {
      lastSearchTermRef.current = searchTerm;
      setExpandedPaths((prev) => {
        const newExpanded = new Set(prev);
        let hasChanges = false;
        // Use filteredNodes from the current render
        filteredNodes.forEach((node) => {
          if (node.children && node.children.length > 0 && !newExpanded.has(node.path)) {
            newExpanded.add(node.path);
            hasChanges = true;
          }
        });
        // Only update if there are actual changes to prevent infinite loops
        return hasChanges ? newExpanded : prev;
      });
    } else if (!searchTerm) {
      lastSearchTermRef.current = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // Only depend on searchTerm to prevent infinite loops

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allPaths = new Set<string>();
    function collectPaths(nodes: JsonTreeNode[]) {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          allPaths.add(node.path);
          collectPaths(node.children);
        }
      }
    }
    collectPaths(rootNodes);
    setExpandedPaths(allPaths);
  }, [rootNodes]);

  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const handleCopy = useCallback(async (node: JsonTreeNode) => {
    try {
      // Copy the JSON path expression instead of the value
      await navigator.clipboard.writeText(node.path);
      setCopiedPath(node.path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleNodeClick = useCallback((path: string) => {
    onPathClick?.(path);
  }, [onPathClick]);

  // Function to get JSON content of all expanded nodes only
  const getExpandedJson = useCallback((): string => {
    // Reconstruct JSON from expanded nodes only - collapsed nodes are completely removed
    function buildFromNode(node: JsonTreeNode): any {
      if (node.type === 'object') {
        if (expandedPaths.has(node.path) && node.children) {
          // Node is expanded, include only its expanded children
          const obj: any = {};
          node.children.forEach((child) => {
            if (child.type === 'object' || child.type === 'array') {
              if (expandedPaths.has(child.path)) {
                // Child is also expanded, recurse to get its expanded structure
                obj[child.key] = buildFromNode(child);
              }
              // If child is collapsed, skip it entirely (don't include in result)
            } else {
              // Primitive value - always include
              obj[child.key] = child.value;
            }
          });
          return obj;
        } else {
          // Node is collapsed, return undefined to exclude it
          return undefined;
        }
      } else if (node.type === 'array') {
        if (expandedPaths.has(node.path) && node.children) {
          // Node is expanded, include only its expanded children
          const result: any[] = [];
          node.children.forEach((child) => {
            if (child.type === 'object' || child.type === 'array') {
              if (expandedPaths.has(child.path)) {
                // Child is also expanded, recurse to get its expanded structure
                const childValue = buildFromNode(child);
                if (childValue !== undefined) {
                  result.push(childValue);
                }
              }
              // If child is collapsed, skip it entirely
            } else {
              // Primitive value - always include
              result.push(child.value);
            }
          });
          return result;
        } else {
          // Node is collapsed, return undefined to exclude it
          return undefined;
        }
      } else {
        // Primitive value
        return node.value;
      }
    }

    if (rootNodes.length === 0) {
      return '';
    }

    const rootNode = rootNodes[0];
    // Root node is always visible, so we need to check if it's expanded
    // If root is not expanded, return empty structure
    if (!expandedPaths.has(rootNode.path) && (rootNode.type === 'object' || rootNode.type === 'array')) {
      return JSON.stringify(rootNode.type === 'array' ? [] : {}, null, 2);
    }

    const expandedJson = buildFromNode(rootNode);
    return JSON.stringify(expandedJson, null, 2);
  }, [rootNodes, expandedPaths]);

  // Expose getExpandedJson function to parent
  useEffect(() => {
    onGetExpandedJson?.(getExpandedJson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getExpandedJson]);

  // Scroll to highlighted node
  useEffect(() => {
    if (highlightedPaths.length > 0 && listRef.current) {
      const index = filteredNodes.findIndex((node) => highlightedPathSet.has(node.path));
      if (index >= 0) {
        listRef.current.scrollToRow({ index, align: 'center' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedPaths, filteredNodes, highlightedPathSet]);

  const itemHeight = 36;
  // Calculate height - if height prop is provided, use it; otherwise use container height
  const containerHeight = typeof height === 'string'
    ? parseInt(height.replace('px', '')) || 500
    : typeof height === 'number'
    ? height
    : 500;
  const listHeight = Math.max(containerHeight - 60, 100); // Subtract toolbar height, min 100px

  // Row component for react-window v2
  const RowComponent = useCallback(({ index, style, ariaAttributes }: { index: number; style: React.CSSProperties; ariaAttributes: any }) => {
    const node = filteredNodes[index];
    if (!node) {
      return <div style={style} />;
    }

    return (
      <div style={style} className="group" {...ariaAttributes}>
        <TreeNodeItem
          node={node}
          isHighlighted={highlightedPathSet.has(node.path)}
          isExpanded={expandedPaths.has(node.path)}
          onToggle={handleToggle}
          onCopy={handleCopy}
          searchTerm={searchTerm}
          itemHeight={itemHeight}
          isCopied={copiedPath === node.path}
        />
      </div>
    );
  }, [filteredNodes, highlightedPathSet, expandedPaths, handleToggle, handleCopy, searchTerm, copiedPath, itemHeight]);

  return (
    <div className={cn('flex flex-col h-full relative', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-neutral-200 dark:border-neutral-700">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search keys, values, or paths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Expand/Collapse All */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
          className="h-8 px-2 text-xs"
        >
          <ArrowsPointingOutIcon className="h-3 w-3 mr-1" />
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCollapseAll}
          className="h-8 px-2 text-xs"
        >
          <ArrowsPointingInIcon className="h-3 w-3 mr-1" />
          Collapse All
        </Button>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-hidden relative">
        {filteredNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
            No nodes to display
          </div>
        ) : (
          <List<Record<string, never>>
            listRef={listRef}
            style={{ height: `${listHeight}px`, width: '100%' }}
            rowCount={filteredNodes.length}
            rowHeight={itemHeight}
            rowComponent={RowComponent}
            rowProps={{} as Record<string, never>}
            className="scrollbar-thin"
          />
          )}
        </div>
      </div>
    );
  }

