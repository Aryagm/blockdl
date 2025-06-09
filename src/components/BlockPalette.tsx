import { useState, useEffect, useCallback } from "react";
import { Search, X, Layers, Grid3X3 } from "lucide-react";
import { Input } from "./ui/input";
import { getLayerTypes } from "../lib/layer-definitions";
import { getLayerCategories } from "../lib/categories";
import {
  getAllTemplates,
  templateCategories,
  getTemplateCategoryColors,
  type NetworkTemplate,
} from "../lib/templates";

const CONFIG = {
  POLLING_INTERVAL: 100,
  DRAG_CURSOR: { GRAB: "grab", GRABBING: "grabbing" },
  TABS: { LAYERS: "layers", TEMPLATES: "templates" },
} as const;

type LayerType = {
  type: string;
  icon: string;
  description: string;
};

type CategoryType = {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  layerTypes: string[];
};

type TemplatesByCategory = {
  [key: string]: {
    category: string;
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    hoverColor: string;
    description: string;
    icon: string;
    templates: NetworkTemplate[];
  };
};

interface BlockPaletteProps {
  className?: string;
}

// Drag-and-drop interface for React Flow
export default function BlockPalette({
  className = "",
}: BlockPaletteProps = {}) {
  const [activeTab, setActiveTab] = useState<string>(CONFIG.TABS.LAYERS);
  const [layerTypes, setLayerTypes] = useState<LayerType[]>([]);
  const [layerCategories, setLayerCategories] = useState<CategoryType[]>([]);
  const [templates, setTemplates] = useState<NetworkTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const updateData = useCallback(() => {
    const types = getLayerTypes();
    const categories = getLayerCategories();
    const allTemplates = getAllTemplates();

    console.log(
      `🔄 BlockPalette updateData: ${types.length} types, ${categories.length} categories, ${allTemplates.length} templates`
    );

    setLayerTypes(types);
    setLayerCategories(categories);
    setTemplates(allTemplates);
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent, layerType: string) => {
      event.dataTransfer.setData("layerType", layerType);
      event.dataTransfer.setData("application/reactflow", "default");
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleTemplateDragStart = useCallback(
    (event: React.DragEvent, templateId: string) => {
      event.dataTransfer.setData("templateId", templateId);
      event.dataTransfer.setData("application/reactflow", "template");
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const clearSearch = useCallback(() => setSearchTerm(""), []);

  useEffect(() => {
    updateData();

    // Poll until data loads (YAML loading is async)
    const interval = setInterval(() => {
      const currentTypes = getLayerTypes();
      const currentCategories = getLayerCategories();
      const currentTemplates = getAllTemplates();

      if (
        currentTypes.length > 0 &&
        currentCategories.length > 0 &&
        currentTemplates.length > 0 &&
        (currentTypes.length !== layerTypes.length ||
          currentCategories.length !== layerCategories.length ||
          currentTemplates.length !== templates.length)
      ) {
        updateData();
        clearInterval(interval);
      }
    }, CONFIG.POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [layerTypes.length, layerCategories.length, templates.length, updateData]);

  // Filter layers by search term
  const filteredCategories = layerCategories
    .map((category) => {
      const matchingLayers = layerTypes.filter(
        (layer) =>
          category.layerTypes.includes(layer.type) &&
          (layer.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            layer.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return { ...category, layers: matchingLayers };
    })
    .filter((category) => category.layers.length > 0);

  // Group templates by category and filter by search term
  const templatesByCategory: TemplatesByCategory = {};

  Object.entries(templateCategories).forEach(([key, category]) => {
    const categoryTemplates = templates.filter(
      (template) =>
        template.category === key &&
        (searchTerm === "" ||
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          template.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );

    if (categoryTemplates.length > 0) {
      const colors = getTemplateCategoryColors(key);
      templatesByCategory[key] = {
        category: key,
        name: category.name,
        color: category.color,
        bgColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        hoverColor: colors.hover,
        description: category.description,
        icon: category.icon,
        templates: categoryTemplates,
      };
    }
  });

  const hasNoResults =
    (activeTab === CONFIG.TABS.LAYERS
      ? filteredCategories.length === 0
      : Object.keys(templatesByCategory).length === 0) && searchTerm;

  return (
    <div
      className={`space-y-6 p-6 h-full overflow-y-auto bg-slate-50/80 ${className}`}
    >
      <h2 className="font-semibold text-slate-800 text-lg">Block Palette</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-white rounded-lg p-1 border border-slate-200">
        <button
          onClick={() => setActiveTab(CONFIG.TABS.LAYERS)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === CONFIG.TABS.LAYERS
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Layers className="h-4 w-4" />
          Layers
        </button>
        <button
          onClick={() => setActiveTab(CONFIG.TABS.TEMPLATES)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === CONFIG.TABS.TEMPLATES
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Grid3X3 className="h-4 w-4" />
          Templates
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder={
            activeTab === CONFIG.TABS.LAYERS
              ? "Search layers..."
              : "Search templates..."
          }
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
          <p>
            No {activeTab === CONFIG.TABS.LAYERS ? "layers" : "templates"} found
            matching "{searchTerm}"
          </p>
        </div>
      ) : (
          activeTab === CONFIG.TABS.LAYERS
            ? filteredCategories.length === 0
            : Object.keys(templatesByCategory).length === 0
        ) ? (
        <div className="text-center py-8 text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
          <p>
            Loading {activeTab === CONFIG.TABS.LAYERS ? "layers" : "templates"}
            ...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === CONFIG.TABS.LAYERS
            ? // Layers View
              filteredCategories.map((category) => (
                <div key={category.name} className="space-y-3">
                  <h3
                    className={`text-sm font-medium ${category.textColor} border-b border-slate-200 pb-1`}
                  >
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.layers.map((layer) => (
                      <div
                        key={layer.type}
                        className={`cursor-move hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${category.borderColor} ${category.bgColor} rounded-xl shadow-sm border-2 p-3`}
                        draggable
                        onDragStart={(event) =>
                          handleDragStart(event, layer.type)
                        }
                        style={{ cursor: CONFIG.DRAG_CURSOR.GRAB }}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRABBING)
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRAB)
                        }
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 ${category.textColor}`}
                        >
                          <span className="text-base">{layer.icon}</span>
                          <span className="font-medium text-sm">
                            {layer.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {layer.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : // Templates View
              Object.values(templatesByCategory).map((categoryData) => (
                <div key={categoryData.category} className="space-y-3">
                  <h3
                    className={`text-sm font-medium ${categoryData.textColor} border-b border-slate-200 pb-1 flex items-center gap-2`}
                  >
                    <span>{categoryData.icon}</span>
                    {categoryData.name}
                  </h3>
                  <div className="space-y-2">
                    {categoryData.templates.map((template) => (
                      <div
                        key={template.id}
                        className={`cursor-move hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${categoryData.borderColor} ${categoryData.bgColor} rounded-xl shadow-sm border-2 p-3`}
                        draggable
                        onDragStart={(event) =>
                          handleTemplateDragStart(event, template.id)
                        }
                        style={{ cursor: CONFIG.DRAG_CURSOR.GRAB }}
                        onMouseDown={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRABBING)
                        }
                        onMouseUp={(e) =>
                          (e.currentTarget.style.cursor =
                            CONFIG.DRAG_CURSOR.GRAB)
                        }
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 ${categoryData.textColor}`}
                        >
                          <span className="text-base">{template.icon}</span>
                          <span className="font-medium text-sm">
                            {template.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">
                          {template.description}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {template.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
