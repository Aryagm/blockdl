import { AppShell } from './components/AppShell'
import { CanvasEditor } from './components/CanvasEditor'
import { BlockPalette } from './components/BlockPalette'
import { CodeViewer } from './components/CodeViewer'
import type { Node, Edge } from '@xyflow/react'
import { useState } from 'react'
import './App.css'

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const handleClearAll = () => {
    setNodes([])
    setEdges([])
  }

  const paletteContent = (
    <BlockPalette 
      nodes={nodes}
      edges={edges}
      onClearAll={handleClearAll}
    />
  )

  const canvasContent = (
    <CanvasEditor 
      nodes={nodes}
      edges={edges}
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
    <AppShell 
      palette={paletteContent}
      canvas={canvasContent} 
      codeViewer={codeViewerContent}
    />
  )
}

export default App
