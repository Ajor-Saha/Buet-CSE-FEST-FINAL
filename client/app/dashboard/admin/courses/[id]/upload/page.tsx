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
import { ArrowLeft, Upload, FileText, GraduationCap, FlaskConical } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { apiGetCourseById, type Course } from "@/lib/courses-api";
import { apiUploadMaterial } from "@/lib/materials-api";
import { apiParseFromUrl } from "@/lib/pdf-parser-api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UploadMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { user, token, hydrateDone } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"theory" | "lab">("theory");

  const [materialForm, setMaterialForm] = useState({
    file: null as File | null,
    title: "",
    description: "",
    material_type: "slides",
    week_number: 1,
    topic: "",
    tags: "",
  });

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
    async function fetchCourse() {
      if (!token || !courseId) return;
      
      setLoading(true);
      const res = await apiGetCourseById(courseId, token);
      
      if (!res.ok) {
        toast.error("Failed to load course");
        setLoading(false);
        return;
      }

      setCourse(res.data.data);
      setLoading(false);
    }

    if (user && token && user.role === "admin") {
      fetchCourse();
    }
  }, [user, token, courseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMaterialForm({ ...materialForm, file: e.target.files[0] });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !materialForm.file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", materialForm.file);
    formData.append("course_id", courseId);
    formData.append("category", activeCategory);
    // Backend expects `content_type` for material type
    formData.append("content_type", materialForm.material_type);
    // Keep material_type for compatibility (if backend accepts it later)
    formData.append("material_type", materialForm.material_type);
    formData.append("title", materialForm.title);
    formData.append("description", materialForm.description);
    formData.append("week_number", materialForm.week_number.toString());
    formData.append("topic", materialForm.topic);
    if (materialForm.tags) {
      const tags = materialForm.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);
      formData.append("tags", JSON.stringify(tags));
    }

    const res = await apiUploadMaterial(formData, token);

    if (!res.ok) {
      toast.error(res.message || "Failed to upload material");
      setUploading(false);
      return;
    }

    const materialId = res.data.data?.material_id;
    const fileUrl = res.data.data?.file_info?.file_url;

    toast.success("Material uploaded. Starting parser...");
    setParsing(true);

    if (materialId && fileUrl) {
      const parseRes = await apiParseFromUrl(
        { material_id: materialId, file_url: fileUrl },
        token
      );

      if (!parseRes.ok) {
        toast.error(parseRes.message || "Failed to parse PDF");
      } else {
        toast.success("PDF parsed and indexed");
      }
    } else {
      toast.error("Missing material_id or file_url from upload response");
    }

    setUploading(false);
    setParsing(false);
    // Reset form
    setMaterialForm({
      file: null,
      title: "",
      description: "",
      material_type: "slides",
      week_number: 1,
      topic: "",
      tags: "",
    });
    // Reset file input
    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

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
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={`/courses/${courseId}`}>
                      {course.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Upload Material</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
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
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
          {/* Course Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{course.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{course.code}</span>
                {course.has_theory && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    Theory
                  </span>
                )}
                {course.has_lab && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" />
                    Lab
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Course Material
              </CardTitle>
              <CardDescription>
                Upload theory or lab materials for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as "theory" | "lab")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="theory" disabled={!course.has_theory}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Theory
                  </TabsTrigger>
                  <TabsTrigger value="lab" disabled={!course.has_lab}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Lab
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeCategory}>
                  <form onSubmit={handleUpload} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="file">File *</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload PDF, slides, code files, or other materials
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Introduction to Data Structures"
                        value={materialForm.title}
                        onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the material..."
                        value={materialForm.description}
                        onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="material_type">Material Type *</Label>
                        <Select
                          value={materialForm.material_type}
                          onValueChange={(value) => setMaterialForm({ ...materialForm, material_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slides">Slides</SelectItem>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="code">Code File</SelectItem>
                            <SelectItem value="notes">Notes</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="week_number">Week Number</Label>
                        <Input
                          id="week_number"
                          type="number"
                          min="1"
                          max={course.total_weeks}
                          value={materialForm.week_number}
                          onChange={(e) => setMaterialForm({ ...materialForm, week_number: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Arrays, Linked Lists"
                        value={materialForm.topic}
                        onChange={(e) => setMaterialForm({ ...materialForm, topic: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="comma,separated,tags"
                        value={materialForm.tags}
                        onChange={(e) => setMaterialForm({ ...materialForm, tags: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple tags with commas
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={uploading || parsing || !materialForm.file}
                    >
                      {uploading ? (
                        <>Uploading...</>
                      ) : parsing ? (
                        <>Parsing PDF...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Material
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
