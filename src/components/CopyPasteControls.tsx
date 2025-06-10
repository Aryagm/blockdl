/**
 * Copy-paste controls component with keyboard shortcuts for blocks
 */

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useFlowStore } from "../lib/flow-store";

export function CopyPasteControls(): null {
  const reactFlowInstance = useReactFlow();
  const { copyNodes, pasteNodes, canPaste } = useFlowStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === "INPUT" || 
                          target.tagName === "TEXTAREA" || 
                          target.contentEditable === "true";

      // Skip if in input field
      if (isInputField) return;

      // Ctrl+C or Cmd+C for copy
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault();
        
        // Get selected nodes
        const selectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
        
        if (selectedNodes.length > 0) {
          const selectedNodeIds = selectedNodes.map(node => node.id);
          copyNodes(selectedNodeIds);
          console.log(`Copied ${selectedNodes.length} node(s)`);
        }
      }
      
      // Ctrl+V or Cmd+V for paste
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        
        if (canPaste()) {
          // Calculate paste position based on viewport center
          const bounds = document.querySelector('.react-flow')?.getBoundingClientRect();
          
          if (bounds) {
            // Calculate center of visible area in flow coordinates
            const centerX = bounds.width / 2;
            const centerY = bounds.height / 2;
            
            const flowPosition = reactFlowInstance.screenToFlowPosition({
              x: centerX,
              y: centerY,
            });
            
            pasteNodes(flowPosition);
            console.log("Pasted nodes");
          } else {
            // Fallback to default position
            pasteNodes();
          }
        }
      }
      
      // Ctrl+A or Cmd+A for select all
      if ((event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        
        // Select all nodes
        const allNodes = reactFlowInstance.getNodes();
        const updatedNodes = allNodes.map(node => ({ ...node, selected: true }));
        
        reactFlowInstance.setNodes(updatedNodes);
        console.log(`Selected all ${allNodes.length} node(s)`);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [reactFlowInstance, copyNodes, pasteNodes, canPaste]);

  // This component doesn't render anything visible
  return null;
}
