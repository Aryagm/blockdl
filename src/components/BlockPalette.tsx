import { useState, useEffect, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "./ui/input"
import { getLayerTypes, getLayerCategoriesFromYAML } from "../lib/layer-defs"

const CONFIG = {
  POLLING_INTERVAL: 100,
  DRAG_CURSOR: { GRAB: "grab", GRABBING: "grabbing" }
} as const

type LayerType = {
  type: string
  icon: string
  description: string
}

type CategoryType = {
  name: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  description: string
  layerTypes: string[]
}

interface BlockPaletteProps {
  className?: string
}

// Drag-and-drop interface for React Flow
export default function BlockPalette({ className = "" }: BlockPaletteProps = {}) {
  const [layerTypes, setLayerTypes] = useState<LayerType[]>([])
  const [layerCategories, setLayerCategories] = useState<CategoryType[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const updateData = useCallback(() => {
    const types = getLayerTypes()
    const categories = getLayerCategoriesFromYAML()
    
    console.log(`🔄 BlockPalette updateData: ${types.length} types, ${categories.length} categories`)
    
    setLayerTypes(types)
    setLayerCategories(categories)
  }, [])

  const handleDragStart = useCallback((event: React.DragEvent, layerType: string) => {
    event.dataTransfer.setData("layerType", layerType)
    event.dataTransfer.setData("application/reactflow", "default")
    event.dataTransfer.effectAllowed = "move"
  }, [])

  const clearSearch = useCallback(() => setSearchTerm(""), [])

  useEffect(() => {
    updateData()

    // Poll until data loads (YAML loading is async)
    const interval = setInterval(() => {
      const currentTypes = getLayerTypes()
      const currentCategories = getLayerCategoriesFromYAML()
      
      if (currentTypes.length > 0 && currentCategories.length > 0 && 
          (currentTypes.length !== layerTypes.length || currentCategories.length !== layerCategories.length)) {
        updateData()
        clearInterval(interval)
      }
    }, CONFIG.POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [layerTypes.length, layerCategories.length, updateData])

  const filteredCategories = layerCategories
    .map((category) => {
      const matchingLayers = layerTypes.filter(
        (layer) =>
          category.layerTypes.includes(layer.type) &&
          (layer.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            layer.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )

      return { ...category, layers: matchingLayers }
    })
    .filter((category) => category.layers.length > 0)

  const hasNoResults = filteredCategories.length === 0 && searchTerm

  return (
    <div className={`space-y-6 p-6 h-full overflow-y-auto bg-slate-50/80 ${className}`}>
      <h2 className="font-semibold text-slate-800 text-lg">Block Palette</h2>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search blocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasNoResults ? (
        <div className="text-center py-8 text-slate-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No blocks found matching "{searchTerm}"</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
          <p>Loading blocks...</p>
        </div>
      ) : (
        filteredCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <h3 className={`text-sm font-medium ${category.textColor} border-b border-slate-200 pb-1`}>
              {category.name}
            </h3>
            <div className="space-y-2">
              {category.layers.map((layer) => (
                <div
                  key={layer.type}
                  className={`cursor-move hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${category.borderColor} ${category.bgColor} rounded-xl shadow-sm border-2 p-3`}
                  draggable
                  onDragStart={(event) => handleDragStart(event, layer.type)}
                  style={{ cursor: CONFIG.DRAG_CURSOR.GRAB }}
                  onMouseDown={(e) => (e.currentTarget.style.cursor = CONFIG.DRAG_CURSOR.GRABBING)}
                  onMouseUp={(e) => (e.currentTarget.style.cursor = CONFIG.DRAG_CURSOR.GRAB)}
                >
                  <div className={`flex items-center gap-2 mb-1 ${category.textColor}`}>
                    <span className="text-base">{layer.icon}</span>
                    <span className="font-medium text-sm">{layer.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {layer.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
