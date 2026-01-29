"use client"

import * as React from "react"
import { Bot, CheckCircle2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type ChatSheetVariant = "landing" | "dashboard"

type ChatSheetProps = {
  trigger: React.ReactNode
  variant?: ChatSheetVariant
  title?: string
  description?: string
  contentClassName?: string
}

const landingMessages = [
  {
    role: "assistant",
    content:
      "Hi! I can explain how ContextVault organizes theory and lab content, or show a quick tour.",
  },
  { role: "user", content: "How do I search lab materials?" },
  {
    role: "assistant",
    content:
      "Use semantic search to query code concepts. Results include snippets, weeks, and topics.",
  },
]

const dashboardMessages = [
  {
    role: "assistant",
    content:
      "RAG Assistant is ready. Ask about course materials or request a grounded summary.",
  },
  { role: "user", content: "Summarize week 4 lab on indexing." },
  {
    role: "assistant",
    content:
      "Drafting summary using course slides + lab notes. Grounding score: 0.92.",
  },
]

export function ChatSheet({
  trigger,
  variant = "landing",
  title = "ContextVault Chat",
  description = "Static preview. Backend integration coming next.",
  contentClassName,
}: ChatSheetProps) {
  const isDashboard = variant === "dashboard"
  const messages = isDashboard ? dashboardMessages : landingMessages

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className={cn("w-full sm:max-w-lg", contentClassName)}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-600" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
          {isDashboard ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">RAG Mode</Badge>
              <Badge variant="secondary">Grounded Responses</Badge>
              <Badge variant="secondary">Course Context</Badge>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Quick Tour</Badge>
              <Badge variant="secondary">FAQ</Badge>
            </div>
          )}
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 rounded-xl border border-border/60 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "ml-auto bg-indigo-600 text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.content}
                </div>
              ))}
              {isDashboard ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Sources verified · 3 references attached
                </div>
              ) : null}
            </div>
          </ScrollArea>

          {isDashboard ? (
            <div className="grid gap-2 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border/60 p-3">
                Sources: Week 4 Slides · Lab Manual · SQL Cheatsheet
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Input placeholder="Ask ContextVault..." />
            <Button type="button" className="gap-1">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
