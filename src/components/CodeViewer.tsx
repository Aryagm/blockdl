import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
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
  const [isDark, setIsDark] = useState(false)

  // Detect theme from document
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkTheme()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

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
    <div className={`space-y-4 ${className}`}>
      <Card className="border-sidebar-border bg-sidebar-accent/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-sidebar-accent-foreground">
              Generated Keras Code
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                disabled={!generatedCode.trim()}
                className="h-8 px-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCode}
                disabled={!generatedCode.trim()}
                className="h-8 px-2"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md overflow-hidden border border-sidebar-border">
            <CodeMirror
              value={generatedCode}
              height="400px"
              extensions={[python()]}
              theme={isDark ? oneDark : undefined}
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
        </CardContent>
      </Card>

      <Card className="border-sidebar-border bg-sidebar-accent/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-sidebar-accent-foreground">
            💡 Code Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-sidebar-muted-foreground">
            Connect blocks from Input to Output to generate valid Keras code. 
            The code updates automatically as you modify your network structure.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
