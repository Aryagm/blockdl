/**
 * Visual flow editor for neural network architectures
 *
 * Drag layers from palette, connect them visually, and generate code.
 * Uses React Flow with Zustand for state management.
 */

import { useCallback, useState, useEffect } from "react";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
} from "@xyflow/react";
import type {
  Node,
  NodeTypes,
  ReactFlowInstance,
  XYPosition,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { LayerNode } from "./LayerNode";
import { getDefaultParams } from "../lib/layers/parameters";
import { getTemplateById } from "../lib/templates";
import { useFlowStore } from "../lib/flow-store";
import { cn } from "../lib/utils";

// Flow editor configuration
const FLOW_CONFIG = {
  BACKGROUND: { GAP: 25, SIZE: 1, COLOR: "#f7f7f7" },
  EDGE: { STROKE_WIDTH: 2, STROKE_COLOR: "#6b7280" },
} as const;

const nodeTypes: NodeTypes = { layerNode: LayerNode };

/**
 * Props for CanvasEditor component
 */
interface CanvasEditorProps {
  className?: string;
}

function CanvasEditorInner({ className = "" }: CanvasEditorProps) {
  const {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    addNode,
    setNodes,
    setEdges,
  } = useFlowStore();

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Prevent accidental node deletion to preserve network integrity
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement;

        // Allow deletion in input fields
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.contentEditable === "true")
        ) {
          return;
        }

        // Block delete operations to preserve network structure
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const layerType = event.dataTransfer.getData("layerType");
      const templateId = event.dataTransfer.getData("templateId");

      const position: XYPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      if (layerType) {
        // Handle single layer drop
        const newNode: Node = {
          id: `${layerType.toLowerCase()}-${Date.now()}`,
          type: "layerNode",
          position,
          data: {
            type: layerType,
            params: getDefaultParams(layerType),
          },
        };

        addNode(newNode);
      } else if (templateId) {
        // Handle template drop
        const template = getTemplateById(templateId);
        if (!template) return;

        const timestamp = Date.now();
        const nodeIdMap = new Map<string, string>();

        // Create new nodes with unique IDs and adjusted positions
        const newNodes: Node[] = template.network.nodes.map((templateNode) => {
          const nodeData = templateNode.data as { type: string; params: Record<string, unknown> };
          const newId = `${nodeData.type.toLowerCase()}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
          nodeIdMap.set(templateNode.id, newId);

          return {
            id: newId,
            type: "layerNode",
            position: {
              x: position.x + templateNode.position.x,
              y: position.y + templateNode.position.y,
            },
            data: {
              type: nodeData.type,
              params: nodeData.params || getDefaultParams(nodeData.type),
            },
          };
        });

        // Create new edges with updated node IDs
        const newEdges = template.network.edges
          .map((templateEdge) => {
            const sourceId = nodeIdMap.get(templateEdge.source);
            const targetId = nodeIdMap.get(templateEdge.target);
            
            if (!sourceId || !targetId) return null;

            return {
              id: `${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              type: 'smoothstep' as const,
              style: { strokeWidth: 2, stroke: '#6b7280' }
            };
          })
          .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

        // Add all nodes and edges at once
        setNodes([...nodes, ...newNodes]);
        setEdges([...edges, ...newEdges]);
      }
    },
    [reactFlowInstance, addNode, setNodes, setEdges, nodes, edges]
  );

  return (
    <div className={cn("h-full w-full", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={setReactFlowInstance}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        deleteKeyCode={[]}
        multiSelectionKeyCode={["Control", "Meta"]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: {
            strokeWidth: FLOW_CONFIG.EDGE.STROKE_WIDTH,
            stroke: FLOW_CONFIG.EDGE.STROKE_COLOR,
          },
        }}
      >
        <Controls />
        <MiniMap />
        <Background
          variant={BackgroundVariant.Lines}
          gap={FLOW_CONFIG.BACKGROUND.GAP}
          size={FLOW_CONFIG.BACKGROUND.SIZE}
          color={FLOW_CONFIG.BACKGROUND.COLOR}
        />
      </ReactFlow>
    </div>
  );
}

/**
 * Main CanvasEditor component with ReactFlow provider
 */
export function CanvasEditor(props: CanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner {...props} />
    </ReactFlowProvider>
  );
}
