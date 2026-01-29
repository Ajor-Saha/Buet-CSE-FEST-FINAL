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
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  apiGenerateEnhancedContent,
  apiGeneratePDF,
  type SourceMaterial,
} from "@/lib/content-api"
import { apiValidateText, type TextEvaluation } from "@/lib/validation-api"
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

function getScoreColor(score: number): string {
  if (score >= 8) return "text-emerald-600"
  if (score >= 6) return "text-yellow-600"
  return "text-red-600"
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
  const [isValidating, setIsValidating] = React.useState(false)

  // For enhanced content result
  const [generatedTitle, setGeneratedTitle] = React.useState<string | null>(null)
  const [generatedDescription, setGeneratedDescription] = React.useState<string | null>(null)
  const [sources, setSources] = React.useState<SourceMaterial[]>([])

  // For validation result
  const [validation, setValidation] = React.useState<TextEvaluation | null>(null)
  const [showDetails, setShowDetails] = React.useState(false)

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
    setValidation(null)

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

        const title = res.data.data.title
        const description = res.data.data.description

        setGeneratedTitle(title)
        setGeneratedDescription(description)
        setSources(res.data.data.metadata.source_materials || [])
        toast.success(`${config.label} generated successfully!`)

        // Automatically validate the generated content
        setIsGenerating(false)
        setIsValidating(true)
        toast.info("Validating content quality...")

        const validationRes = await apiValidateText(
          {
            content: `${title}\n\n${description}`,
            context: `Generated for course: ${courseName || courseId}. User prompt: ${userPrompt}`,
          },
          token
        )

        if (validationRes.ok) {
          setValidation(validationRes.data.data.evaluation)
          toast.success("Content validated!")
        } else {
          toast.error("Validation failed, but content is ready")
        }
        setIsValidating(false)
        return
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

    let content = `# ${generatedTitle}

**Course:** ${courseName || courseId}
**Generated on:** ${new Date().toLocaleDateString()}
**Prompt:** ${userPrompt}

---

${generatedDescription}

---

## Sources Used

${sources.map((s, i) => `${i + 1}. ${s.material}${s.page ? ` (Page ${s.page})` : ""} - ${s.category || "N/A"}`).join("\n")}
`

    // Add validation info if available
    if (validation) {
      content += `
---

## Quality Validation

- **Confidence Score:** ${validation.confidence_score}/10
- **Accuracy Score:** ${validation.accuracy_score}/10
- **Clarity Score:** ${validation.clarity_score}/10

### Strengths
${validation.strengths.map((s) => `- ${s}`).join("\n")}

### Areas for Improvement
${validation.weaknesses.map((w) => `- ${w}`).join("\n")}

### Suggestions
${validation.suggestions.map((s) => `- ${s}`).join("\n")}
`
    }

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
    setValidation(null)
    setShowDetails(false)
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
                  disabled={isGenerating || isValidating}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-left",
                    generationType === type
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                      : "border-border hover:border-indigo-300",
                    (isGenerating || isValidating) && "opacity-50 cursor-not-allowed"
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
                  <span className="text-xs text-muted-foreground">{config.description}</span>
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
              disabled={isGenerating || isValidating}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about the topic. The AI will search your course materials and generate
              comprehensive content.
            </p>
          </div>

          {/* Generate Button */}
          {!generatedTitle && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isValidating || !userPrompt.trim()}
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
              {/* Validation Scores - Always visible at top */}
              {isValidating && (
                <div className="rounded-lg border bg-indigo-50 dark:bg-indigo-950 p-3 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  <div>
                    <p className="font-medium text-sm">Validating Content Quality...</p>
                    <p className="text-xs text-muted-foreground">
                      AI is evaluating accuracy, clarity, and completeness
                    </p>
                  </div>
                </div>
              )}

              {validation && (
                <div className="rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 dark:from-indigo-950 dark:via-slate-900 dark:to-indigo-950 p-3">
                  {/* Compact Score Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      <span className="font-semibold text-sm">Quality Score</span>
                    </div>
                    
                    {/* Inline Scores */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <span className={cn("font-bold text-sm", getScoreColor(validation.confidence_score))}>
                          {validation.confidence_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Accuracy:</span>
                        <span className={cn("font-bold text-sm", getScoreColor(validation.accuracy_score))}>
                          {validation.accuracy_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Clarity:</span>
                        <span className={cn("font-bold text-sm", getScoreColor(validation.clarity_score))}>
                          {validation.clarity_score.toFixed(1)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          validation.confidence_score >= 8
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : validation.confidence_score >= 6
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        )}
                      >
                        {validation.confidence_score >= 8
                          ? "Excellent"
                          : validation.confidence_score >= 6
                          ? "Good"
                          : "Improve"}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full gap-1 mt-2 h-7 text-xs">
                        {showDetails ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            View Strengths, Weaknesses & Suggestions
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-3 border-t mt-2">
                      {/* Explanation */}
                      <div className="text-sm text-muted-foreground bg-white dark:bg-slate-950 rounded p-3">
                        {validation.explanation}
                      </div>

                      {/* Strengths */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Strengths
                        </div>
                        <ul className="space-y-1">
                          {validation.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-emerald-500 mt-1">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                          <AlertTriangle className="h-4 w-4" />
                          Areas for Improvement
                        </div>
                        <ul className="space-y-1">
                          {validation.weaknesses.map((w, i) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-yellow-500 mt-1">•</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Suggestions */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                          <Lightbulb className="h-4 w-4" />
                          Suggestions
                        </div>
                        <ul className="space-y-1">
                          {validation.suggestions.map((s, i) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-blue-500 mt-1">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              {/* Header with actions */}
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
                    Download
                  </Button>
                </div>
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sources.slice(0, 5).map((source, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {source.material}
                      {source.page ? ` (p.${source.page})` : ""}
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
              <div className="rounded-lg border bg-muted/30 p-4 max-h-[180px] overflow-y-auto space-y-3">
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
                  disabled={isGenerating || isValidating}
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
                  disabled={isGenerating || isValidating}
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
