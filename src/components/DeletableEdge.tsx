/**
 * Custom edge component with hover delete functionality
 * Shows an X button when hovering over connections between blocks
 */

import { useState, useCallback } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export function DeletableEdge(props: EdgeProps) {
  const { 
    id, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY, 
    sourcePosition, 
    targetPosition,
    style = {},
    markerEnd
  } = props;
  
  const { deleteElements } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    deleteElements({ edges: [{ id }] });
  }, [id, deleteElements]);

  const handleMouseEnter = useCallback(() => {
    console.log("Edge hover enter", id);
    setIsHovered(true);
  }, [id]);
  
  const handleMouseLeave = useCallback(() => {
    console.log("Edge hover leave", id);
    setIsHovered(false);
  }, [id]);

  const edgeStyle = {
    ...style,
    strokeWidth: isHovered ? 3 : (style.strokeWidth || 2),
    stroke: isHovered ? "#ef4444" : (style.stroke || "#6b7280"),
  };

  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isHovered ? "pointer" : "default" }}
    >
      {/* Debug: Visible wider path to see if it's working */}
      <path
        d={edgePath}
        fill="none"
        stroke={isHovered ? "rgba(255,0,0,0.2)" : "rgba(0,0,0,0.08)"}
        strokeWidth={10}
        style={{ pointerEvents: "all" }}
      />
      
      {/* Visible edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      
      <EdgeLabelRenderer>
        {isHovered && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-6 w-6 p-0 rounded-full shadow-lg hover:scale-110 transition-all duration-200 bg-red-500 hover:bg-red-600 border-2 border-white"
              title="Delete connection"
            >
              <X className="h-3 w-3 text-white" />
            </Button>
          </div>
        )}
      </EdgeLabelRenderer>
    </g>
  );
}
