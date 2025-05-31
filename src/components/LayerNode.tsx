import { Handle, Position } from '@xyflow/react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface LayerNodeData {
  type: string
  params: Record<string, any>
}

interface LayerNodeProps {
  id: string
  data: LayerNodeData
}

// Default parameters for each layer type
const getDefaultParams = (type: string): Record<string, any> => {
  switch (type) {
    case 'Dense':
      return { units: 128 }
    case 'Activation':
      return { type: 'relu' }
    case 'Dropout':
      return { rate: 0.2 }
    case 'Input':
      return { shape: '(784,)' }
    case 'Output':
      return { units: 10, activation: 'softmax' }
    default:
      return {}
  }
}

// Get icon for each layer type
const getLayerIcon = (type: string): string => {
  switch (type) {
    case 'Input':
      return '📥'
    case 'Dense':
      return '🔗'
    case 'Activation':
      return '⚡'
    case 'Dropout':
      return '🎲'
    case 'Output':
      return '📤'
    default:
      return '⚙️'
  }
}

// Format params for display
const formatParams = (params: Record<string, any>): string => {
  return Object.entries(params)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
}

export function LayerNode({ data }: LayerNodeProps) {
  const { type, params = getDefaultParams(data.type) } = data
  const icon = getLayerIcon(type)
  const formattedParams = formatParams(params)

  return (
    <div className="layer-node">
      {/* Input handle - only show if not Input layer */}
      {type !== 'Input' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-blue-500 border-2 border-white"
        />
      )}
      
      <Card className="min-w-[160px] shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold">{type}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            {formattedParams && (
              <div className="bg-muted/50 rounded px-2 py-1 font-mono">
                {formattedParams}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Output handle - only show if not Output layer */}
      {type !== 'Output' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-green-500 border-2 border-white"
        />
      )}
    </div>
  )
}
