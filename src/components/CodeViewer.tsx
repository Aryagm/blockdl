import { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { parseGraphToDAG, type DAGResult } from "../lib/dag-parser";
import { generateKerasCode, generateFunctionalKerasCode } from "../lib/code-generation";
import { useFlowStore } from "../lib/flow-store";
import { cn } from "../lib/utils";

const UI_CONFIG = {
  COPY_TIMEOUT: 2000,
  BUTTON_HEIGHT: "h-9",
  BORDER_RADIUS: "rounded-lg",
  SPACING: {
    CARD: "px-4 sm:px-6",
    PADDING: "p-4 sm:p-6",
  },
} as const;

// Helper functions
function checkIfFunctionalAPINeeded(dagResult: DAGResult): boolean {
  const hasMultipleInputs =
    dagResult.orderedNodes.filter((n) => n.type === "Input").length > 1;
  const hasMultipleOutputs =
    dagResult.orderedNodes.filter((n) => n.type === "Output").length > 1;
  const hasComplexStructure = Array.from(dagResult.edgeMap.values()).some(
    (targets) => targets.length > 1
  );
  const hasMergeLayer = dagResult.orderedNodes.some((n) => n.type === "Merge");

  return (
    hasMultipleInputs ||
    hasMultipleOutputs ||
    hasComplexStructure ||
    hasMergeLayer
  );
}

function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

// Sub-components
interface APIBadgeProps {
  codeType: "sequential" | "functional";
}

function APIBadge({ codeType }: APIBadgeProps) {
  const isFunctional = codeType === "functional";

  return (
    <span
      className={cn(
        "text-xs px-3 py-1.5 rounded-full font-medium border",
        isFunctional
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "bg-green-100 text-green-700 border-green-200"
      )}
    >
      {isFunctional ? "Functional API" : "Sequential API"}
    </span>
  );
}

interface ActionButtonsProps {
  onDownload: () => void;
  onCopy: () => void;
  isDisabled: boolean;
  isCopied: boolean;
}

function ActionButtons({
  onDownload,
  onCopy,
  isDisabled,
  isCopied,
}: ActionButtonsProps) {
  const baseButtonClass = cn(
    UI_CONFIG.BUTTON_HEIGHT,
    "px-4",
    UI_CONFIG.BORDER_RADIUS,
    "transition-all duration-200 shadow-sm"
  );

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isDisabled}
          className={cn(
            baseButtonClass,
            "border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
          )}
        >
          <Download className="h-4 w-4 mr-2" />
          Download .py
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={isDisabled}
          className={cn(
            baseButtonClass,
            isCopied
              ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 shadow-md"
              : "border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
          )}
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface CodeEditorProps {
  code: string;
}

function CodeEditor({ code }: CodeEditorProps) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-inner bg-slate-50/30 flex-1 min-h-0">
      <div className="w-full h-full overflow-auto">
        <CodeMirror
          value={code}
          height="100%"
          extensions={[python()]}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            highlightSelectionMatches: false,
            searchKeymap: false,
          }}
        />
      </div>
    </div>
  );
}

interface CodeViewerProps {
  className?: string;
}

// Generates Keras code from visual neural network graph
export function CodeViewer({ className = "" }: CodeViewerProps) {
  const { nodes, edges } = useFlowStore();
  const [generatedCode, setGeneratedCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [codeType, setCodeType] = useState<"sequential" | "functional">(
    "sequential"
  );

  const resetCopyState = useCallback(() => {
    setTimeout(() => setIsCopied(false), UI_CONFIG.COPY_TIMEOUT);
  }, []);

  // Auto-generate code when graph changes
  useEffect(() => {
    const generateCode = async () => {
      const dagResult = parseGraphToDAG(nodes, edges);

      if (!dagResult.isValid) {
        setGeneratedCode(
          `# Error: Invalid network structure\n# ${dagResult.errors.join("\n# ")}`
        );
        return;
      }

      const shouldUseFunctional = checkIfFunctionalAPINeeded(dagResult);

      if (shouldUseFunctional) {
        setCodeType("functional");
        const functionalCode = await generateFunctionalKerasCode(dagResult);
        setGeneratedCode(functionalCode);
      } else {
        setCodeType("sequential");
        setGeneratedCode(generateKerasCode(dagResult.orderedNodes));
      }
    };
    
    generateCode();
  }, [nodes, edges]);

  const handleCopyCode = useCallback(async () => {
    if (!generatedCode.trim()) return;

    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      resetCopyState();
    } catch {
      // Fallback for older browsers
      fallbackCopyToClipboard(generatedCode);
      setIsCopied(true);
      resetCopyState();
    }
  }, [generatedCode, resetCopyState]);

  const handleDownloadCode = useCallback(() => {
    if (!generatedCode.trim()) return;

    const blob = new Blob([generatedCode], { type: "text/python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `keras_model_${codeType}.py`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generatedCode, codeType]);

  return (
    <div className={cn("h-full flex flex-col bg-slate-50/80", className)}>
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0",
          UI_CONFIG.SPACING.PADDING
        )}
      >
        <Card className="border-slate-200 bg-white shadow-sm rounded-xl flex-1 flex flex-col min-h-0">
          <CardHeader
            className={cn("pb-3 flex-shrink-0", UI_CONFIG.SPACING.CARD)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐍</span>
                  <CardTitle className="text-xl text-slate-800 font-semibold">
                    Keras Code
                  </CardTitle>
                </div>
                <APIBadge codeType={codeType} />
              </div>
            </div>
            <ActionButtons
              onDownload={handleDownloadCode}
              onCopy={handleCopyCode}
              isDisabled={!generatedCode.trim()}
              isCopied={isCopied}
            />
          </CardHeader>
          <CardContent
            className={cn(
              "pt-0 pb-3 flex-1 flex flex-col min-h-0",
              UI_CONFIG.SPACING.CARD
            )}
          >
            <CodeEditor code={generatedCode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
