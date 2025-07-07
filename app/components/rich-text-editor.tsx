"use client"

import { useState } from "react"
import { Bold, Italic, Underline, List, ListOrdered, Type, Minus, Plus, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [fontSize, setFontSize] = useState(14)

  const insertText = (before: string, after = "") => {
    const textarea = document.querySelector("textarea[data-rich-editor]") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const formatText = (type: string) => {
    switch (type) {
      case "bold":
        insertText("**", "**")
        break
      case "italic":
        insertText("*", "*")
        break
      case "underline":
        insertText("<u>", "</u>")
        break
      case "bullet":
        insertText("\n- ")
        break
      case "numbered":
        insertText("\n1. ")
        break
      case "heading":
        insertText("\n## ")
        break
      case "line":
        insertText("\n---\n")
        break
    }
  }

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/---/g, '<hr class="my-4 border-gray-300" />')
      .replace(/\n/g, "<br />")
  }

  return (
    <Card className="border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("bold")}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("italic")}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("underline")}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("bullet")}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("numbered")}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("heading")}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Heading"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("line")}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Horizontal Line"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFontSize(Math.max(10, fontSize - 2))}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Decrease Font Size"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-gray-600 min-w-[2rem] text-center">{fontSize}px</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Increase Font Size"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-8 px-3 hover:bg-gray-200"
            title={showPreview ? "Hide Preview" : "Show Preview"}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-1 text-xs">{showPreview ? "Edit" : "Preview"}</span>
          </Button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="p-4">
        {showPreview ? (
          <div
            className="min-h-[120px] prose prose-sm max-w-none"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        ) : (
          <Textarea
            data-rich-editor
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0 font-mono"
            style={{ fontSize: `${fontSize}px` }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-500">
          Supports markdown formatting • Use **bold**, *italic*, <u>underline</u>, ## headings, - bullets, 1. numbers
        </p>
      </div>
    </Card>
  )
}
