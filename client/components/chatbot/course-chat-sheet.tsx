"use client"

import * as React from "react"
import { Bot, CheckCircle2, Loader2, Send, FileText, Code, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { apiRagChat, type RagSource } from "@/lib/rag-api"
import { useAuth } from "@/components/auth/auth-provider"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: RagSource[]
  isLabContent?: boolean
  isLoading?: boolean
  isError?: boolean
}

type CourseChatSheetProps = {
  trigger: React.ReactNode
  courseId: string
  courseName?: string
  contentClassName?: string
}

export function CourseChatSheet({
  trigger,
  courseId,
  courseName,
  contentClassName,
}: CourseChatSheetProps) {
  const { token } = useAuth()
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your RAG assistant for ${courseName || "this course"}. Ask me anything about the course materials, and I'll find relevant information from your uploaded content.`,
    },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || isLoading) return

    const userMessageId = `user-${Date.now()}`
    const assistantMessageId = `assistant-${Date.now()}`

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: question },
    ])
    setInput("")
    setIsLoading(true)

    // Add loading placeholder for assistant
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "", isLoading: true },
    ])

    try {
      const res = await apiRagChat({ question, course_id: courseId }, token)

      if (!res.ok) {
        // Update with error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: res.message || "Sorry, I couldn't find relevant information. The materials may not be indexed yet.",
                  isLoading: false,
                  isError: true,
                }
              : m
          )
        )
      } else {
        // Update with actual response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: res.data.data.answer,
                  sources: res.data.data.sources,
                  isLabContent: res.data.data.metadata.is_lab_content,
                  isLoading: false,
                }
              : m
          )
        )
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: "An error occurred while processing your request.",
                isLoading: false,
                isError: true,
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className={cn("w-full sm:max-w-xl flex flex-col h-full", contentClassName)}
      >
        <SheetHeader className="space-y-2 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-600" />
            Course Assistant
          </SheetTitle>
          <SheetDescription>
            {courseName ? `Ask questions about ${courseName}` : "Ask questions about course materials"}
          </SheetDescription>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">RAG Mode</Badge>
            <Badge variant="secondary">Grounded Responses</Badge>
            <Badge variant="secondary">Course Context</Badge>
          </div>
        </SheetHeader>

        {/* Chat messages area - scrollable */}
        <div className="flex-1 min-h-0 mt-4 rounded-xl border border-border/60 overflow-y-auto">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "ml-auto bg-indigo-600 text-white"
                      : message.isError
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Searching course materials...</span>
                    </div>
                  ) : message.isError ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{message.content}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <Collapsible className="mt-2 ml-0">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {message.sources.length} sources · Click to expand
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {message.sources.map((source) => (
                        <div
                          key={source.source_number}
                          className="rounded-lg border border-border/60 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center gap-2 font-medium flex-wrap">
                            {source.is_code ? (
                              <Code className="h-3 w-3 text-purple-500" />
                            ) : (
                              <FileText className="h-3 w-3 text-blue-500" />
                            )}
                            <span>{source.material}</span>
                            {source.page && (
                              <Badge variant="outline" className="text-[10px] px-1">
                                Page {source.page}
                              </Badge>
                            )}
                            {source.category && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1 uppercase"
                              >
                                {source.category}
                              </Badge>
                            )}
                          </div>
                          {source.topic && (
                            <div className="text-muted-foreground">
                              Topic: {source.topic}
                            </div>
                          )}
                          <div className="text-muted-foreground line-clamp-2">
                            {source.excerpt}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ))}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area - fixed at bottom */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 flex-shrink-0">
          <Input
            placeholder="Ask about course materials..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" className="gap-1" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
