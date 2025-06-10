import { useState, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import { Download, Upload, HelpCircle, Trash2 } from "lucide-react";

import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { UndoRedoControls } from "./UndoRedoControls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";

const PROJECT_CONFIG = {
  VERSION: "1.0.0",
  FILE_TYPE: "application/json",
  FILE_ACCEPT: ".json",
} as const;

const ERROR_MESSAGES = {
  INVALID_FORMAT:
    "Invalid project file format. Please ensure the file contains valid nodes and edges.",
  READ_ERROR:
    "Error reading project file. Please check that the file is a valid JSON format.",
} as const;

interface AppHeaderProps {
  nodes?: Node[];
  edges?: Edge[];
  onImportProject?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  onClearAll?: () => void;
}

// Header with project management controls
export function AppHeader({
  nodes = [],
  edges = [],
  onImportProject,
  onClearAll,
}: AppHeaderProps) {
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasContent = nodes.length > 0 || edges.length > 0;

  const handleExportProject = useCallback(() => {
    const projectData = {
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: PROJECT_CONFIG.VERSION,
      },
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: PROJECT_CONFIG.FILE_TYPE });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `blockdl-project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const showImportError = useCallback((message: string) => {
    setErrorMessage(message);
    setShowErrorDialog(true);
  }, []);

  const handleImportProject = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = PROJECT_CONFIG.FILE_ACCEPT;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.nodes && data.edges) {
            onImportProject?.(data);
          } else {
            showImportError(ERROR_MESSAGES.INVALID_FORMAT);
          }
        } catch (error) {
          console.error("Error reading project file:", error);
          showImportError(ERROR_MESSAGES.READ_ERROR);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [onImportProject, showImportError]);

  const handleClearConfirm = useCallback(() => {
    onClearAll?.();
    setShowClearDialog(false);
  }, [onClearAll]);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Logo className="h-8 w-8 text-slate-800" />
          <h1 className="text-xl font-bold text-slate-800">BlockDL</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo Controls */}
        <UndoRedoControls />
        
        {/* Project Controls */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasContent}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Blocks</DialogTitle>
              <DialogDescription>
                Are you sure you want to clear all blocks from the canvas? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearConfirm}>
                Clear All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportProject}
          disabled={!hasContent}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleImportProject}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
        </div>

        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>BlockDL Help & Instructions</DialogTitle>
              <DialogDescription>
                Learn how to use BlockDL to build neural network architectures
                visually
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  🧱 Building Your Network
                </h3>
                <ul className="space-y-1 text-slate-600 ml-4">
                  <li>• Drag blocks from the left palette onto the canvas</li>
                  <li>
                    • Connect blocks by dragging from output handles to input
                    handles
                  </li>
                  <li>• Double-click blocks to edit their parameters</li>
                  <li>• Use the trash icon to delete blocks</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  📂 Project Management
                </h3>
                <ul className="space-y-1 text-slate-600 ml-4">
                  <li>
                    • <strong>Export:</strong> Save your project as a JSON file
                  </li>
                  <li>
                    • <strong>Import:</strong> Load a previously saved project
                  </li>
                  <li>
                    • <strong>Clear All:</strong> Remove all blocks from the
                    canvas
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  💻 Code Generation
                </h3>
                <ul className="space-y-1 text-slate-600 ml-4">
                  <li>
                    • The right panel shows generated TensorFlow/Keras code
                  </li>
                  <li>
                    • Code updates automatically as you modify your network
                  </li>
                  <li>• Copy the code to use in your Python projects</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Error</DialogTitle>
              <DialogDescription>{errorMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
