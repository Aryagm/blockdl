import { useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'
import { getLayerDef, getDefaultParams, getLayerIcon } from '../lib/layer-defs'

// Layer category color mapping
const getLayerCategoryColor = (type: string) => {
  const categoryColors: Record<string, { bg: string; border: string; hover: string }> = {
    'Input': { bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:border-emerald-300 hover:shadow-emerald-200/50' },
    'Output': { bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:border-emerald-300 hover:shadow-emerald-200/50' },
    'Dense': { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-300 hover:shadow-blue-200/50' },
    'Conv2D': { bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:border-purple-300 hover:shadow-purple-200/50' },
    'Conv2DTranspose': { bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:border-purple-300 hover:shadow-purple-200/50' },
    'MaxPool2D': { bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:border-indigo-300 hover:shadow-indigo-200/50' },
    'GlobalAvgPool': { bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:border-indigo-300 hover:shadow-indigo-200/50' },
    'UpSampling2D': { bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:border-indigo-300 hover:shadow-indigo-200/50' },
    'Flatten': { bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:border-amber-300 hover:shadow-amber-200/50' },
    'Activation': { bg: 'bg-orange-50', border: 'border-orange-200', hover: 'hover:border-orange-300 hover:shadow-orange-200/50' },
    'BatchNorm': { bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:border-rose-300 hover:shadow-rose-200/50' },
    'Dropout': { bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:border-rose-300 hover:shadow-rose-200/50' },
    'Embedding': { bg: 'bg-cyan-50', border: 'border-cyan-200', hover: 'hover:border-cyan-300 hover:shadow-cyan-200/50' },
    'LSTM': { bg: 'bg-cyan-50', border: 'border-cyan-200', hover: 'hover:border-cyan-300 hover:shadow-cyan-200/50' },
    'GRU': { bg: 'bg-cyan-50', border: 'border-cyan-200', hover: 'hover:border-cyan-300 hover:shadow-cyan-200/50' },
    'Merge': { bg: 'bg-teal-50', border: 'border-teal-200', hover: 'hover:border-teal-300 hover:shadow-teal-200/50' }
  }
  
  return categoryColors[type] || { bg: 'bg-white', border: 'border-slate-200', hover: 'hover:border-blue-300 hover:shadow-blue-200/50' }
}

interface LayerNodeData {
  type: string
  params: Record<string, any>
  hasShapeError?: boolean
  shapeErrorMessage?: string
}

interface LayerNodeProps {
  id: string
  data: LayerNodeData
}

export function LayerNode({ id, data }: LayerNodeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editParams, setEditParams] = useState(data.params || getDefaultParams(data.type))
  const { updateNodeData, deleteElements } = useReactFlow()
  
  const { type, params = getDefaultParams(data.type), hasShapeError = false, shapeErrorMessage } = data
  const layerDef = getLayerDef(type)
  const icon = getLayerIcon(type)
  const categoryColors = getLayerCategoryColor(type)

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

  const renderParamEditor = (field: any) => {
    const { key, label, type, options, min, max, step } = field

    if (type === 'select') {
      const currentValue = editParams[key]?.toString() || ''
      // For activation fields, default to 'none' if no value is set
      const selectValue = currentValue === '' && key === 'activation' ? 'none' : currentValue
      
      return (
        <div key={key} className="space-y-1">
          <Label htmlFor={key} className="text-xs">{label}</Label>
          <Select
            value={selectValue}
            onValueChange={(newValue) => setEditParams({ ...editParams, [key]: newValue })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option: { value: string; label: string }) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <div key={key} className="space-y-1">
        <Label htmlFor={key} className="text-xs">{label}</Label>
        <Input
          id={key}
          type={type}
          value={editParams[key]?.toString() || ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const newValue = type === 'number' ? 
              (e.target.value === '' ? '' : Number(e.target.value)) : 
              e.target.value
            setEditParams({ ...editParams, [key]: newValue })
          }}
          className="h-8"
        />
      </div>
    )
  }

  // Count total parameters to show if there are more
  const totalParams = layerDef?.formSpec.length || 0
  const visibleParams = []
  
  // Collect visible parameters in order of importance
  if (params.shape) visibleParams.push(`shape: ${params.shape}`)
  if (params.filters) visibleParams.push(`${params.filters} filters`)
  if (params.units) visibleParams.push(`${params.units} units`)
  if (params.pool_size) visibleParams.push(`pool: ${params.pool_size}`)
  if (params.kernel_size) visibleParams.push(`kernel: ${params.kernel_size}`)
  if (params.activation && params.activation !== 'linear') visibleParams.push(params.activation)
  if (params.rate) visibleParams.push(`rate: ${params.rate}`)
  if (params.size) visibleParams.push(`size: ${params.size}`)

  return (
    <div className="layer-node">
      {/* Input handle - only show if not Input layer */}
      {type !== 'Input' && (
        <Handle
          type="target"
          position={Position.Top}
          className={`w-4 h-4 border-2 border-white shadow-sm ${
            hasShapeError ? '!bg-red-500' : '!bg-blue-500'
          }`}
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
              className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg hover:shadow-xl hover:scale-110"
              title="Delete this block"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            
            {/* Larger horizontal block with consistent spacing */}
            <div 
              className={`flex flex-col px-4 py-3 rounded-xl shadow-md border-2 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] min-w-[160px] max-w-[280px] ${
                hasShapeError 
                  ? 'border-red-500 hover:border-red-600 hover:shadow-red-200/50 bg-red-50' 
                  : `${categoryColors.border} ${categoryColors.hover} ${categoryColors.bg}`
              }`}
              onDoubleClick={handleDoubleClick}
              title={hasShapeError ? `Shape Error: ${shapeErrorMessage}` : `${type} - Double click to edit`}
            >
              {/* Header with icon and name - always centered */}
              <div className={`flex items-center gap-2 ${visibleParams.length === 0 && !hasShapeError ? 'justify-center' : ''}`}>
                <span className="text-base group-hover:scale-110 transition-transform duration-200 flex-shrink-0">{icon}</span>
                <span className={`font-semibold text-sm truncate ${hasShapeError ? 'text-red-700' : 'text-slate-700'}`}>
                  {type}
                </span>
                {hasShapeError && (
                  <span className="text-red-500 text-sm font-bold flex-shrink-0" title={`Shape Error: ${shapeErrorMessage}`}>
                    ⚠️
                  </span>
                )}
              </div>
              
              {/* Parameters display with consistent spacing */}
              {visibleParams.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {visibleParams.slice(0, 3).map((param, index) => (
                    <span key={index} className="text-xs text-slate-600 bg-white/70 px-2 py-0.5 rounded-md">
                      {param}
                    </span>
                  ))}
                  {totalParams > 3 && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      +{totalParams - 3} more
                    </span>
                  )}
                </div>
              )}
              
              {/* Error message display with consistent spacing */}
              {hasShapeError && shapeErrorMessage && (
                <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-md border border-red-200 mt-2">
                  {shapeErrorMessage}
                </div>
              )}
            </div>
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
              {layerDef?.formSpec.map((field) => 
                renderParamEditor(field)
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
          className={`w-4 h-4 border-2 border-white shadow-sm ${
            hasShapeError ? '!bg-red-500' : '!bg-green-500'
          }`}
        />
      )}
    </div>
  )
}
