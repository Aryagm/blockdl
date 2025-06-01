import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Copy, Check } from 'lucide-react'
import { parseGraphToDAG, generateKerasCode, generateFunctionalKerasCode } from '../lib/graph-utils'
import type { Node, Edge } from '@xyflow/react'

interface CodeViewerProps {
  nodes: Node[]
  edges: Edge[]
  className?: string
}

export function CodeViewer({ nodes, edges, className = '' }: CodeViewerProps) {
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [isCopied, setIsCopied] = useState(false)
  const [codeType, setCodeType] = useState<'sequential' | 'functional'>('sequential')

  // Re-generate code when nodes or edges change
  useEffect(() => {
    const dagResult = parseGraphToDAG(nodes, edges)
    
    if (!dagResult.isValid) {
      setGeneratedCode(`# Error: Invalid network structure\n# ${dagResult.errors.join('\n# ')}`)
      return
    }
    
    // Determine if we need Functional API (multiple inputs/outputs or complex structure)
    const hasMultipleInputs = dagResult.orderedNodes.filter(n => n.type === 'Input').length > 1
    const hasMultipleOutputs = dagResult.orderedNodes.filter(n => n.type === 'Output').length > 1
    const hasComplexStructure = Array.from(dagResult.edgeMap.values()).some(targets => targets.length > 1)
    const hasMergeLayer = dagResult.orderedNodes.some(n => n.type === 'Merge')
    
    const shouldUseFunctional = hasMultipleInputs || hasMultipleOutputs || hasComplexStructure || hasMergeLayer
    
    if (shouldUseFunctional) {
      setCodeType('functional')
      const code = generateFunctionalKerasCode(dagResult)
      setGeneratedCode(code)
    } else {
      setCodeType('sequential')
      const code = generateKerasCode(dagResult.orderedNodes)
      setGeneratedCode(code)
    }
  }, [nodes, edges])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setIsCopied(true)
      // Reset the confirmation after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)
      console.log('Code copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy code:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = generatedCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <div className={`space-y-6 p-6 h-full overflow-y-auto bg-slate-50/80 ${className}`}>
      <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <span>🐍</span>
              Generated Keras Code
              <span className={`text-xs px-2 py-1 rounded-full font-mono ${
                codeType === 'functional' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {codeType === 'functional' ? 'Functional API' : 'Sequential API'}
              </span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              disabled={!generatedCode.trim()}
              className={`h-9 px-4 rounded-lg transition-all duration-200 shadow-sm ${
                isCopied 
                  ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' 
                  : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
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
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <div className="text-left">
              <CodeMirror
                value={generatedCode}
                height="400px"
                extensions={[python()]}
                editable={false}
                style={{ textAlign: 'left' }}
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
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-blue-50/50 rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
            <span>⚡</span>
            Code Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-blue-600">
            Connect blocks from Input to Output to generate valid Keras code. 
            The code updates automatically as you modify your network structure.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
