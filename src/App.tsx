import { AppShell } from './components/AppShell'
import { CanvasEditor } from './components/CanvasEditor'
import BlockPalette from './components/BlockPalette'
import { CodeViewer } from './components/CodeViewer'
import type { Node, Edge } from '@xyflow/react'
import { useFlowStore } from './lib/flow-store'
import { initializeLayerDefs } from './lib/yaml-layer-loader'
import { useEffect } from 'react'
import './App.css'

function App() {
  const { nodes, edges, setNodes, setEdges } = useFlowStore()

  // Initialize YAML layer definitions on app startup
  useEffect(() => {
    const initLayers = async () => {
      try {
        console.log('🔄 Starting YAML layer initialization...')
        await initializeLayerDefs()
        console.log('✅ YAML layer definitions loaded successfully')
        
        // Debug: Check what was loaded
        const { getLayerTypes } = await import('./lib/layer-defs')
        const layerTypes = getLayerTypes()
        console.log(`📊 Loaded ${layerTypes.length} layer types:`, layerTypes.map(l => l.type))
      } catch (error) {
        console.error('❌ Failed to load YAML layer definitions:', error)
        if (error instanceof Error) {
          console.error('Error details:', error.stack)
        }
      }
    }
    
    initLayers()
  }, [])

  const handleClearAll = () => {
    setNodes([])
    setEdges([])
  }

  const handleImportProject = (data: { nodes: Node[], edges: Edge[] }) => {
    setNodes(data.nodes)
    setEdges(data.edges)
  }

  const paletteContent = (
    <BlockPalette />
  )

  const canvasContent = (
    <CanvasEditor />
  )

  const codeViewerContent = (
    <CodeViewer />
  )

  return (
    <AppShell 
      palette={paletteContent}
      canvas={canvasContent} 
      codeViewer={codeViewerContent}
      nodes={nodes}
      edges={edges}
      onImportProject={handleImportProject}
      onClearAll={handleClearAll}
    />
  )
}

export default App
