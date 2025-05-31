import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ThemeToggle } from './ThemeToggle'

const layerTypes = [
  { type: 'Input', icon: '📥', description: 'Input layer for data' },
  { type: 'Dense', icon: '🔗', description: 'Fully connected layer' },
  { type: 'Activation', icon: '⚡', description: 'Activation function' },
  { type: 'Dropout', icon: '🎲', description: 'Regularization layer' },
  { type: 'Output', icon: '📤', description: 'Output layer' },
]

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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sidebar-foreground">Block Palette</h2>
        <ThemeToggle />
      </div>
      
      <div className="space-y-3">
        {layerTypes.map((layer) => (
          <Card
            key={layer.type}
            className="cursor-move hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent"
            draggable
            onDragStart={(event) => handleDragStart(event, layer.type)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-sidebar-accent-foreground">
                <span className="text-lg">{layer.icon}</span>
                {layer.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-sidebar-muted-foreground">
                {layer.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="border-sidebar-border bg-sidebar-accent/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-sidebar-accent-foreground">
            💡 How to use
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-sidebar-muted-foreground">
            Drag and drop blocks onto the canvas to build your neural network architecture.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
