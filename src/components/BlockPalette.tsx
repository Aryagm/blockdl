import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { getLayerTypes } from '../lib/layer-defs'

const layerTypes = getLayerTypes()

interface BlockPaletteProps {
  className?: string
}

export function BlockPalette({ className = '' }: BlockPaletteProps) {
  const handleDragStart = (event: React.DragEvent, layerType: string) => {
    event.dataTransfer.setData('layerType', layerType)
    event.dataTransfer.setData('application/reactflow', 'default')
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className={`space-y-6 p-6 h-full overflow-y-auto bg-slate-50/80 ${className}`}>
      <div className="flex items-center">
        <h2 className="font-semibold text-slate-800 text-lg">Block Palette</h2>
      </div>
      
      <div className="space-y-4">
        {layerTypes.map((layer) => (
          <Card
            key={layer.type}
            className="cursor-move hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-slate-200 bg-white hover:bg-slate-50 rounded-xl shadow-sm hover:shadow-slate-200"
            draggable
            onDragStart={(event) => handleDragStart(event, layer.type)}
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
            onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-3 text-slate-700">
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
