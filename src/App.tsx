import { useState, useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { CanvasEditor } from "./components/CanvasEditor";
import BlockPalette from "./components/BlockPalette";
import { CodeViewer } from "./components/CodeViewer";
import { WelcomeModal } from "./components/WelcomeModal";
import type { Node, Edge } from "@xyflow/react";
import { useFlowStore } from "./lib/flow-store";
import "./App.css";

function App() {
  const { nodes, edges, setNodes, setEdges } = useFlowStore();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check if this is a new tab/window (not a refresh)
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("blockdl-welcome-shown");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleWelcomeModalClose = (open: boolean) => {
    if (!open) {
      sessionStorage.setItem("blockdl-welcome-shown", "true");
      setShowWelcomeModal(false);
    }
  };

  const handleClearAll = () => {
    setNodes([]);
    setEdges([]);
  };

  const handleImportProject = (data: { nodes: Node[]; edges: Edge[] }) => {
    setNodes(data.nodes);
    setEdges(data.edges);
  };

  const paletteContent = <BlockPalette />;

  const canvasContent = <CanvasEditor />;

  const codeViewerContent = <CodeViewer />;

  return (
    <>
      <AppShell
        palette={paletteContent}
        canvas={canvasContent}
        codeViewer={codeViewerContent}
        nodes={nodes}
        edges={edges}
        onImportProject={handleImportProject}
        onClearAll={handleClearAll}
      />
      
      <WelcomeModal 
        open={showWelcomeModal} 
        onOpenChange={handleWelcomeModalClose} 
      />
    </>
  );
}

export default App;
