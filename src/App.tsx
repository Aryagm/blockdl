import { AppShell } from './components/AppShell'
import { ThemeProvider } from './components/ThemeProvider'
import { CanvasEditor } from './components/CanvasEditor'
import { BlockPalette } from './components/BlockPalette'
import './App.css'

function App() {
  const paletteContent = <BlockPalette />

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
