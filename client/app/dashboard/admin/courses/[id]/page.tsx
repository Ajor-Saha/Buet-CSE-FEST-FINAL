'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, Upload, GraduationCap, FlaskConical, FileText, Download, Eye, Bot, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { apiGetCourseById, type Course } from "@/lib/courses-api";
import { apiGetMaterials, type Material } from "@/lib/materials-api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CourseChatSheet } from "@/components/chatbot/course-chat-sheet"
import { GenerateMaterialsDialog } from "@/components/generate-materials-dialog"

export default function ManageCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { user, token, hydrateDone } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [theoryMaterials, setTheoryMaterials] = useState<Material[]>([]);
  const [labMaterials, setLabMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!hydrateDone) return;
    if (!user) {
      router.replace("/auth/signin");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrateDone, user, router]);

  useEffect(() => {
    async function fetchData() {
      if (!token || !courseId) return;
      
      setLoading(true);
      
      // Fetch course
      const courseRes = await apiGetCourseById(courseId, token);
      if (!courseRes.ok) {
        toast.error("Failed to load course");
        setLoading(false);
        return;
      }
      setCourse(courseRes.data.data);

      // Fetch theory materials
      const theoryRes = await apiGetMaterials({ 
        course_id: courseId, 
        category: "theory", 
        authToken: token 
      });
      if (theoryRes.ok) {
        setTheoryMaterials(theoryRes.data.data || []);
      }

      // Fetch lab materials
      const labRes = await apiGetMaterials({ 
        course_id: courseId, 
        category: "lab", 
        authToken: token 
      });
      if (labRes.ok) {
        setLabMaterials(labRes.data.data || []);
      }

      setLoading(false);
    }

    if (user && token && user.role === "admin") {
      fetchData();
    }
  }, [user, token, courseId]);

  if (!hydrateDone || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading course...
      </div>
    );
  }

  const MaterialCard = ({ material }: { material: Material }) => {
    const formatFileSize = (bytes: number | null | undefined) => {
      if (!bytes) return "N/A";
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return (
      <Card className="hover:shadow-lg transition-all hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-base leading-tight">{material.title}</CardTitle>
              {material.topic && (
                <CardDescription className="text-xs">{material.topic}</CardDescription>
              )}
            </div>
            <Badge variant="outline" className="ml-2 shrink-0">
              Week {material.week_number || "N/A"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {material.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {material.description}
            </p>
          )}
          
          {/* File Info */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {material.material_type}
            </Badge>
            {material.file_size && (
              <Badge variant="outline" className="font-normal">
                {formatFileSize(material.file_size)}
              </Badge>
            )}
            {material.mime_type && (
              <Badge variant="outline" className="font-normal text-xs">
                {material.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {material.tags && material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {material.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs"
                >
                  #{tag}
                </span>
              ))}
              {material.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                  +{material.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{material.view_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                <span>{material.download_count || 0}</span>
              </div>
            </div>
            <span className="text-xs">{formatDate(material.uploaded_at)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <a 
              href={material.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1"
              onClick={(e) => {
                // Track view when opening file
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/${material.material_id}/download`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }).catch(err => console.error('Failed to track view:', err));
              }}
            >
              <Button size="sm" variant="outline" className="w-full gap-2 hover:bg-primary hover:text-primary-foreground">
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
            </a>
            <a 
              href={material.file_url} 
              download={material.file_name}
              className="flex-1"
            >
              <Button size="sm" className="w-full gap-2">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  };

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
                    <BreadcrumbLink href="/dashboard/admin">
                      Admin
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{course.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <CourseChatSheet
                courseId={courseId}
                courseName={course?.name}
                trigger={
                  <Button size="sm" variant="outline" className="gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="hidden sm:inline">Ask AI</span>
                  </Button>
                }
              />
              <GenerateMaterialsDialog
                courseId={courseId}
                courseName={course?.name}
                trigger={
                  <Button size="sm" variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Generate</span>
                  </Button>
                }
              />
              <Link href={`/dashboard/admin/courses/${courseId}/upload`}>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Material
                </Button>
              </Link>
              <ModeToggle />
              <Link href="/dashboard/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Course Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl">{course.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-base">
                    <span className="font-medium">{course.code}</span>
                    {course.semester && (
                      <>
                        <span>•</span>
                        <span>Semester {course.semester}</span>
                      </>
                    )}
                    {course.year && (
                      <>
                        <span>•</span>
                        <span>{course.year}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {course.has_theory && (
                    <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Theory
                    </span>
                  )}
                  {course.has_lab && (
                    <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Lab
                    </span>
                  )}
                </div>
              </div>
              {course.description && (
                <CardContent className="px-0 pb-0 pt-4">
                  <p className="text-muted-foreground">{course.description}</p>
                </CardContent>
              )}
            </CardHeader>
          </Card>

          {/* Materials Section */}
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>
                Manage theory and lab materials for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="theory">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="theory">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Theory ({theoryMaterials.length})
                  </TabsTrigger>
                  <TabsTrigger value="lab">
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Lab ({labMaterials.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="theory" className="mt-6">
                  {theoryMaterials.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 bg-muted rounded-full">
                          <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">No theory materials yet</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                          Upload lecture slides, PDFs, notes, or other theory materials for this course
                        </p>
                      </div>
                      <Link href={`/dashboard/admin/courses/${courseId}/upload`}>
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Theory Material
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {theoryMaterials.length} {theoryMaterials.length === 1 ? 'material' : 'materials'} available
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {theoryMaterials.map(material => (
                          <MaterialCard key={material.material_id} material={material} />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="lab" className="mt-6">
                  {labMaterials.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 bg-muted rounded-full">
                          <FlaskConical className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">No lab materials yet</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                          Upload code files, lab manuals, assignments, or other lab materials for this course
                        </p>
                      </div>
                      <Link href={`/dashboard/admin/courses/${courseId}/upload`}>
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Lab Material
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {labMaterials.length} {labMaterials.length === 1 ? 'material' : 'materials'} available
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {labMaterials.map(material => (
                          <MaterialCard key={material.material_id} material={material} />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
