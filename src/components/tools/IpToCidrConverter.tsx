'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  analyzeNetwork,
  getCidrSuggestions,
  ipToCidrAuto,
  validateIpAddress
} from '@/libs/ip-cidr';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface IpToCidrConverterProps {
  className?: string;
  instanceId: string;
}

const IP_EXAMPLES = [
  { label: 'Private Class A', value: '10.0.0.1' },
  { label: 'Private Class B', value: '172.16.0.1' },
  { label: 'Private Class C', value: '192.168.1.1' },
  { label: 'Loopback', value: '127.0.0.1' },
  { label: 'Link Local', value: '169.254.1.1' },
  { label: 'Public IP Example', value: '8.8.8.8' },
  { label: 'Cloudflare DNS', value: '1.1.1.1' },
];

export function IpToCidrConverter({ className, instanceId }: IpToCidrConverterProps) {
  const { toolState, updateToolState } = useToolState('ip-to-cidr-converter', instanceId);

  // Initialize with defaults
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Editor settings
  const [theme] = useCodeEditorTheme('basicDark');
  const [wrapText, setWrapText] = useState(true);

  // Hydrate state from toolState after mount
  useEffect(() => {
    setIsHydrated(true);
    if (toolState) {
      if (toolState.input) setInput(toolState.input as string);
      if (toolState.output) setOutput(toolState.output as string);
      if (toolState.error) setError(toolState.error as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state
  useEffect(() => {
    if (isHydrated) {
      updateToolState({ input, output, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, output, error, isHydrated]);

  // Reset state when tool is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setInput('');
      setOutput('');
      setError('');
    }
  }, [toolState, isHydrated]);

  const handleConvert = async () => {
    if (!input.trim()) {
      setError('Please enter an IP address');
      setOutput('');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const ipValidation = validateIpAddress(input);
      if (!ipValidation.isValid) {
        throw new Error(ipValidation.error || 'Invalid IP address');
      }

      const autoResult = ipToCidrAuto(input);
      if (!autoResult.isValid) {
        throw new Error(autoResult.error || 'Failed to convert IP to CIDR');
      }

      let result = `IP Address: ${input}\nSuggested CIDR: ${autoResult.cidr}\nNetwork Address: ${autoResult.networkAddress}\nSubnet Mask: ${autoResult.subnetMask}`;

      // Get suggestions
      const suggestions = getCidrSuggestions(input);
      if (suggestions.length > 0) {
        result += `\n\n=== Other CIDR Options ===\n${suggestions.map(s => `  ${s}`).join('\n')}`;
      }

      // Analyze the suggested CIDR
      const analysisResult = analyzeNetwork(autoResult.cidr);
      if (analysisResult?.isValid) {
        result += `\n\n=== Network Analysis ===\n`;
        result += `Network Class: ${analysisResult.networkClass}\n`;
        result += `Total Hosts: ${analysisResult.totalHosts.toLocaleString()}\n`;
        result += `Usable Hosts: ${analysisResult.usableHosts.toLocaleString()}\n`;
        result += `Wildcard Mask: ${analysisResult.wildcardMask}\n`;
        result += `Is Private: ${analysisResult.isPrivate ? 'Yes' : 'No'}\n`;
        result += `Is Loopback: ${analysisResult.isLoopback ? 'Yes' : 'No'}`;
        if (analysisResult.isMulticast) result += `\nIs Multicast: Yes`;
        if (analysisResult.isLinkLocal) result += `\nIs Link Local: Yes`;
      }

      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
      setOutput('');
    } finally {
      setIsConverting(false);
    }
  };

  const handleLoadExample = (value: string) => {
    setInput(value);
    setError('');
  };

  const getLineCount = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Section */}
      <div className="bg-background px-[28px] pt-[36px] pb-[20px]">
        <h1 className="text-[32px] font-normal leading-6 tracking-normal text-neutral-900 dark:text-neutral-100 mb-3">
          IP to CIDR Converter
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Convert an IP address to CIDR notation with network suggestions
        </p>
      </div>

      {/* Body Section */}
      <div className="flex-1 flex flex-col bg-background px-[24px] pt-6 pb-10 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Input Row */}
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-background pl-3 pr-2 py-[9.5px] text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 dark:border-neutral-700 flex-1">
                <div className="flex items-center gap-3 text-sm leading-normal tracking-[0.07px] flex-1 min-w-0">
                  <span className="text-neutral-500 whitespace-nowrap dark:text-neutral-400">IP Address:</span>
                  <input
                    placeholder="e.g., 192.168.1.1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="font-mono bg-transparent text-neutral-900 dark:text-neutral-100 outline-hidden flex-1 min-w-0 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 px-3 text-xs">
                    Load Examples
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  {IP_EXAMPLES.map((example) => (
                    <DropdownMenuItem key={example.value} onClick={() => handleLoadExample(example.value)}>
                      <div className="flex flex-col">
                        <span>{example.label}</span>
                        <span className="text-xs text-muted-foreground font-mono">{example.value}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Button Row */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleConvert}
                disabled={isConverting || !input.trim()}
                variant="default"
                size="default"
              >
                {isConverting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Converting...
                  </>
                ) : (
                  'Convert'
                )}
              </Button>
            </div>
          </div>

          {/* Output Panel */}
          <CodePanel fillHeight={true}
            title="Conversion Result"
            value={output}
            language="plaintext"
            height="500px"
            className="flex-1"
            theme={theme}
            wrapText={wrapText}
            onWrapTextChange={setWrapText}
            footerLeftContent={
              output && <span>{getLineCount(output)} lines</span>
            }
          />

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

