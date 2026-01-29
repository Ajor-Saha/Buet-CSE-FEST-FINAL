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
import { FileText, Download, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { apiGetCourseById, type Course } from "@/lib/courses-api";
import { apiGetMaterials, apiTrackDownload, type Material } from "@/lib/materials-api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, token, hydrateDone } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [theoryMaterials, setTheoryMaterials] = useState<Material[]>([]);
  const [labMaterials, setLabMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrateDone) return;
    if (!user) router.replace("/auth/signin");
  }, [hydrateDone, user, router]);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      
      setLoading(true);
      
      // Fetch course details
      const courseRes = await apiGetCourseById(params.id, token);
      if (!courseRes.ok) {
        toast.error("Failed to load course");
        setLoading(false);
        return;
      }
      setCourse(courseRes.data.data);

      // Fetch theory materials
      const theoryRes = await apiGetMaterials({
        course_id: params.id,
        category: "theory",
        authToken: token,
      });
      if (theoryRes.ok) {
        setTheoryMaterials(theoryRes.data.data || []);
      }

      // Fetch lab materials
      const labRes = await apiGetMaterials({
        course_id: params.id,
        category: "lab",
        authToken: token,
      });
      if (labRes.ok) {
        setLabMaterials(labRes.data.data || []);
      }

      setLoading(false);
    }

    if (user && token) {
      fetchData();
    }
  }, [user, token, params.id]);

  const handleDownload = async (material: Material) => {
    if (!token) return;
    
    const res = await apiTrackDownload(material.material_id, token);
    if (res.ok && res.data.data.file_url) {
      window.open(res.data.data.file_url, '_blank');
    } else {
      toast.error("Failed to download material");
    }
  };

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
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/courses">
                      Courses
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{course?.code || "Course"}</BreadcrumbPage>
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading course details...
            </div>
          ) : !course ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Course not found</p>
              <Link href="/courses">
                <Button className="mt-4">Back to Courses</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Course Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl">{course.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{course.code}</Badge>
                        {course.department_name && (
                          <Badge variant="outline">{course.department_name}</Badge>
                        )}
                        {course.semester && (
                          <Badge variant="outline">
                            {course.semester} {course.year}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {course.description && (
                  <CardContent>
                    <p className="text-muted-foreground">{course.description}</p>
                  </CardContent>
                )}
              </Card>

              {/* Materials Tabs */}
              <Tabs defaultValue="theory" className="w-full">
                <TabsList>
                  <TabsTrigger value="theory">
                    Theory Materials ({theoryMaterials.length})
                  </TabsTrigger>
                  <TabsTrigger value="lab">
                    Lab Materials ({labMaterials.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="theory" className="space-y-4">
                  {theoryMaterials.length === 0 ? (
                    <Card className="p-8">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No theory materials available</p>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {theoryMaterials.map((material) => (
                        <Card key={material.material_id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <h3 className="font-semibold">{material.title}</h3>
                                </div>
                                {material.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {material.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {material.week_number && (
                                    <span>Week {material.week_number}</span>
                                  )}
                                  {material.topic && <span>{material.topic}</span>}
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {material.view_count || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    {material.download_count || 0}
                                  </span>
                                </div>
                                {material.tags && material.tags.length > 0 && (
                                  <div className="flex gap-2">
                                    {material.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={() => handleDownload(material)}
                                size="sm"
                                variant="outline"
                                className="ml-4"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="lab" className="space-y-4">
                  {labMaterials.length === 0 ? (
                    <Card className="p-8">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No lab materials available</p>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {labMaterials.map((material) => (
                        <Card key={material.material_id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <h3 className="font-semibold">{material.title}</h3>
                                </div>
                                {material.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {material.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {material.week_number && (
                                    <span>Week {material.week_number}</span>
                                  )}
                                  {material.topic && <span>{material.topic}</span>}
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {material.view_count || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    {material.download_count || 0}
                                  </span>
                                </div>
                                {material.tags && material.tags.length > 0 && (
                                  <div className="flex gap-2">
                                    {material.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={() => handleDownload(material)}
                                size="sm"
                                variant="outline"
                                className="ml-4"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
