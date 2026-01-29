"use client"

import * as React from "react"
import {
  Download,
  FileText,
  Loader2,
  ScrollText,
  Sparkles,
  X,
  FileDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  apiGenerateEnhancedContent,
  apiGeneratePDF,
  type SourceMaterial,
} from "@/lib/content-api"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

type GenerationType = "enhanced" | "pdf"

const generationTypeConfig: Record<
  GenerationType,
  { label: string; icon: React.ElementType; description: string }
> = {
  enhanced: {
    label: "Enhanced Content",
    icon: ScrollText,
    description: "AI-generated study content with title and comprehensive description",
  },
  pdf: {
    label: "PDF Document",
    icon: FileDown,
    description: "Full PDF document with introduction, main content, summary, and references",
  },
}

type GenerateMaterialsDialogProps = {
  trigger: React.ReactNode
  courseId: string
  courseName?: string
}

export function GenerateMaterialsDialog({
  trigger,
  courseId,
  courseName,
}: GenerateMaterialsDialogProps) {
  const { token } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [generationType, setGenerationType] = React.useState<GenerationType>("enhanced")
  const [userPrompt, setUserPrompt] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  
  // For enhanced content result
  const [generatedTitle, setGeneratedTitle] = React.useState<string | null>(null)
  const [generatedDescription, setGeneratedDescription] = React.useState<string | null>(null)
  const [sources, setSources] = React.useState<SourceMaterial[]>([])

  const handleGenerate = async () => {
    if (!token) {
      toast.error("Please sign in to generate materials")
      return
    }

    if (!userPrompt.trim()) {
      toast.error("Please enter a prompt describing what you want to generate")
      return
    }

    setIsGenerating(true)
    setGeneratedTitle(null)
    setGeneratedDescription(null)
    setSources([])

    const config = generationTypeConfig[generationType]

    try {
      if (generationType === "pdf") {
        // Generate and download PDF
        toast.info("Generating PDF... This may take a moment.")
        
        const res = await apiGeneratePDF(
          { course_id: courseId, user_prompt: userPrompt },
          token
        )

        if (!res.ok) {
          toast.error(res.message || "Failed to generate PDF")
          setIsGenerating(false)
          return
        }

        // Download the PDF
        const url = URL.createObjectURL(res.blob)
        const a = document.createElement("a")
        a.href = url
        a.download = res.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success("PDF downloaded successfully!")
      } else {
        // Generate enhanced content
        const res = await apiGenerateEnhancedContent(
          { course_id: courseId, user_prompt: userPrompt },
          token
        )

        if (!res.ok) {
          toast.error(res.message || "Failed to generate content")
          setIsGenerating(false)
          return
        }

        setGeneratedTitle(res.data.data.title)
        setGeneratedDescription(res.data.data.description)
        setSources(res.data.data.metadata.source_materials || [])
        toast.success(`${config.label} generated successfully!`)
      }
    } catch (error) {
      toast.error("An error occurred while generating materials")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadMarkdown = () => {
    if (!generatedTitle || !generatedDescription) return

    const filename = `${courseName || "course"}_content_${Date.now()}.md`

    const content = `# ${generatedTitle}

**Course:** ${courseName || courseId}
**Generated on:** ${new Date().toLocaleDateString()}
**Prompt:** ${userPrompt}

---

${generatedDescription}

---

## Sources Used

${sources.map((s, i) => `${i + 1}. ${s.material}${s.page ? ` (Page ${s.page})` : ""} - ${s.category || "N/A"}`).join("\n")}
`

    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Downloaded ${filename}`)
  }

  const handleReset = () => {
    setGeneratedTitle(null)
    setGeneratedDescription(null)
    setSources([])
  }

  const SelectedIcon = generationTypeConfig[generationType].icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Generate Learning Materials
          </DialogTitle>
          <DialogDescription>
            Use AI to generate study materials from your course content
            {courseName && <span className="font-medium"> for {courseName}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-4">
          {/* Generation Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(generationTypeConfig) as GenerationType[]).map((type) => {
              const config = generationTypeConfig[type]
              const Icon = config.icon
              return (
                <button
                  key={type}
                  onClick={() => {
                    setGenerationType(type)
                    handleReset()
                  }}
                  disabled={isGenerating}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-left",
                    generationType === type
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                      : "border-border hover:border-indigo-300",
                    isGenerating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        generationType === type ? "text-indigo-600" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        generationType === type ? "text-indigo-600" : "text-foreground"
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                </button>
              )
            })}
          </div>

          {/* User Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">What do you want to generate?</Label>
            <Input
              id="prompt"
              placeholder="e.g., Explain database indexing and B-trees with examples"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isGenerating}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about the topic. The AI will search your course materials and generate comprehensive content.
            </p>
          </div>

          {/* Generate Button */}
          {!generatedTitle && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !userPrompt.trim()}
              className="w-full gap-2 h-11"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {generationType === "pdf" ? "Generating PDF..." : "Generating Content..."}
                </>
              ) : (
                <>
                  <SelectedIcon className="h-4 w-4" />
                  Generate {generationTypeConfig[generationType].label}
                </>
              )}
            </Button>
          )}

          {/* Generated Content (for enhanced type) */}
          {generatedTitle && generatedDescription && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <ScrollText className="h-3 w-3" />
                    Enhanced Content
                  </Badge>
                  <Badge variant="outline">{sources.length} sources</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleDownloadMarkdown} className="gap-1">
                    <Download className="h-4 w-4" />
                    Download MD
                  </Button>
                </div>
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sources.slice(0, 5).map((source, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {source.material}{source.page ? ` (p.${source.page})` : ""}
                    </Badge>
                  ))}
                  {sources.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{sources.length - 5} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Content Preview */}
              <div className="rounded-lg border bg-muted/30 p-4 max-h-[300px] overflow-y-auto space-y-3">
                <h3 className="text-lg font-semibold">{generatedTitle}</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                  {generatedDescription}
                </div>
              </div>

              {/* Generate PDF from this content */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    setIsGenerating(true)
                    toast.info("Generating PDF version...")
                    const res = await apiGeneratePDF(
                      { course_id: courseId, user_prompt: userPrompt },
                      token
                    )
                    if (res.ok) {
                      const url = URL.createObjectURL(res.blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = res.filename
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      toast.success("PDF downloaded!")
                    } else {
                      toast.error(res.message || "PDF generation failed")
                    }
                    setIsGenerating(false)
                  }}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Get PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
