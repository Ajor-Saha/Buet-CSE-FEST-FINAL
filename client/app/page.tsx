"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Boxes,
  Brain,
  Code2,
  FileSearch,
  FileText,
  Layers,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "CMS", href: "#cms" },
  { label: "Search", href: "#search" },
  { label: "Generation", href: "#generation" },
  { label: "Validation", href: "#validation" },
  { label: "Chat", href: "#chat" },
  { label: "Deliverables", href: "#deliverables" },
  { label: "Bonus", href: "#bonus" },
];

const bentoItems = [
  {
    title: "Theory + Lab Split",
    description:
      "Every course is organized into theory and lab tracks with metadata like week, topic, and tags.",
    icon: Layers,
  },
  {
    title: "Semantic Retrieval",
    description:
      "Natural language search with RAG-style grounding for slides, notes, and code snippets.",
    icon: FileSearch,
  },
  {
    title: "AI Study Kits",
    description:
      "Generate notes, slides, PDFs, and lab-ready code grounded in course materials.",
    icon: Wand2,
  },
  {
    title: "Evaluation Guardrails",
    description:
      "Syntax checks, grounding scores, and rubric-based validation reduce hallucinations.",
    icon: ShieldCheck,
  },
];

const roleCards = [
  {
    title: "Admins & TAs",
    description:
      "Upload slides, PDFs, code, and notes. Label everything as theory or lab with topics, weeks, and tags.",
    tags: ["Slides", "PDFs", "Code", "Notes"],
    icon: FileText,
  },
  {
    title: "Students",
    description:
      "Browse materials, run semantic searches, and ask the AI chat to summarize or generate study aids.",
    tags: ["Search", "Summaries", "RAG", "Chat"],
    icon: Code2,
  },
];

