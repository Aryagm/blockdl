import { useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'
import { getLayerDef, getDefaultParams, getLayerIcon } from '../lib/layer-defs'
import { categories } from '../lib/layer-definitions'
import { getParameterDisplayValues, getTotalParameterCount } from '../lib/parameter-display'

// Dynamic layer category color mapping from new TypeScript system
const getLayerCategoryColor = (layerType: string) => {
  try {
    const layerDef = getLayerDef(layerType)
    const categoryKey = layerDef?.category || ''
    const category = categories[categoryKey as keyof typeof categories]
    
    if (category) {
      const baseColor = category.color
      return {
        bg: `bg-${baseColor}-50`,
        border: `border-${baseColor}-200`,
        hover: `hover:border-${baseColor}-300 hover:shadow-${baseColor}-200/50`
      }
    }
  } catch (error) {
    console.warn('Failed to load category colors from new system:', error)
  }
  
  // Fallback colors
  return { bg: 'bg-white', border: 'border-slate-200', hover: 'hover:border-blue-300 hover:shadow-blue-200/50' }
}

import type { LayerParamValue, LayerFormField } from '../lib/layer-defs'

interface LayerNodeData {
  type: string
  params: Record<string, LayerParamValue>
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

  const renderParamEditor = (field: LayerFormField) => {
    const { key, label, type, options, min, max, step, show } = field

    // Check if field should be shown based on conditional logic
    if (show && !show(editParams)) {
      return null
    }

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

  // Use parameter display utilities
  const visibleParams = getParameterDisplayValues(type, params)
  const totalParams = getTotalParameterCount(type)

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
                e.preventDefault()
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
                {/* Multiplier badge */}
                {params.multiplier && Number(params.multiplier) > 1 && (
                  <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0" title={`This layer will be repeated ${params.multiplier} times`}>
                    ×{params.multiplier}
                  </span>
                )}
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
                  {/* Only show "more" indicator for layers that have more actual parameters, 
                      not for Input layers which show computed display values */}
                  {type !== 'Input' && totalParams > 3 && (
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
