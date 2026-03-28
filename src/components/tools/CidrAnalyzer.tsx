'use client';

import { useToolState } from '@/components/providers/ToolStateProvider';
import { Button } from '@/components/ui/button';
import { CodePanel } from '@/components/ui/code-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme';
import {
  analyzeNetwork,
  calculateSubnets,
  getNetworkStats,
  parseCidr,
  validateCidr
} from '@/libs/ip-cidr';
import { cn } from '@/libs/utils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface CidrAnalyzerProps {
  className?: string;
  instanceId: string;
}

const CIDR_EXAMPLES = [
  { label: 'Home Network /24', value: '192.168.1.0/24' },
  { label: 'Half /24', value: '192.168.1.0/25' },
  { label: 'Quarter /24', value: '192.168.1.0/26' },
  { label: 'Small Subnet /27', value: '192.168.1.0/27' },
  { label: 'Point-to-Point /30', value: '192.168.1.0/30' },
  { label: 'Single Host /32', value: '192.168.1.1/32' },
  { label: 'Class A Private', value: '10.0.0.0/8' },
  { label: 'Class B Private', value: '172.16.0.0/12' },
  { label: 'Class C Private', value: '192.168.0.0/16' },
  { label: 'Loopback', value: '127.0.0.1/32' },
  { label: 'Link Local', value: '169.254.0.0/16' },
];

export function CidrAnalyzer({ className, instanceId }: CidrAnalyzerProps) {
  const { toolState, updateToolState } = useToolState('cidr-analyzer', instanceId);

  // Initialize with defaults
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNetworkInfo, setShowNetworkInfo] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);
  const [maxSubnets, setMaxSubnets] = useState(0); // 0 means None
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
      if (toolState.options) {
        const opts = toolState.options as Record<string, unknown>;
        if (opts.showNetworkInfo !== undefined) setShowNetworkInfo(opts.showNetworkInfo as boolean);
        if (opts.showStatistics !== undefined) setShowStatistics(opts.showStatistics as boolean);
        if (opts.maxSubnets !== undefined) setMaxSubnets(opts.maxSubnets as number);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update persistent state
  useEffect(() => {
    if (isHydrated) {
      updateToolState({
        input,
        output,
        error,
        options: { showNetworkInfo, showStatistics, maxSubnets }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, output, error, showNetworkInfo, showStatistics, maxSubnets, isHydrated]);

  // Reset state when tool is cleared
  useEffect(() => {
    if (isHydrated && (!toolState || Object.keys(toolState).length === 0)) {
      setInput('');
      setOutput('');
      setError('');
      setShowNetworkInfo(true);
      setShowStatistics(false);
      setMaxSubnets(0);
    }
  }, [toolState, isHydrated]);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('Please enter a CIDR notation');
      setOutput('');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const cidrValidation = validateCidr(input);
      if (!cidrValidation.isValid) {
        throw new Error(cidrValidation.error || 'Invalid CIDR notation');
      }

      const parseResult = parseCidr(input);
      if (!parseResult.isValid) {
        throw new Error(parseResult.error || 'Failed to parse CIDR');
      }

      let result = `CIDR: ${input}\nNetwork: ${parseResult.networkAddress}\nBroadcast: ${parseResult.broadcastAddress}\nSubnet Mask: ${parseResult.subnetMask}\nTotal Hosts: ${parseResult.totalHosts.toLocaleString()}\nUsable Hosts: ${parseResult.usableHosts.toLocaleString()}`;

      if (parseResult.firstUsable && parseResult.lastUsable) {
        result += `\nFirst Usable: ${parseResult.firstUsable}\nLast Usable: ${parseResult.lastUsable}`;
      }

      const analysisResult = analyzeNetwork(input);

      // Add network analysis if enabled
      if (showNetworkInfo && analysisResult?.isValid) {
        result += `\n\n=== Network Analysis ===\n`;
        result += `Network Class: ${analysisResult.networkClass}\n`;
        result += `Wildcard Mask: ${analysisResult.wildcardMask}\n`;
        result += `Host Bits: ${analysisResult.hostBits}\n`;
        result += `Network Bits: ${analysisResult.networkBits}\n`;
        result += `Is Private: ${analysisResult.isPrivate ? 'Yes' : 'No'}\n`;
        result += `Is Loopback: ${analysisResult.isLoopback ? 'Yes' : 'No'}`;
        if (analysisResult.isMulticast) result += `\nIs Multicast: Yes`;
        if (analysisResult.isLinkLocal) result += `\nIs Link Local: Yes`;
      }

      // Add subnet information if enabled
      if (maxSubnets > 0 && analysisResult?.isValid && analysisResult.totalHosts > 2) {
        const subnetCount = Math.min(maxSubnets, Math.floor(Math.log2(analysisResult.totalHosts)));
        if (subnetCount > 1) {
          const subnetResult = calculateSubnets(input, subnetCount);
          if (subnetResult.isValid) {
            result += `\n\n=== Subnet Information ===\n`;
            result += `Total Subnets: ${subnetResult.totalSubnets}\n`;
            result += `Hosts per Subnet: ${subnetResult.hostsPerSubnet}\n\n`;
            result += `Subnets:\n`;
            subnetResult.subnets.forEach((subnet, index) => {
              result += `  Subnet ${index + 1}: ${subnet.network} - ${subnet.broadcast}\n`;
              if (subnet.firstUsable && subnet.lastUsable) {
                result += `    Usable: ${subnet.firstUsable} - ${subnet.lastUsable}\n`;
              }
            });
          }
        }
      }

      // Add statistics if enabled
      if (showStatistics && analysisResult?.isValid) {
        const statsResult = getNetworkStats(input);
        if (statsResult.isValid) {
          result += `\n\n=== Network Statistics ===\n`;
          result += `Network Size: ${statsResult.networkSize}\n`;
          result += `Host Density: ${statsResult.hostDensity}\n`;
          result += `Common Uses: ${statsResult.commonUses.join(', ')}`;
          if (statsResult.subnetRecommendations.length > 0) {
            result += `\n\nSubnet Recommendations:\n`;
            statsResult.subnetRecommendations.forEach(rec => {
              result += `  ${rec}\n`;
            });
          }
        }
      }

      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setOutput('');
    } finally {
      setIsAnalyzing(false);
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
          CIDR Analyzer
        </h1>
        <p className="text-sm leading-5 tracking-normal text-neutral-900 dark:text-neutral-100">
          Analyze CIDR notation and get detailed network information
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
                  <span className="text-neutral-500 whitespace-nowrap dark:text-neutral-400">CIDR:</span>
                  <input
                    placeholder="e.g., 192.168.1.0/24"
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
                  {CIDR_EXAMPLES.map((example) => (
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

            {/* Options Row */}
            <div className="flex items-center gap-3 flex-wrap min-h-[40px]">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showNetworkInfo}
                  onCheckedChange={setShowNetworkInfo}
                  size="sm"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Network Info</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={showStatistics}
                  onCheckedChange={setShowStatistics}
                  size="sm"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Statistics</span>
              </div>

              <Select
                value={maxSubnets.toString()}
                onValueChange={(value) => setMaxSubnets(parseInt(value))}
              >
                <SelectTrigger label="Max Subnets:" className="min-w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !input.trim()}
                variant="default"
                size="default"
              >
                {isAnalyzing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
          </div>

          {/* Output Panel */}
          <CodePanel fillHeight={true}
            title="Analysis Result"
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

