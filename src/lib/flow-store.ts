/**
 * Flow Store - State management for the visual neural network editor
 * 
 * Manages nodes, edges, and undo/redo history for the React Flow canvas.
 * Includes automatic shape validation and error detection.
 */

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

/**
 * State interface for the flow editor store
 */
interface FlowState {
  // Current state
  nodes: Node[];
  edges: Edge[];
  
  // History management
  history: Array<{ nodes: Node[]; edges: Edge[] }>;
  historyIndex: number;

  // Core state operations
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setNodesWithoutHistory: (nodes: Node[]) => void;
  setEdgesWithoutHistory: (edges: Edge[]) => void;
  
  // React Flow event handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // User actions
  addNode: (node: Node) => void;
  addNodesAndEdges: (newNodes: Node[], newEdges: Edge[]) => void;
  
  // Copy-paste functionality
  copiedNodes: Node[];
  copiedEdges: Edge[];
  copyNodes: (nodeIds: string[]) => void;
  pasteNodes: (position?: { x: number; y: number }) => void;
  canPaste: () => boolean;
  
  // Shape validation
  updateShapeErrors: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  saveToHistory: () => void;
  initializeHistory: () => void;
  
  // Internal state
  _isRestoringFromHistory: boolean;
}

/**
 * Configuration constants for the flow store
 */
const SHAPE_UPDATE_DEBOUNCE_MS = 100;
const DEFAULT_INPUT_SHAPE = "(28, 28, 1)";
const MAX_HISTORY_SIZE = 10;

