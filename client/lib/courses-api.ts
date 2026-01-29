import { apiFetchJson } from "@/lib/api-client"

export type Course = {
  course_id: string
  code: string
  name: string
  description?: string | null
  department_id?: string | null
  department_name?: string | null
  department_code?: string | null
  semester?: string | null
  year?: number | null
  has_theory: boolean
  has_lab: boolean
  total_weeks: number
  is_active: boolean
  created_at: string
}

export type Enrollment = {
  enrollment_id: string
  course_id: string
  code: string
  name: string
  description?: string | null
  department_name?: string | null
  semester?: string | null
  year?: number | null
  enrolled_at: string
}

export type ApiResponse<T> = {
  statusCode?: number
  success?: boolean
  data: T
  message?: string
}

export async function apiGetCourses(params?: {
  department_id?: string
  semester?: string
  year?: number
  authToken?: string | null
}) {
  const searchParams = new URLSearchParams()
  if (params?.department_id) searchParams.set("department_id", params.department_id)
  if (params?.semester) searchParams.set("semester", params.semester)
  if (params?.year) searchParams.set("year", params.year.toString())

  const query = searchParams.toString()
  const path = `/api/courses${query ? `?${query}` : ""}`

  return apiFetchJson<ApiResponse<Course[]>>(path, {
    method: "GET",
    authToken: params?.authToken ?? null,
  })
}

export async function apiGetCourseById(courseId: string, authToken?: string | null) {
  return apiFetchJson<ApiResponse<Course>>(`/api/courses/${courseId}`, {
    method: "GET",
    authToken: authToken ?? null,
  })
}

export async function apiGetMyEnrolledCourses(authToken?: string | null) {
  return apiFetchJson<ApiResponse<Enrollment[]>>("/api/courses/my-courses", {
    method: "GET",
    authToken: authToken ?? null,
  })
}

export async function apiEnrollInCourse(courseId: string, authToken?: string | null) {
  return apiFetchJson<ApiResponse<{ enrollment_id: string; course_id: string; user_id: string }>>(`/api/courses/${courseId}/enroll`, {
    method: "POST",
    authToken: authToken ?? null,
  })
}

export async function apiCreateCourse(
  input: {
    code: string
    name: string
    description?: string
    department_id?: string
    semester?: string
    year?: number
    has_theory?: boolean
    has_lab?: boolean
    total_weeks?: number
  },
  authToken?: string | null
) {
  return apiFetchJson<ApiResponse<Course>>("/api/courses", {
    method: "POST",
    body: JSON.stringify(input),
    authToken: authToken ?? null,
  })
}

export async function apiUpdateCourse(
  courseId: string,
  input: {
    name?: string
    description?: string
    semester?: string
    year?: number
    has_theory?: boolean
    has_lab?: boolean
    total_weeks?: number
    is_active?: boolean
  },
  authToken?: string | null
) {
  return apiFetchJson<ApiResponse<Course>>(`/api/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(input),
    authToken: authToken ?? null,
  })
}
