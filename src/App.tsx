import { AppShell } from './components/AppShell'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { CanvasEditor } from './components/CanvasEditor'
import './App.css'

function App() {
  const onDragStart = (event: React.DragEvent, nodeType: string, layerType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    if (layerType) {
      event.dataTransfer.setData('application/layertype', layerType)
    }
    event.dataTransfer.effectAllowed = 'move'
  }

  const paletteContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sidebar-foreground">Palette</h2>
        <ThemeToggle />
      </div>
      <div className="space-y-2">
        <div 
          className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
          draggable
          onDragStart={(event) => onDragStart(event, 'input', 'component')}
        >
          Input Block
        </div>
        <div 
          className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
          draggable
          onDragStart={(event) => onDragStart(event, 'default', 'processing')}
        >
          Processing Block
        </div>
        <div 
          className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
          draggable
          onDragStart={(event) => onDragStart(event, 'output', 'display')}
        >
          Output Block
        </div>
        <div 
          className="p-3 bg-sidebar-accent rounded-md text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
          draggable
          onDragStart={(event) => onDragStart(event, 'default', 'custom')}
        >
          Custom Block
        </div>
      </div>
    </div>
  )

  const canvasContent = (
    <CanvasEditor 
      onNodesChange={(nodes) => {
        console.log('Nodes changed:', nodes)
      }}
      onEdgesChange={(edges) => {
        console.log('Edges changed:', edges)
      }}
    />
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
