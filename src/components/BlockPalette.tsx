import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from './ui/dialog'
import { Trash2 } from 'lucide-react'
import { getLayerTypes } from '../lib/layer-defs'
import { useState } from 'react'
import type { Node, Edge } from '@xyflow/react'

const layerTypes = getLayerTypes()

// Group layers by category with color coding
const layerCategories = [
  {
    name: 'Input/Output',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    layers: layerTypes.filter(layer => ['Input', 'Output'].includes(layer.type))
  },
  {
    name: 'Dense Layers',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    layers: layerTypes.filter(layer => ['Dense'].includes(layer.type))
  },
  {
    name: 'Convolutional',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    layers: layerTypes.filter(layer => ['Conv2D', 'Conv2DTranspose'].includes(layer.type))
  },
  {
    name: 'Pooling',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    layers: layerTypes.filter(layer => ['MaxPool2D', 'GlobalAvgPool', 'UpSampling2D'].includes(layer.type))
  },
  {
    name: 'Transformation',
    color: 'amber',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    layers: layerTypes.filter(layer => ['Flatten'].includes(layer.type))
  },
  {
    name: 'Activation',
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    layers: layerTypes.filter(layer => ['Activation'].includes(layer.type))
  },
  {
    name: 'Regularization',
    color: 'rose',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
    layers: layerTypes.filter(layer => ['BatchNorm', 'Dropout'].includes(layer.type))
  },
  {
    name: 'Sequence',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    layers: layerTypes.filter(layer => ['Embedding', 'LSTM', 'GRU'].includes(layer.type))
  },
  {
    name: 'Merge',
    color: 'teal',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    layers: layerTypes.filter(layer => ['Merge'].includes(layer.type))
  }
]

interface BlockPaletteProps {
  className?: string
  nodes?: Node[]
  edges?: Edge[]
  onClearAll?: () => void
}

export function BlockPalette({ 
  className = '', 
  nodes = [], 
  edges = [], 
  onClearAll 
}: BlockPaletteProps) {
  const [showClearDialog, setShowClearDialog] = useState(false)
  
  const handleDragStart = (event: React.DragEvent, layerType: string) => {
    event.dataTransfer.setData('layerType', layerType)
    event.dataTransfer.setData('application/reactflow', 'default')
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleClearAll = () => {
    onClearAll?.()
    setShowClearDialog(false)
  }

  return (
    <div className={`space-y-6 p-6 h-full overflow-y-auto bg-slate-50/80 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-lg">Block Palette</h2>
      </div>
      
      {/* Clear All Button */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            disabled={nodes.length === 0 && edges.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Blocks
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Blocks</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all blocks from the canvas? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {layerCategories.map((category) => (
        <div key={category.name} className="space-y-3">
          <h3 className={`text-sm font-medium ${category.textColor} border-b border-slate-200 pb-1`}>
            {category.name}
          </h3>
          <div className="space-y-2">
            {category.layers.map((layer) => (
              <Card
                key={layer.type}
                className={`cursor-move hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${category.borderColor} ${category.bgColor} hover:shadow-slate-200 rounded-xl shadow-sm`}
                draggable
                onDragStart={(event) => handleDragStart(event, layer.type)}
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
              >
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm flex items-center gap-3 ${category.textColor}`}>
                    <span className="text-lg">{layer.icon}</span>
                    {layer.type}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-slate-500">
                    {layer.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      <Card className="border-slate-200 bg-blue-50/50 rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
            <span>💡</span>
            How to use
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-blue-600">
            Drag and drop blocks onto the canvas to build your neural network architecture.
            Double-click blocks to edit parameters, or click the trash icon to remove them.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
