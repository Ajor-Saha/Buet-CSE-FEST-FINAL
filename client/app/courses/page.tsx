'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Home, BookOpen, Plus, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { apiGetCourses, apiEnrollInCourse, type Course } from "@/lib/courses-api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function CoursesPage() {
  const router = useRouter();
  const { user, token, hydrateDone } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!hydrateDone) return;
    if (!user) router.replace("/auth/signin");
  }, [hydrateDone, user, router]);

  useEffect(() => {
    async function fetchCourses() {
      if (!token) return;
      
      setLoading(true);
      const res = await apiGetCourses({ authToken: token });
      
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

  const handleEnroll = async (courseId: string) => {
    if (!token) return;
    
    setEnrolling(courseId);
    const res = await apiEnrollInCourse(courseId, token);
    
    if (!res.ok) {
      toast.error(res.message || "Failed to enroll");
      setEnrolling(null);
      return;
    }

    toast.success("Successfully enrolled in course!");
    setEnrolling(null);
  };

  const filteredCourses = courses.filter(course => {
    const query = searchQuery.toLowerCase();
    return (
      course.name.toLowerCase().includes(query) ||
      course.code.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query)
    );
  });

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
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>All Courses</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Browse Courses</h2>
            </div>

            <div className="max-w-md">
              <Input
                placeholder="Search courses by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading courses...
              </div>
            ) : filteredCourses.length === 0 ? (
              <Card className="p-8">
                <div className="text-center space-y-4">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">No courses found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery ? "Try a different search term" : "No courses available"}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <Card key={course.course_id} className="hover:shadow-lg transition-shadow">
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
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {course.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                        {course.has_theory && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                            Theory
                          </span>
                        )}
                        {course.has_lab && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                            Lab
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/courses/${course.course_id}`} className="flex-1">
                          <Button className="w-full" variant="outline">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          className="flex-1"
                          onClick={() => handleEnroll(course.course_id)}
                          disabled={enrolling === course.course_id}
                        >
                          {enrolling === course.course_id ? "Enrolling..." : "Enroll"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
