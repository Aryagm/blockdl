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
import { getDefaultParams } from "../lib/layer-definitions";
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

      if (!layerType) return;

      const position: XYPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

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
    },
    [reactFlowInstance, addNode]
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
