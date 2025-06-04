/**
 * AppShell Component
 * 
 * Main layout shell for the BlockDL application providing a three-panel layout:
 * - Left sidebar for block palette
 * - Center area for canvas editor
 * - Right sidebar for code viewer
 * 
 * Features a fixed minimum width to ensure proper functionality across all panels.
 */

import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { AppHeader } from './AppHeader'

import type { Node, Edge } from '@xyflow/react'

/**
 * Props for the AppShell component
 */
interface AppShellProps {
  /** React component for the left sidebar block palette */
  palette?: ReactNode
  /** React component for the center canvas editor */
  canvas?: ReactNode
  /** React component for the right sidebar code viewer */
  codeViewer?: ReactNode
  /** Additional CSS classes to apply to the root container */
  className?: string
  /** Array of flow nodes for the current project */
  nodes?: Node[]
  /** Array of flow edges for the current project */
  edges?: Edge[]
  /** Callback fired when importing a project */
  onImportProject?: (data: { nodes: Node[]; edges: Edge[] }) => void
  /** Callback fired when clearing all project data */
  onClearAll?: () => void
}

/**
 * AppShell - Main Application Layout Component
 * 
 * Provides the core three-panel layout structure for the BlockDL application.
 * Manages responsive design and overflow behavior for optimal user experience.
 * 
 * @param props - The component props
 * @returns The rendered application shell
 */
export function AppShell({
  palette,
  canvas,
  codeViewer,
  className,
  nodes = [],
  edges = [],
  onImportProject,
  onClearAll,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-slate-100 text-slate-900 min-w-[1280px]",
        className
      )}
    >
      {/* Application Header */}
      <AppHeader
        nodes={nodes}
        edges={edges}
        onImportProject={onImportProject}
        onClearAll={onClearAll}
      />

      {/* Main Content Area - Three Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Block Palette */}
        <aside className="w-72 bg-white border-r border-slate-200 flex-shrink-0 shadow-sm">
          <div className="h-full overflow-hidden">
            {palette}
          </div>
        </aside>

        {/* Center Panel - Canvas Editor */}
        <main className="flex-grow bg-white min-w-0">
          <div className="h-full">
            {canvas}
          </div>
        </main>

        {/* Right Sidebar - Code Viewer */}
        <aside className="w-[500px] bg-white border-l border-slate-200 flex-shrink-0 shadow-sm">
          <div className="h-full overflow-hidden">
            {codeViewer}
          </div>
        </aside>
      </div>
    </div>
  )
}
