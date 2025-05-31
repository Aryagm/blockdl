import { AppShell } from './components/AppShell'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import './App.css'

function App() {
  const paletteContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sidebar-foreground">Palette</h2>
        <ThemeToggle />
      </div>
      <div className="space-y-2">
        <div className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors">
          Block Component 1
        </div>
        <div className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors">
          Block Component 2
        </div>
        <div className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors">
          Block Component 3
        </div>
        <div className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors">
          Block Component 4
        </div>
      </div>
    </div>
  )

  const canvasContent = (
    <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
      <div className="text-center text-muted-foreground">
        <h2 className="text-3xl font-bold mb-4">Block Canvas</h2>
        <p className="text-lg">Drag and drop blocks here to build your application</p>
      </div>
    </div>
  )

  const codeViewerContent = (
    <div className="space-y-4">
      <h2 className="font-semibold text-sidebar-foreground">Generated Code</h2>
      <div className="bg-sidebar-accent rounded-md p-4 text-sidebar-accent-foreground">
        <pre className="font-mono text-sm overflow-auto">
{`// Generated React component
function MyComponent() {
  return (
    <div className="p-4">
      <h1>Hello World</h1>
      <p>This is generated code</p>
    </div>
  )
}`}
        </pre>
      </div>
    </div>
  )

  return (
    <ThemeProvider defaultTheme="system" storageKey="blockdl-theme">
      <AppShell 
        palette={paletteContent}
        canvas={canvasContent} 
        codeViewer={codeViewerContent}
      />
    </ThemeProvider>
  )
}

export default App