/**
 * Debouncing utility for shape error updates to prevent excessive computation
 */
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
  // Initial state
  nodes: [],
  edges: [],
  history: [],
  historyIndex: -1,
  _isRestoringFromHistory: false,
  
  // Copy-paste state
  copiedNodes: [],
  copiedEdges: [],

  // History management
  saveToHistory: () => {
    const { nodes, edges, history, historyIndex, _isRestoringFromHistory } = get();
    
    // Don't save to history if we're currently restoring from history
    if (_isRestoringFromHistory) return;
    
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

  // Core state operations
  setNodes: (nodes: Node[]) => {
    set({ nodes });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  setNodesWithoutHistory: (nodes: Node[]) => {
    set({ nodes });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  setEdgesWithoutHistory: (edges: Edge[]) => {
    set({ edges });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  // React Flow event handlers
  onNodesChange: (changes: NodeChange[]) => {
    // Save to history BEFORE applying changes for certain operations
    const hasRemoveOrPositionEnd = changes.some(change => 
      change.type === 'remove' || 
      (change.type === 'position' && !change.dragging)
    );
    
    if (hasRemoveOrPositionEnd && !get()._isRestoringFromHistory) {
      get().saveToHistory();
    }
    
    // Apply changes
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    // Save to history BEFORE applying edge deletions
    const hasRemove = changes.some(change => change.type === 'remove');
    
    if (hasRemove && !get()._isRestoringFromHistory) {
      get().saveToHistory();
    }
    
    // Apply changes
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  onConnect: (connection: Connection) => {
    // Save to history BEFORE creating new connection
    if (!get()._isRestoringFromHistory) {
      get().saveToHistory();
    }
    
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

  // User actions
  addNode: (node: Node) => {
    // Apply the change first
    set({
      nodes: [...get().nodes, node],
    });
    
    // Save to history after making changes
    if (!get()._isRestoringFromHistory) {
      get().saveToHistory();
    }
    
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  addNodesAndEdges: (newNodes: Node[], newEdges: Edge[]) => {
    const { nodes, edges } = get();
    
    // Apply the changes first
    set({
      nodes: [...nodes, ...newNodes],
      edges: [...edges, ...newEdges],
    });
    
    // Save to history after making changes
    if (!get()._isRestoringFromHistory) {
      get().saveToHistory();
    }
    
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  // History operations
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({ 
        _isRestoringFromHistory: true,
        nodes: prevState.nodes, 
        edges: prevState.edges, 
        historyIndex: historyIndex - 1 
      });
      scheduleShapeUpdate(() => {
        get().updateShapeErrors();
        set({ _isRestoringFromHistory: false });
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({ 
        _isRestoringFromHistory: true,
        nodes: nextState.nodes, 
        edges: nextState.edges, 
        historyIndex: historyIndex + 1 
      });
      scheduleShapeUpdate(() => {
        get().updateShapeErrors();
        set({ _isRestoringFromHistory: false });
      });
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

  initializeHistory: () => {
    const { nodes, edges, history } = get();
    // Only initialize if history is empty and we have no content
    if (history.length === 0 && nodes.length === 0 && edges.length === 0) {
      const initialEntry = { 
        nodes: JSON.parse(JSON.stringify(nodes)), 
        edges: JSON.parse(JSON.stringify(edges)) 
      };
      set({ history: [initialEntry], historyIndex: 0 });
    }
  },

  // Copy-paste functionality
  copyNodes: (nodeIds: string[]) => {
    const { nodes, edges } = get();
    
    // Get the nodes to copy
    const nodesToCopy = nodes.filter(node => nodeIds.includes(node.id));
    
    // Get the edges that connect the copied nodes
    const edgesToCopy = edges.filter(edge => 
      nodeIds.includes(edge.source) && nodeIds.includes(edge.target)
    );
    
    set({ 
      copiedNodes: JSON.parse(JSON.stringify(nodesToCopy)),
      copiedEdges: JSON.parse(JSON.stringify(edgesToCopy))
    });
  },

  pasteNodes: (position?: { x: number; y: number }) => {
    const { copiedNodes, copiedEdges, nodes } = get();
    
    if (copiedNodes.length === 0) return;
    
    const timestamp = Date.now();
    const nodeIdMap = new Map<string, string>();
    
    // Calculate paste position
    const pastePosition = position || { x: 50, y: 50 };
    
    // Find the bounds of the copied nodes to determine offset
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    
    copiedNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
    });
    
    // Create new nodes with unique IDs and adjusted positions
    const newNodes: Node[] = copiedNodes.map((node) => {
      const nodeData = node.data as { type: string; params: Record<string, unknown> };
      const newId = `${nodeData.type.toLowerCase()}-${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      nodeIdMap.set(node.id, newId);
      
      return {
        ...node,
        id: newId,
        position: {
          x: pastePosition.x + (node.position.x - minX),
          y: pastePosition.y + (node.position.y - minY),
        },
        selected: true,
      };
    });
    
    // Create new edges with updated node IDs
    const newEdges = copiedEdges
      .map((edge) => {
        const sourceId = nodeIdMap.get(edge.source);
        const targetId = nodeIdMap.get(edge.target);
        
        if (!sourceId || !targetId) return null;
        
        return {
          ...edge,
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
        };
      })
      .filter((edge): edge is NonNullable<typeof edge> => edge !== null);
    
    // Deselect all existing nodes first
    const updatedExistingNodes = nodes.map(node => ({ ...node, selected: false }));
    
    // Add the pasted nodes and edges
    set({ nodes: [...updatedExistingNodes, ...newNodes] });
    
    // Save to history after pasting
    if (!get()._isRestoringFromHistory) {
      get().saveToHistory();
    }
    
    // Add edges if any
    if (newEdges.length > 0) {
      set({ edges: [...get().edges, ...newEdges] });
    }
    
    scheduleShapeUpdate(() => get().updateShapeErrors());
  },

  canPaste: () => {
    const { copiedNodes } = get();
    return copiedNodes.length > 0;
  },

  // Shape validation
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
          // Update nodes without triggering history save
          set((state) => ({ ...state, nodes: updatedNodes }));
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
        // Update nodes without triggering history save
        set((state) => ({ ...state, nodes: updatedNodes }));
      }
    } catch (error) {
      // Log shape computation errors for debugging
      console.warn(
        "Shape computation failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  },
}));
