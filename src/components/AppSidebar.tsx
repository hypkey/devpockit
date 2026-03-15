"use client"

import { SearchTools } from "@/components/layout/SearchTools"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CODE_EDITOR_THEMES, type CodeEditorTheme } from '@/config/code-editor-themes'
import { useCodeEditorTheme } from '@/hooks/useCodeEditorTheme'
import { toolCategories } from "@/libs/tools-data"
import { cn } from "@/libs/utils"
import {
  ArrowLeftRight,
  ChevronRight,
  Code,
  FileText,
  Globe,
  Heart,
  Home,
  Info,
  Lock,
  Moon,
  PanelLeft,
  RefreshCw,
  Search,
  Settings,
  Sun,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

// Map category IDs to lucide icons
const getCategoryIcon = (categoryId: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    'text-tools': FileText,
    'formatters': Code,
    'cryptography': Lock,
    'encoders': RefreshCw,
    'converters': ArrowLeftRight,
    'network': Globe,
    'utilities': Settings,
  }
  return iconMap[categoryId] || FileText
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selectedTool?: string
  onToolSelect?: (toolId: string) => void
  onHomeClick?: () => void
  onLogoClick?: () => void  // Clears all state and navigates home
  onAboutClick?: () => void  // Handles About page navigation
  onSearchClick?: () => void  // Opens command palette
  onClearAllAndGoHome?: () => void  // Clears all tabs and navigates home
}

