import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { Download, Upload, HelpCircle, Blocks } from 'lucide-react'
import { useState } from 'react'
import type { Node, Edge } from '@xyflow/react'

interface AppHeaderProps {
  nodes?: Node[]
  edges?: Edge[]
  onImportProject?: (data: { nodes: Node[], edges: Edge[] }) => void
}

export function AppHeader({ 
  nodes = [], 
  edges = [], 
  onImportProject 
}: AppHeaderProps) {
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  const handleExportProject = () => {
    const projectData = {
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }
    
    const dataStr = JSON.stringify(projectData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `blockdl-project-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.nodes && data.edges) {
              onImportProject?.(data)
            } else {
              alert('Invalid project file format')
            }
          } catch (error) {
            alert('Error reading project file')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between">
      {/* Left side - App Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Blocks className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">BlockDL</h1>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportProject}
          disabled={nodes.length === 0 && edges.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportProject}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>

        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>BlockDL Help & Instructions</DialogTitle>
              <DialogDescription>
                Learn how to use BlockDL to build neural network architectures visually
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">🧱 Building Your Network</h3>
                <ul className="space-y-1 text-slate-600 ml-4">
                  <li>• Drag blocks from the left palette onto the canvas</li>
                  <li>• Connect blocks by dragging from output handles to input handles</li>
                  <li>• Double-click blocks to edit their parameters</li>
                  <li>• Use the trash icon to delete blocks</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">📂 Project Management</h3>
                <ul className="space-y-1 text-slate-600 ml-4">
                  <li>• <strong>Export:</strong> Save your project as a JSON file</li>
                  <li>• <strong>Import:</strong> Load a previously saved project</li>
                  <li>• <strong>Clear All:</strong> Remove all blocks from the canvas</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">📋 Layer Categories</h3>
                <ul className="space-y-1 text-slate-600 ml-4">
                  <li>• <span className="text-emerald-600">Input/Output:</span> Start and end points of your network</li>
                  <li>• <span className="text-blue-600">Dense:</span> Fully connected layers</li>
                  <li>• <span className="text-purple-600">Convolutional:</span> Conv2D and transpose convolution</li>
                  <li>• <span className="text-indigo-600">Pooling:</span> Downsampling and upsampling layers</li>
                  <li>• <span className="text-orange-600">Activation:</span> Non-linear activation functions</li>
                  <li>• <span className="text-rose-600">Regularization:</span> Batch normalization and dropout</li>
                  <li>• <span className="text-cyan-600">Sequence:</span> RNN, LSTM, and embedding layers</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">💻 Code Generation</h3>
                <ul className="space-y-1 text-slate-600 ml-4">
                  <li>• The right panel shows generated TensorFlow/Keras code</li>
                  <li>• Code updates automatically as you modify your network</li>
                  <li>• Copy the code to use in your Python projects</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
