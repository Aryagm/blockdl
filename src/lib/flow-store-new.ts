import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react";
import { parseGraphToDAG } from "./dag-parser";
import { computeShapes } from "./shape-computation";
import { getLayerDefinition } from "./layer-definitions";

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  
  // History for undo/redo
  history: Array<{ nodes: Node[]; edges: Edge[] }>;
  historyIndex: number;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateShapeErrors: () => void;
  
  // Undo/Redo functionality
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  saveToHistory: () => void;
}

// Constants for configuration
const SHAPE_UPDATE_DEBOUNCE_MS = 100;
const DEFAULT_INPUT_SHAPE = "(28, 28, 1)";
const MAX_HISTORY_SIZE = 50;

// Debouncing utility for shape error updates
let shapeUpdateTimeout: NodeJS.Timeout | null = null;

const scheduleShapeUpdate = (updateFn: () => void) => {
  if (shapeUpdateTimeout) {
    clearTimeout(shapeUpdateTimeout);
  }
  shapeUpdateTimeout = setTimeout(() => {
    updateFn();
    shapeUpdateTimeout = null;
  }, SHAPE_UPDATE_DEBOUNCE_MS);
};

/**
 * Helper function to compute input shape from Input node
 */
const getInputShape = (nodes: Node[]): string => {
  const inputNode = nodes.find((node) => node.data.type === "Input");

  if (!inputNode?.data.params) {
    return DEFAULT_INPUT_SHAPE;
  }

  const params = inputNode.data.params as Record<string, unknown>;
  const inputLayerDef = getLayerDefinition("Input");

  if (inputLayerDef) {
    const computedShape = inputLayerDef.computeShape([], params);
    if (computedShape) {
      return `(${computedShape.join(", ")})`;
    }
  }

  // Legacy fallback
  if (params.shape && typeof params.shape === "string") {
    return params.shape;
  }

  return DEFAULT_INPUT_SHAPE;
};

/**
 * Helper function to update nodes with error information
 */
const updateNodesWithErrors = (
  nodes: Node[],
  errorMap: Map<string, string>
): { nodes: Node[]; hasChanges: boolean } => {
  let hasChanges = false;

  const updatedNodes = nodes.map((node) => {
    const hasError = errorMap.has(node.id);
    const errorMessage = errorMap.get(node.id);

    if (
      node.data.hasShapeError !== hasError ||
      node.data.shapeErrorMessage !== errorMessage
    ) {
      hasChanges = true;
      return {
        ...node,
        data: {
          ...node.data,
          hasShapeError: hasError,
          shapeErrorMessage: errorMessage,
        },
      };
    }
    return node;
  });

  return { nodes: updatedNodes, hasChanges };
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  history: [],
  historyIndex: -1,

  saveToHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistoryEntry = { 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges)) 
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryEntry);
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    } else {
      set({ historyIndex: historyIndex + 1 });
    }
    
    set({ history: newHistory });
  },

  setNodes: (nodes: Node[]) => {
    get().saveToHistory();
    set({ nodes });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  setEdges: (edges: Edge[]) => {
    get().saveToHistory();
    set({ edges });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  onNodesChange: (changes: NodeChange[]) => {
    // Only save to history for significant changes (not selections, etc.)
    const hasSignificantChange = changes.some(change => 
      change.type === 'remove' || change.type === 'add' || 
      (change.type === 'position' && !(change as any).dragging)
    );
    
    if (hasSignificantChange) {
      get().saveToHistory();
    }
    
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    // Only save to history for significant changes
    const hasSignificantChange = changes.some(change => 
      change.type === 'remove' || change.type === 'add'
    );
    
    if (hasSignificantChange) {
      get().saveToHistory();
    }
    
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  onConnect: (connection: Connection) => {
    get().saveToHistory();
    const edgeWithType = {
      ...connection,
      type: "smoothstep" as const,
      style: { strokeWidth: 2, stroke: "#6b7280" },
    };
    set({
      edges: addEdge(edgeWithType, get().edges),
    });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  addNode: (node: Node) => {
    get().saveToHistory();
    set({
      nodes: [...get().nodes, node],
    });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({ 
        nodes: prevState.nodes, 
        edges: prevState.edges, 
        historyIndex: historyIndex - 1 
      });
      scheduleShapeUpdate(() => get().updateShapeErrors());
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({ 
        nodes: nextState.nodes, 
        edges: nextState.edges, 
        historyIndex: historyIndex + 1 
      });
      scheduleShapeUpdate(() => get().updateShapeErrors());
    }
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  clearHistory: () => {
    set({ history: [], historyIndex: -1 });
  },

  updateShapeErrors: () => {
    const { nodes, edges } = get();

    // Early return if no nodes to process
    if (nodes.length === 0) {
      return;
    }

    try {
      const inputShape = getInputShape(nodes);
      const dagResult = parseGraphToDAG(nodes, edges);

      if (!dagResult.isValid) {
        // For DAG errors, mark all nodes as having graph-level errors
        const errorMap = new Map<string, string>();
        const firstError = dagResult.errors[0] || "Invalid graph structure";

        // Apply error to all nodes for visibility
        nodes.forEach((node: Node) => {
          errorMap.set(node.id, firstError);
        });

        const { nodes: updatedNodes, hasChanges } = updateNodesWithErrors(
          nodes,
          errorMap
        );
        if (hasChanges) {
          set({ nodes: updatedNodes });
        }
        return;
      }

      // Compute shapes for each node
      const { errors } = computeShapes(dagResult, inputShape);
      const errorMap = new Map<string, string>();

      errors.forEach((error) => {
        errorMap.set(error.nodeId, error.message);
      });

      const { nodes: updatedNodes, hasChanges } = updateNodesWithErrors(
        nodes,
        errorMap
      );
      if (hasChanges) {
        set({ nodes: updatedNodes });
      }
    } catch (error) {
      console.error(
        "Error computing shapes:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  },
}));