export function AppSidebar({
  selectedTool,
  onToolSelect,
  onHomeClick,
  onLogoClick,
  onAboutClick,
  onSearchClick,
  onClearAllAndGoHome,
  ...props
}: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { state, toggleSidebar } = useSidebar()
  const [codeEditorTheme, setCodeEditorTheme] = useCodeEditorTheme('basicDark')
  const [mounted, setMounted] = React.useState(false)
  const [openCategories, setOpenCategories] = React.useState<Set<string>>(new Set())
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)

  // Avoid hydration mismatch by waiting for client-side mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which category contains the selected tool and auto-expand it
  const getExpandedCategories = React.useMemo(() => {
    if (!selectedTool) return []
    const category = toolCategories.find(cat =>
      cat.tools.some(tool => tool.id === selectedTool)
    )
    return category ? [category.id] : []
  }, [selectedTool])

  // Update open categories when selectedTool changes
  React.useEffect(() => {
    const expandedCategories = getExpandedCategories
    if (expandedCategories.length > 0) {
      setOpenCategories(prev => {
        const newSet = new Set(prev)
        expandedCategories.forEach(catId => newSet.add(catId))
        return newSet
      })
    }
  }, [getExpandedCategories])

  const handleToolSelect = (toolId: string) => {
    if (onToolSelect) {
      onToolSelect(toolId)
    } else {
      const tool = toolCategories
        .flatMap(cat => cat.tools)
        .find(t => t.id === toolId)
      if (tool) {
        router.push(`/tools/${tool.category}/${toolId}`)
      }
    }
  }

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick()
    } else {
      router.push('/')
    }
  }

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick()
    } else {
      router.push('/')
    }
  }

  const handleCategoryToggle = (categoryId: string, isOpen: boolean) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev)
      if (isOpen) {
        newSet.add(categoryId)
      } else {
        newSet.delete(categoryId)
      }
      return newSet
    })
  }

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "w-8 h-8 shrink-0 flex items-center justify-center transition-all cursor-pointer",
                  isCollapsed && "hover:bg-sidebar-accent rounded-md"
                )}
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                onClick={isCollapsed ? toggleSidebar : handleLogoClick}
              >
                {isCollapsed && isLogoHovered ? (
                  <PanelLeft className="h-4 w-4 text-sidebar-foreground" />
                ) : (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/devpockit-logo.svg`}
                    alt="DevPockit Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                )}
              </div>
            </TooltipTrigger>
            {isCollapsed ? (
              <TooltipContent side="right">
                Expand sidebar
              </TooltipContent>
            ) : (
              <TooltipContent side="right">
                Go to home
              </TooltipContent>
            )}
          </Tooltip>
          <div
            className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="flex items-baseline gap-2 hover:opacity-80 transition-opacity">
              <span className="font-serif text-[24px] leading-[24px] tracking-normal text-sidebar-foreground">
                DevPockit
              </span>
              <span className="text-xs text-muted-foreground">
                v{process.env.NEXT_PUBLIC_APP_VERSION}
              </span>
            </div>
          </div>
          <SidebarTrigger className={cn("ml-auto", isCollapsed && "hidden")} />
        </div>
        <div className="mt-1 group-data-[collapsible=icon]:hidden">
          <SearchTools onToolSelect={handleToolSelect} onSearchClick={onSearchClick} />
        </div>
        {/* Search button for collapsed sidebar */}
        {isCollapsed && (
          <div className="mt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSearchClick?.()}
                  className="w-full h-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors"
                  aria-label="Search tools"
                >
                  <Search className="h-4 w-4 text-sidebar-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Search tools
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mb-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="All tools"
                  isActive={pathname === '/'}
                  onClick={() => {
                    if (onClearAllAndGoHome) {
                      onClearAllAndGoHome();
                    } else {
                      handleHomeClick();
                    }
                  }}
                >
                  <Home className="h-4 w-4" />
                  <span>All tools</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="my-1" />
        {toolCategories.map((category, index) => {
          const IconComponent = getCategoryIcon(category.id)
          const isOpen = openCategories.has(category.id)

          return (
            <SidebarGroup key={category.id} className={index === 0 ? "mt-1" : ""}>
              <SidebarGroupContent>
                <Collapsible
                  asChild
                  open={isOpen}
                  onOpenChange={(open) => handleCategoryToggle(category.id, open)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={{
                          children: (
                            <div className="flex flex-col gap-1">
                              <div className="font-semibold border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-1 text-neutral-900 dark:text-neutral-100">{category.name}</div>
                              {category.tools.map((tool) => (
                                <div
                                  key={tool.id}
                                  className="text-xs cursor-pointer hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:text-neutral-100 py-1 px-2 rounded-md -mx-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToolSelect(tool.id)
                                  }}
                                >
                                  {tool.name}
                                </div>
                              ))}
                            </div>
                          ),
                          className: "w-48",
                        }}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{category.name}</span>
                        <ChevronRight className="ml-auto h-8 w-8 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent suppressHydrationWarning>
                      <SidebarMenuSub>
                        {category.tools.map((tool) => (
                          <SidebarMenuSubItem key={tool.id}>
                            <SidebarMenuSubButton
                              isActive={tool.id === selectedTool}
                              onClick={() => handleToolSelect(tool.id)}
                            >
                              <span>{tool.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter className="px-2 pt-2 pb-5 gap-2 group-data-[collapsible=icon]:items-center">
        {/* Top Separator */}
        <SidebarSeparator className="my-1 -mx-2 w-auto self-stretch" />

        {/* About and Support us menu items */}
        <SidebarMenu className="group-data-[collapsible=icon]:w-auto">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isCollapsed ? "About" : undefined}
              onClick={() => {
                if (onAboutClick) {
                  onAboutClick();
                } else {
                  router.push('/about');
                }
              }}
            >
              <Info className="h-4 w-4" />
              <span className={cn(isCollapsed && "hidden")}>About</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <a href="https://buymeacoffee.com/hypkey" target="_blank" rel="noopener noreferrer">
              <SidebarMenuButton tooltip={isCollapsed ? "Support us" : undefined}>
                <Heart className="h-4 w-4" />
                <span className={cn(isCollapsed && "hidden")}>Support us</span>
              </SidebarMenuButton>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Separator */}
        <SidebarSeparator className="my-1 -mx-2 w-auto self-stretch" />

        {/* Theme Toggle - Different layouts for collapsed vs expanded */}
        {isCollapsed ? (
          /* Collapsed: Single icon toggle button */
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-[8px] transition-colors bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  )}
                >
                  {mounted && theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          /* Expanded: Combined Theme Toggle and Code Editor Theme Selector */
          <div className="flex items-center gap-2 pl-1.5 pr-[8px] pt-1">
            {/* Dark/Light Mode Toggle */}
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-[10px] p-[3px] flex items-center flex-shrink-0">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center justify-center min-h-[29px] min-w-[29px] px-2 py-1 rounded-[8px] transition-colors',
                  mounted && theme === 'light'
                    ? 'bg-white dark:bg-neutral-900 shadow-xs'
                    : 'bg-transparent'
                )}
                title="Light mode"
              >
                <Sun className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex items-center justify-center min-h-[29px] min-w-[29px] px-2 py-1 rounded-[8px] transition-colors',
                  mounted && theme === 'dark'
                    ? 'bg-white dark:bg-neutral-900 shadow-xs'
                    : 'bg-transparent'
                )}
                title="Dark mode"
              >
                <Moon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Code Editor Theme Selector */}
            <div className="flex-1">
              <Select
                value={codeEditorTheme}
                onValueChange={(value) => setCodeEditorTheme(value as CodeEditorTheme)}
              >
                <SelectTrigger borderless className="h-[35px] w-full text-xs bg-neutral-100 dark:bg-neutral-800">
                <div className="flex items-center gap-2">
                  <Code className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
                  <SelectValue />
                </div>
              </SelectTrigger>
                <SelectContent container={typeof document !== 'undefined' ? document.body : undefined}>
                  {Object.values(CODE_EDITOR_THEMES).map((themeConfig) => (
                    <SelectItem key={themeConfig.name} value={themeConfig.name}>
                      {themeConfig.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
