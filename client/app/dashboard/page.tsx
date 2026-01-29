'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, BookOpen, } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";

export default function Page() {
  const router = useRouter();
  const { user, hydrateDone } = useAuth();

  React.useEffect(() => {
    if (!hydrateDone) return;
    if (!user) router.replace("/auth/signin");
  }, [hydrateDone, user, router]);

  const [courses, setCourses] = useState([
    {
      id: "1",
      name: "Introduction to Computer Science",
      code: "CS101",
      description: "Fundamental concepts of programming, algorithms, and data structures",
      color: "#3b82f6",
      examDate: "2026-03-15",
      materialsCount: 12,
      messagesCount: 45,
    },
    {
      id: "2",
      name: "Data Structures and Algorithms",
      code: "CS201",
      description: "Advanced data structures, algorithm design, and complexity analysis",
      color: "#10b981",
      examDate: "2026-03-20",
      materialsCount: 8,
      messagesCount: 32,
    },
    {
      id: "3",
      name: "Web Development Fundamentals",
      code: "WEB101",
      description: "HTML, CSS, JavaScript, and modern web frameworks",
      color: "#f59e0b",
      materialsCount: 15,
      messagesCount: 67,
    },
    {
      id: "4",
      name: "Machine Learning Basics",
      code: "ML101",
      description: "Introduction to machine learning algorithms and applications",
      color: "#8b5cf6",
      examDate: "2026-04-05",
      materialsCount: 10,
      messagesCount: 28,
    },
  ])

  if (!hydrateDone || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">Active learning paths</p>
              </CardContent>
            </Card>
            
          </div>

          
          
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
