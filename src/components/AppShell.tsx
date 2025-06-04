// Three-panel layout: palette | canvas | code viewer
// Maintains fixed min-width for optimal UX across all panels

import type { ReactNode } from "react";
import type { Node, Edge } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";

const LAYOUT_CONFIG = {
  MIN_WIDTH: 1280,
  SIDEBAR_WIDTH: 288, // w-72
  CODE_VIEWER_WIDTH: 500,
} as const;

interface AppShellProps {
  palette?: ReactNode;
  canvas?: ReactNode;
  codeViewer?: ReactNode;
  className?: string;
  nodes?: Node[];
  edges?: Edge[];
  onImportProject?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  onClearAll?: () => void;
}

export function AppShell({
  palette,
  canvas,
  codeViewer,
  className,
  nodes = [],
  edges = [],
  onImportProject,
  onClearAll,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-slate-100 text-slate-900",
        className
      )}
      style={{ minWidth: LAYOUT_CONFIG.MIN_WIDTH }}
    >
      <AppHeader
        nodes={nodes}
        edges={edges}
        onImportProject={onImportProject}
        onClearAll={onClearAll}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="bg-white border-r border-slate-200 flex-shrink-0 shadow-sm"
          style={{ width: LAYOUT_CONFIG.SIDEBAR_WIDTH }}
        >
          <div className="h-full overflow-hidden">{palette}</div>
        </aside>

        <main className="flex-grow bg-white min-w-0">
          <div className="h-full">{canvas}</div>
        </main>

        <aside
          className="bg-white border-l border-slate-200 flex-shrink-0 shadow-sm"
          style={{ width: LAYOUT_CONFIG.CODE_VIEWER_WIDTH }}
        >
          <div className="h-full overflow-hidden">{codeViewer}</div>
        </aside>
      </div>
    </div>
  );
}
