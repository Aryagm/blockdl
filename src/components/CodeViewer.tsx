import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Copy, Check, Download } from 'lucide-react'
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

  const handleDownloadCode = () => {
    if (!generatedCode.trim()) return
    
    const blob = new Blob([generatedCode], { type: 'text/python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keras_model_${codeType}.py`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`h-full flex flex-col bg-slate-50/80 ${className}`}>
      <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
        <Card className="border-slate-200 bg-white shadow-sm rounded-xl flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3 px-4 sm:px-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐍</span>
                  <CardTitle className="text-xl text-slate-800 font-semibold">
                    Keras Code
                  </CardTitle>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  codeType === 'functional' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {codeType === 'functional' ? 'Functional API' : 'Sequential API'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCode}
                  disabled={!generatedCode.trim()}
                  className="h-9 px-4 rounded-lg transition-all duration-200 shadow-sm border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download .py
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  disabled={!generatedCode.trim()}
                  className={`h-9 px-4 rounded-lg transition-all duration-200 shadow-sm ${
                    isCopied 
                      ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 shadow-md' 
                      : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md'
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
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-4 sm:px-6 pb-3 flex-1 flex flex-col min-h-0">
            <div className="rounded-xl border border-slate-200 shadow-inner bg-slate-50/30 flex-1 min-h-0">
              <div className="w-full h-full overflow-auto">
                <CodeMirror
                  value={generatedCode}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
