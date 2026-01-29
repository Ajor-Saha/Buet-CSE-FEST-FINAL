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
import { Home, BookOpen, Plus, Upload, FlaskConical, GraduationCap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { apiGetCourses, apiCreateCourse, type Course } from "@/lib/courses-api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token, hydrateDone } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Course creation form state
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    description: "",
    semester: "",
    year: new Date().getFullYear(),
    has_theory: true,
    has_lab: false,
    total_weeks: 16,
  });

  React.useEffect(() => {
    if (!hydrateDone) return;
    if (!user) {
      router.replace("/auth/signin");
      return;
    }
    // Redirect students to student dashboard
    if (user.role === "student") {
      router.replace("/dashboard");
    }
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

    if (user && token && user.role === "admin") {
      fetchCourses();
    }
  }, [user, token]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!courseForm.has_theory && !courseForm.has_lab) {
      toast.error("Course must have at least Theory or Lab");
      return;
    }

    setCreating(true);
    const res = await apiCreateCourse(courseForm, token);

    if (!res.ok) {
      toast.error(res.message || "Failed to create course");
      setCreating(false);
      return;
    }

    toast.success("Course created successfully");
    setCourses([...courses, res.data.data]);
    setCreateDialogOpen(false);
    setCreating(false);
    // Reset form
    setCourseForm({
      code: "",
      name: "",
      description: "",
      semester: "",
      year: new Date().getFullYear(),
      has_theory: true,
      has_lab: false,
      total_weeks: 16,
    });
  };

  if (!hydrateDone || !user || user.role !== "admin") {
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
                    <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
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
          {/* Welcome Banner */}
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome, {user.full_name}</CardTitle>
              <CardDescription className="text-blue-50">
                Admin Dashboard - Manage courses and materials
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">Courses in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Theory Courses</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courses.filter(c => c.has_theory).length}
                </div>
                <p className="text-xs text-muted-foreground">With theory component</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Lab Courses</CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courses.filter(c => c.has_lab).length}
                </div>
                <p className="text-xs text-muted-foreground">With lab component</p>
              </CardContent>
            </Card>
          </div>

          {/* Courses Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Course Management</h2>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                      Add a new course with theory and/or lab components
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Course Code *</Label>
                        <Input
                          id="code"
                          placeholder="CSE220"
                          value={courseForm.code}
                          onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Course Name *</Label>
                        <Input
                          id="name"
                          placeholder="Data Structures"
                          value={courseForm.name}
                          onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Course description..."
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select
                          value={courseForm.semester}
                          onValueChange={(value) => setCourseForm({ ...courseForm, semester: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1/1">1/1</SelectItem>
                            <SelectItem value="1/2">1/2</SelectItem>
                            <SelectItem value="2/1">2/1</SelectItem>
                            <SelectItem value="2/2">2/2</SelectItem>
                            <SelectItem value="3/1">3/1</SelectItem>
                            <SelectItem value="3/2">3/2</SelectItem>
                            <SelectItem value="4/1">4/1</SelectItem>
                            <SelectItem value="4/2">4/2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={courseForm.year}
                          onChange={(e) => setCourseForm({ ...courseForm, year: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_weeks">Total Weeks</Label>
                        <Input
                          id="total_weeks"
                          type="number"
                          value={courseForm.total_weeks}
                          onChange={(e) => setCourseForm({ ...courseForm, total_weeks: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Course Components *</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="has_theory"
                            checked={courseForm.has_theory}
                            onCheckedChange={(checked) => 
                              setCourseForm({ ...courseForm, has_theory: checked as boolean })
                            }
                          />
                          <label
                            htmlFor="has_theory"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Has Theory
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="has_lab"
                            checked={courseForm.has_lab}
                            onCheckedChange={(checked) => 
                              setCourseForm({ ...courseForm, has_lab: checked as boolean })
                            }
                          />
                          <label
                            htmlFor="has_lab"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Has Lab
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Course must have at least one component
                      </p>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create Course"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
                      Create your first course to get started
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
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
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        {course.has_theory && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            Theory
                          </span>
                        )}
                        {course.has_lab && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1">
                            <FlaskConical className="h-3 w-3" />
                            Lab
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/admin/courses/${course.course_id}`} className="flex-1">
                          <Button className="w-full" variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                        <Link href={`/dashboard/admin/courses/${course.course_id}/upload`} className="flex-1">
                          <Button className="w-full" size="sm" className="gap-1">
                            <Upload className="h-3 w-3" />
                            Upload
                          </Button>
                        </Link>
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
  )
}
