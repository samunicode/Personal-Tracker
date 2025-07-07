"use client"

import { useState, useRef, useEffect } from "react"
import { Bold, Italic, Underline, List, ListOrdered, Code, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface SimpleRichEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  compact?: boolean
}

export function SimpleRichEditor({
  value = "",
  onChange,
  placeholder = "Start writing...",
  compact = false,
}: SimpleRichEditorProps) {
  const [content, setContent] = useState(value)
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(value)
  }, [value])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onChange?.(newContent)
  }

  const insertMarkdown = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)

    handleContentChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(
        /^&gt; (.*$)/gm,
        '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground">$1</blockquote>',
      )
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\.\s(.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, "<br>")
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), tooltip: "Bold" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), tooltip: "Italic" },
    { icon: Underline, action: () => insertMarkdown("__", "__"), tooltip: "Underline" },
    { icon: Code, action: () => insertMarkdown("`", "`"), tooltip: "Code" },
    { icon: Quote, action: () => insertMarkdown("&gt; "), tooltip: "Quote" },
    { icon: List, action: () => insertMarkdown("- "), tooltip: "Bullet List" },
    { icon: ListOrdered, action: () => insertMarkdown("1. "), tooltip: "Numbered List" },
  ]

  return (
    <div className="w-full border border-border rounded-lg bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              className="h-8 w-8 p-0 hover:bg-accent text-foreground"
              title={button.tooltip}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          className="text-xs px-2 py-1 h-8 text-foreground hover:bg-accent"
        >
          {isPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {/* Content Area */}
      <div className="p-3">
        {isPreview ? (
          <div
            className={`prose prose-sm max-w-none text-foreground ${compact ? "min-h-[100px]" : "min-h-[200px]"}`}
            dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
          />
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full border-0 resize-none focus:ring-0 focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground ${
              compact ? "min-h-[100px]" : "min-h-[200px]"
            }`}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">Supports **bold**, *italic*, `code`, &gt; quotes, and - lists</p>
      </div>
    </div>
  )
}
