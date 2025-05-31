import { AppShell } from './components/AppShell'
import { ThemeProvider } from './components/ThemeProvider'
import { CanvasEditor } from './components/CanvasEditor'
import { BlockPalette } from './components/BlockPalette'
import { getOrderedLayers, generateKerasCode } from './lib/graph-utils'
import type { Node, Edge } from '@xyflow/react'
import { useState } from 'react'
import './App.css'

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const paletteContent = <BlockPalette />

  const canvasContent = (
    <CanvasEditor 
      onNodesChange={setNodes}
      onEdgesChange={setEdges}
    />
  )

  // Generate code based on current nodes and edges
  const orderedLayers = getOrderedLayers(nodes, edges)
  const generatedCode = generateKerasCode(orderedLayers)

  const codeViewerContent = (
    <div className="space-y-4">
      <h2 className="font-semibold text-sidebar-foreground">Generated Keras Code</h2>
      <div className="bg-sidebar-accent rounded-md p-4 text-sidebar-accent-foreground">
        <pre className="font-mono text-sm overflow-auto whitespace-pre-wrap">
          {generatedCode}
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
