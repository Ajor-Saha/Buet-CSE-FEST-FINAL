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
import { ArrowLeft, Upload, GraduationCap, FlaskConical, FileText, Download, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { apiGetCourseById, type Course } from "@/lib/courses-api";
import { apiGetMaterials, type Material } from "@/lib/materials-api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

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

  const MaterialCard = ({ material }: { material: Material }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base">{material.title}</CardTitle>
            {material.topic && (
              <CardDescription className="text-xs">{material.topic}</CardDescription>
            )}
          </div>
          <Badge variant="outline" className="ml-2">
            Week {material.week_number || "N/A"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {material.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {material.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-secondary rounded">
            {material.material_type}
          </span>
          {material.tags && material.tags.length > 0 && (
            material.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-secondary rounded">
                {tag}
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{material.view_count || 0} views</span>
          <Download className="h-3 w-3 ml-2" />
          <span>{material.download_count || 0} downloads</span>
        </div>
        <a href={material.file_url} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="w-full gap-2">
            <FileText className="h-3 w-3" />
            View File
          </Button>
        </a>
      </CardContent>
    </Card>
  );

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
              <Tabs defaultValue={course.has_theory ? "theory" : "lab"}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="theory" disabled={!course.has_theory}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Theory ({theoryMaterials.length})
                  </TabsTrigger>
                  <TabsTrigger value="lab" disabled={!course.has_lab}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Lab ({labMaterials.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="theory" className="mt-6">
                  {theoryMaterials.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">No theory materials yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload slides, PDFs, or other materials
                        </p>
                      </div>
                      <Link href={`/dashboard/admin/courses/${courseId}/upload`}>
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Material
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {theoryMaterials.map(material => (
                        <MaterialCard key={material.material_id} material={material} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="lab" className="mt-6">
                  {labMaterials.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">No lab materials yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload code files, lab manuals, or other materials
                        </p>
                      </div>
                      <Link href={`/dashboard/admin/courses/${courseId}/upload`}>
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Material
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {labMaterials.map(material => (
                        <MaterialCard key={material.material_id} material={material} />
                      ))}
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