export default function Home() {
  const { user, signout, hydrateDone } = useAuth();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <span className="text-xl font-bold text-foreground">ContextVault</span>
          </div>
          <nav className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!hydrateDone ? null : user ? (
              <>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await signout();
                  }}
                >
                  Sign out
                </Button>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="overview" className="container mx-auto px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-700 dark:text-indigo-200">
              <Sparkles className="h-4 w-4" />
              AI-Powered Supplementary Learning Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              ContextVault for
              <br />
              <span className="text-indigo-600 dark:text-indigo-300">
                Theory and Lab Mastery
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Stop chasing scattered slides, notes, and code. ContextVault unifies
              learning resources into a single intelligent hub with semantic search,
              grounded generation, and a course-aware chat interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 h-14 gap-2">
                  Open Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Sign in to start
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-4 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-2xl font-semibold text-foreground">Theory</p>
                <p>Slides, PDFs, notes, reading kits</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-2xl font-semibold text-foreground">Lab</p>
                <p>Code, walkthroughs, structured tasks</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-2xl font-semibold text-foreground">Chat</p>
                <p>Grounded summaries and Q&A</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-linear-to-br from-indigo-500/20 via-blue-500/10 to-transparent rounded-3xl blur-2xl" />
            <Card className="p-6 space-y-6 shadow-xl border-border/60 bg-background/70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Course</p>
                  <p className="text-xl font-semibold">CSE 310 • Databases</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <Boxes className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSearch className="h-4 w-4" />
                    Semantic Retrieval
                  </div>
                  <p className="text-sm text-foreground">
                    “Show me week 4 lab query optimization notes with code.”
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bot className="h-4 w-4" />
                    AI Output
                  </div>
                  <p className="text-sm text-foreground">
                    Generated lab checklist + SQL templates grounded to uploaded slides.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="rounded-lg bg-indigo-500/10 px-3 py-2">RAG Context</div>
                  <div className="rounded-lg bg-indigo-500/10 px-3 py-2">Validation On</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Bento Features */}
      <section className="container mx-auto px-6 py-16" id="cms">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm text-indigo-600 dark:text-indigo-300 font-semibold">
              Core Platform Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              A unified system for content, search, and generation
            </h2>
          </div>
          <Link href="/dashboard" className="hidden md:inline-flex">
            <Button variant="outline">Explore Dashboard</Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {bentoItems.map(item => (
            <Card key={item.title} className="p-6 space-y-3 border-border/60 bg-background/70">
              <div className="p-3 rounded-xl bg-indigo-500/10 w-fit">
                <item.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Deep Dive */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card id="search" className="p-6 space-y-4 bg-background/70 border-border/60">
            <FileSearch className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            <h3 className="text-xl font-semibold">Intelligent Search</h3>
            <p className="text-muted-foreground">
              Semantic retrieval for theory and lab resources, with document excerpts and code snippets.
            </p>
          </Card>
          <Card id="generation" className="p-6 space-y-4 bg-background/70 border-border/60">
            <Brain className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            <h3 className="text-xl font-semibold">AI-Generated Materials</h3>
            <p className="text-muted-foreground">
              Create notes, slides, PDFs, and code templates grounded in internal and external context.
            </p>
          </Card>
          <Card id="validation" className="p-6 space-y-4 bg-background/70 border-border/60">
            <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            <h3 className="text-xl font-semibold">Validation & Evaluation</h3>
            <p className="text-muted-foreground">
              Syntax checks, grounding verification, and rubric-based scoring ensure reliability.
            </p>
          </Card>
        </div>
      </section>

      {/* Roles */}
      <section className="container mx-auto px-6 py-16" id="chat">
        <div className="grid lg:grid-cols-2 gap-8">
          {roleCards.map(card => (
            <Card key={card.title} className="p-8 space-y-4 bg-background/70 border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-lg">
                  <card.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">{card.title}</h3>
              </div>
              <p className="text-muted-foreground">{card.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {card.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-secondary rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Deliverables */}
      <section className="container mx-auto px-6 py-16" id="deliverables">
        <Card className="p-8 bg-background/70 border-border/60">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                <MessagesSquare className="h-5 w-5" />
                <span className="text-sm font-semibold">Deliverables</span>
              </div>
              <h3 className="text-2xl font-semibold">What teams must deliver</h3>
              <p className="text-muted-foreground">
                A working prototype plus architecture, sample interactions, and validation strategy.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border/60 p-4 bg-background">
                Web app or demo with content, search, and chat.
              </div>
              <div className="rounded-lg border border-border/60 p-4 bg-background">
                System architecture + AI component explanation.
              </div>
              <div className="rounded-lg border border-border/60 p-4 bg-background">
                Sample queries, generations, and validation output.
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Bonus */}
      <section className="container mx-auto px-6 py-16" id="bonus">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 bg-background/70 border-border/60">
            <Wand2 className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            <h3 className="text-lg font-semibold">Handwritten Notes → LaTeX</h3>
            <p className="text-muted-foreground text-sm">
              Digitize handwritten notes into structured, searchable formats.
            </p>
          </Card>
          <Card className="p-6 space-y-3 bg-background/70 border-border/60">
            <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            <h3 className="text-lg font-semibold">Content-to-Video</h3>
            <p className="text-muted-foreground text-sm">
              Generate video explainers directly from lecture content.
            </p>
          </Card>
          <Card className="p-6 space-y-3 bg-background/70 border-border/60">
            <MessagesSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            <h3 className="text-lg font-semibold">Community + Bot Support</h3>
            <p className="text-muted-foreground text-sm">
              Peer discussion with a grounded assistant when peers are offline.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto bg-linear-to-br from-indigo-600 to-blue-600 rounded-2xl p-12 text-white shadow-xl">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Launch ContextVault for your courses
              </h2>
              <p className="text-blue-100">
                Build a centralized AI learning hub for theory and lab content with search,
                generation, validation, and chat all in one place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-start lg:justify-end">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8 h-14 gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/70">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            <span className="font-semibold text-foreground">ContextVault</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 ContextVault. AI-powered learning for theory and lab.
          </p>
        </div>
      </footer>
    </div>
  );
}