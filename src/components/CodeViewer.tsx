import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Copy, Download } from 'lucide-react'
import { getOrderedLayers, generateKerasCode } from '../lib/graph-utils'
import type { Node, Edge } from '@xyflow/react'

interface CodeViewerProps {
  nodes: Node[]
  edges: Edge[]
  className?: string
}

export function CodeViewer({ nodes, edges, className = '' }: CodeViewerProps) {
  const [generatedCode, setGeneratedCode] = useState<string>('')

  // Re-generate code when nodes or edges change
  useEffect(() => {
    const orderedLayers = getOrderedLayers(nodes, edges)
    const code = generateKerasCode(orderedLayers)
    setGeneratedCode(code)
  }, [nodes, edges])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      // You could add a toast notification here
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
    }
  }

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/python' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'neural_network.py'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 p-6 h-full overflow-y-auto bg-slate-50/80 ${className}`}>
      <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <span>🐍</span>
              Generated Keras Code
            </CardTitle>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                disabled={!generatedCode.trim()}
                className="h-9 px-3 rounded-lg border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCode}
                disabled={!generatedCode.trim()}
                className="h-9 px-3 rounded-lg border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
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
