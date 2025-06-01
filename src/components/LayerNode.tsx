import { useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'

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

export function LayerNode({ id, data }: LayerNodeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editParams, setEditParams] = useState(data.params || getDefaultParams(data.type))
  const { updateNodeData, deleteElements } = useReactFlow()
  
  const { type, params = getDefaultParams(data.type) } = data
  const icon = getLayerIcon(type)
  const formattedParams = formatParams(params)

  const handleDoubleClick = () => {
    setIsOpen(true)
    setEditParams({ ...params })
  }

  const handleSave = () => {
    updateNodeData(id, { ...data, params: editParams })
    setIsOpen(false)
  }

  const handleCancel = () => {
    setEditParams({ ...params })
    setIsOpen(false)
  }

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] })
    setIsOpen(false)
  }

  const renderParamEditor = (key: string, value: any) => {
    if (key === 'type' && data.type === 'Activation') {
      return (
        <div key={key} className="space-y-1">
          <Label htmlFor={key} className="text-xs">{key}</Label>
          <Select
            value={editParams[key]?.toString() || ''}
            onValueChange={(newValue) => setEditParams({ ...editParams, [key]: newValue })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select activation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relu">ReLU</SelectItem>
              <SelectItem value="sigmoid">Sigmoid</SelectItem>
              <SelectItem value="tanh">Tanh</SelectItem>
              <SelectItem value="softmax">Softmax</SelectItem>
              <SelectItem value="linear">Linear</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (key === 'activation' && data.type === 'Output') {
      return (
        <div key={key} className="space-y-1">
          <Label htmlFor={key} className="text-xs">{key}</Label>
          <Select
            value={editParams[key]?.toString() || ''}
            onValueChange={(newValue) => setEditParams({ ...editParams, [key]: newValue })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select activation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="softmax">Softmax</SelectItem>
              <SelectItem value="sigmoid">Sigmoid</SelectItem>
              <SelectItem value="linear">Linear</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <div key={key} className="space-y-1">
        <Label htmlFor={key} className="text-xs">{key}</Label>
        <Input
          id={key}
          type={typeof value === 'number' ? 'number' : 'text'}
          value={editParams[key]?.toString() || ''}
          onChange={(e) => {
            const newValue = typeof value === 'number' ? 
              (e.target.value === '' ? '' : Number(e.target.value)) : 
              e.target.value
            setEditParams({ ...editParams, [key]: newValue })
          }}
          className="h-8"
        />
      </div>
    )
  }

  return (
    <div className="layer-node">
      {/* Input handle - only show if not Input layer */}
      {type !== 'Input' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-blue-500 border-2 border-white shadow-sm"
        />
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            {/* Delete button - positioned absolutely in top-right corner */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:shadow-xl hover:scale-110"
              title="Delete this block"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            
            <Card 
              className="min-w-[160px] shadow-md border-2 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 cursor-pointer bg-white hover:bg-slate-50 rounded-xl border-slate-200 hover:border-blue-300 hover:scale-[1.02]"
              onDoubleClick={handleDoubleClick}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-3">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">{icon}</span>
                  <span className="font-semibold text-slate-700">{type}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-slate-500">
                  {formattedParams && (
                    <div className="bg-slate-100 rounded-lg px-3 py-2 font-mono text-slate-600">
                      {formattedParams}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" side="right" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span>{icon}</span>
                Edit {type} Layer
              </h4>
              <p className="text-xs text-muted-foreground">
                Configure the parameters for this layer.
              </p>
            </div>
            
            <div className="space-y-3">
              {Object.entries(editParams).map(([key, value]) => 
                renderParamEditor(key, value)
              )}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex-1">
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Output handle - only show if not Output layer */}
      {type !== 'Output' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-green-500 border-2 border-white shadow-sm"
        />
      )}
    </div>
  )
}
