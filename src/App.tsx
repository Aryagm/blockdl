import { AppShell } from './components/AppShell'
import { ThemeProvider } from './components/ThemeProvider'
import { CanvasEditor } from './components/CanvasEditor'
import { BlockPalette } from './components/BlockPalette'
import { CodeViewer } from './components/CodeViewer'
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

  const codeViewerContent = (
    <CodeViewer 
      nodes={nodes}
      edges={edges}
    />
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
