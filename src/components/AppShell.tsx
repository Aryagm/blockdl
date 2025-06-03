import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AppHeader } from './AppHeader'
import type { Node, Edge } from '@xyflow/react'

interface AppShellProps {
  palette?: ReactNode
  canvas?: ReactNode
  codeViewer?: ReactNode
  className?: string
  nodes?: Node[]
  edges?: Edge[]
  onImportProject?: (data: { nodes: Node[], edges: Edge[] }) => void
}

export function AppShell({ 
  palette, 
  canvas, 
  codeViewer, 
  className,
  nodes = [],
  edges = [],
  onImportProject
}: AppShellProps) {
  return (
    <div className={cn(
      "flex flex-col h-screen bg-slate-100 text-slate-900 min-w-[1280px]",
      className
    )}>
      {/* Header */}
      <AppHeader 
        nodes={nodes}
        edges={edges}
        onImportProject={onImportProject}
      />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Palette */}
        <div className="w-72 bg-white border-r border-slate-200 flex-shrink-0 shadow-sm">
          <div className="h-full overflow-hidden">
            {palette || (
              <div className="p-6">
                <h2 className="font-semibold mb-4 text-slate-800">Palette</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-200">
                    Palette Item 1
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-200">
                    Palette Item 2
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-200">
                    Palette Item 3
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-grow bg-white min-w-0">
          <div className="h-full">
            {canvas || (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl m-4">
                <div className="text-center text-slate-500">
                  <h2 className="text-2xl font-semibold mb-2 text-slate-700">Canvas Area</h2>
                  <p>Your main content goes here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Code Viewer */}
        <div className="w-[500px] bg-white border-l border-slate-200 flex-shrink-0 shadow-sm">
          <div className="h-full overflow-hidden">
            {codeViewer || (
              <div className="p-6">
                <h2 className="font-semibold mb-4 text-slate-800">Code Viewer</h2>
                <div className="bg-slate-50 rounded-xl p-4 text-slate-700 font-mono text-sm border border-slate-200">
                  <pre>{`// Example code
function example() {
  console.log("Hello world!");
}`}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
