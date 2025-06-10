/**
 * Undo/Redo controls component with keyboard shortcuts
 */

import { useEffect } from "react";
import { Undo2, Redo2 } from "lucide-react";
import { Button } from "./ui/button";
import { useFlowStore } from "../lib/flow-store";

interface UndoRedoControlsProps {
  className?: string;
}

export function UndoRedoControls({ className = "" }: UndoRedoControlsProps) {
  const { undo, redo, canUndo, canRedo } = useFlowStore();

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

      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      
      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      // Also support Ctrl+Y or Cmd+Y for redo (common alternative)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "z" && event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === "y")
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={undo}
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
        className="h-8 w-8 p-0"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={redo}
        disabled={!canRedo()}
        title="Redo (Ctrl+Shift+Z)"
        className="h-8 w-8 p-0"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
