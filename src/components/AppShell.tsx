import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AppShellProps {
  palette?: ReactNode
  canvas?: ReactNode
  codeViewer?: ReactNode
  className?: string
}

export function AppShell({ 
  palette, 
  canvas, 
  codeViewer, 
  className 
}: AppShellProps) {
  return (
    <div className={cn(
      "flex h-screen bg-background text-foreground",
      className
    )}>
      {/* Left Sidebar - Palette */}
      <div className="w-60 bg-sidebar border-r border-sidebar-border">
        <div className="h-full p-4">
          {palette || (
            <div className="text-sidebar-foreground">
              <h2 className="font-semibold mb-4">Palette</h2>
              <div className="space-y-2">
                <div className="p-2 bg-sidebar-accent rounded-md text-sidebar-accent-foreground">
                  Palette Item 1
                </div>
                <div className="p-2 bg-sidebar-accent rounded-md text-sidebar-accent-foreground">
                  Palette Item 2
                </div>
                <div className="p-2 bg-sidebar-accent rounded-md text-sidebar-accent-foreground">
                  Palette Item 3
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-grow bg-background">
        <div className="h-full p-4">
          {canvas || (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <div className="text-center text-muted-foreground">
                <h2 className="text-2xl font-semibold mb-2">Canvas Area</h2>
                <p>Your main content goes here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Code Viewer */}
      <div className="w-96 bg-sidebar border-l border-sidebar-border">
        <div className="h-full p-4">
          {codeViewer || (
            <div className="text-sidebar-foreground">
              <h2 className="font-semibold mb-4">Code Viewer</h2>
              <div className="bg-sidebar-accent rounded-md p-4 text-sidebar-accent-foreground font-mono text-sm">
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
  )
}
