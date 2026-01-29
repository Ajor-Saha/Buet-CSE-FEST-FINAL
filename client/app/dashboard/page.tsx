'use client';

import { useState, useEffect } from "react";
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
import { apiGetMyEnrolledCourses, type Enrollment } from "@/lib/courses-api";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const { user, token, hydrateDone } = useAuth();
  const [courses, setCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!hydrateDone) return;
    if (!user) {
      router.replace("/auth/signin");
      return;
    }
    // Redirect admins to admin dashboard
    if (user.role === "admin") {
      router.replace("/dashboard/admin");
    }
  }, [hydrateDone, user, router]);

  useEffect(() => {
    async function fetchCourses() {
      if (!token) return;
      
      setLoading(true);
      const res = await apiGetMyEnrolledCourses(token);
      
      if (!res.ok) {
        toast.error("Failed to load courses");
        setLoading(false);
        return;
      }

      setCourses(res.data.data || []);
      setLoading(false);
    }

    if (user && token) {
      fetchCourses();
    }
  }, [user, token]);

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
                <p className="text-xs text-muted-foreground">Enrolled courses</p>
              </CardContent>
            </Card>
          </div>

          {/* Courses Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <Link href="/courses">
                <Button variant="outline">Browse All Courses</Button>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <Card className="p-8">
                <div className="text-center space-y-4">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">No courses yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start by enrolling in a course to see it here
                    </p>
                  </div>
                  <Link href="/courses">
                    <Button>Browse Courses</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.enrollment_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{course.code}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {course.department_name && (
                          <span className="px-2 py-1 bg-secondary rounded">
                            {course.department_name}
                          </span>
                        )}
                        {course.semester && (
                          <span className="px-2 py-1 bg-secondary rounded">
                            {course.semester} {course.year}
                          </span>
                        )}
                      </div>
                      <Link href={`/courses/${course.course_id}`}>
                        <Button className="w-full" variant="outline">
                          View Course
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
