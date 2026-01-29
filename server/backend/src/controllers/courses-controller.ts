import { eq, and } from 'drizzle-orm';
import { Request, Response } from 'express';
import { db } from '../db';
import { 
  coursesTable, 
  enrollmentsTable,
  departmentsTable
} from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Create a new course (Admin only)
 * @route POST /api/courses
 */
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json(
        new ApiResponse(403, {}, 'Only admins can create courses')
      );
    }

    const { 
      code, 
      name, 
      description, 
      department_id, 
      semester, 
      year,
      has_theory,
      has_lab,
      total_weeks
    } = req.body;

    // Validate required fields
    if (!code || !name) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Course code and name are required')
      );
    }

    // Validate that course has at least theory or lab
    const hasTheory = has_theory !== false; // Default to true
    const hasLab = has_lab === true; // Default to false
    
    if (!hasTheory && !hasLab) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Course must have at least Theory or Lab component')
      );
    }

    // Check if department exists
    if (department_id) {
      const [dept] = await db
        .select()
        .from(departmentsTable)
        .where(eq(departmentsTable.department_id, department_id))
        .limit(1);

      if (!dept) {
        return res.status(404).json(new ApiResponse(404, {}, 'Department not found'));
      }
    }

    // Check if course code already exists
    const [existingCourse] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.code, code.toUpperCase()))
      .limit(1);

    if (existingCourse) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Course with this code already exists')
      );
    }

    // Create course
    const [newCourse] = await db
      .insert(coursesTable)
      .values({
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description?.trim(),
        department_id,
        semester: semester?.trim(),
        year: year ? parseInt(year) : undefined,
        has_theory: hasTheory,
        has_lab: hasLab,
        total_weeks: total_weeks ? parseInt(total_weeks) : 16,
        created_by: req.user.user_id,
        is_active: true,
      })
      .returning();

    return res.status(201).json(
      new ApiResponse(201, newCourse, 'Course created successfully')
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Get all courses
 * @route GET /api/courses
 */
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { department_id, semester, year } = req.query;

    const conditions: any[] = [eq(coursesTable.is_active, true)];

    if (department_id) {
      conditions.push(eq(coursesTable.department_id, department_id as string));
    }
    if (semester) {
      conditions.push(eq(coursesTable.semester, semester as string));
    }
    if (year) {
      conditions.push(eq(coursesTable.year, parseInt(year as string)));
    }

    const courses = await db
      .select({
        course_id: coursesTable.course_id,
        code: coursesTable.code,
        name: coursesTable.name,
        description: coursesTable.description,
        department_id: coursesTable.department_id,
        department_name: departmentsTable.name,
        department_code: departmentsTable.code,
        semester: coursesTable.semester,
        year: coursesTable.year,
        is_active: coursesTable.is_active,
        created_at: coursesTable.created_at,
      })
      .from(coursesTable)
      .leftJoin(departmentsTable, eq(coursesTable.department_id, departmentsTable.department_id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(coursesTable.created_at);

    return res.status(200).json(
      new ApiResponse(200, courses, 'Courses retrieved successfully')
    );
  } catch (error) {
    console.error('Error getting courses:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Get course by ID
 * @route GET /api/courses/:id
 */
export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { id } = req.params;

    const [course] = await db
      .select({
        course_id: coursesTable.course_id,
        code: coursesTable.code,
        name: coursesTable.name,
        description: coursesTable.description,
        department_id: coursesTable.department_id,
        department_name: departmentsTable.name,
        department_code: departmentsTable.code,
        semester: coursesTable.semester,
        year: coursesTable.year,
        is_active: coursesTable.is_active,
        created_at: coursesTable.created_at,
      })
      .from(coursesTable)
      .leftJoin(departmentsTable, eq(coursesTable.department_id, departmentsTable.department_id))
      .where(eq(coursesTable.course_id, id))
      .limit(1);

    if (!course) {
      return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
    }

    return res.status(200).json(
      new ApiResponse(200, course, 'Course retrieved successfully')
    );
  } catch (error) {
    console.error('Error getting course:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Enroll student in a course
 * @route POST /api/courses/:id/enroll
 */
export const enrollInCourse = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { id } = req.params;

    // Check if course exists
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.course_id, id))
      .limit(1);

    if (!course) {
      return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
    }

    // Check if already enrolled
    const [existingEnrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.course_id, id),
          eq(enrollmentsTable.user_id, req.user.user_id)
        )
      )
      .limit(1);

    if (existingEnrollment) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Already enrolled in this course')
      );
    }

    // Enroll student
    const [enrollment] = await db
      .insert(enrollmentsTable)
      .values({
        course_id: id,
        user_id: req.user.user_id,
      })
      .returning();

    return res.status(201).json(
      new ApiResponse(201, enrollment, 'Enrolled successfully')
    );
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Get enrolled courses for current user
 * @route GET /api/courses/my-courses
 */
export const getMyEnrolledCourses = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const enrolledCourses = await db
      .select({
        enrollment_id: enrollmentsTable.enrollment_id,
        course_id: coursesTable.course_id,
        code: coursesTable.code,
        name: coursesTable.name,
        description: coursesTable.description,
        department_name: departmentsTable.name,
        semester: coursesTable.semester,
        year: coursesTable.year,
        enrolled_at: enrollmentsTable.enrolled_at,
      })
      .from(enrollmentsTable)
      .innerJoin(coursesTable, eq(enrollmentsTable.course_id, coursesTable.course_id))
      .leftJoin(departmentsTable, eq(coursesTable.department_id, departmentsTable.department_id))
      .where(eq(enrollmentsTable.user_id, req.user.user_id))
      .orderBy(enrollmentsTable.enrolled_at);

    return res.status(200).json(
      new ApiResponse(200, enrolledCourses, 'Enrolled courses retrieved successfully')
    );
  } catch (error) {
    console.error('Error getting enrolled courses:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Update course (Admin only)
 * @route PUT /api/courses/:id
 */
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json(
        new ApiResponse(403, {}, 'Only admins can update courses')
      );
    }

    const { id } = req.params;
    const { name, description, semester, year, is_active } = req.body;

    // Check if course exists
    const [existingCourse] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.course_id, id))
      .limit(1);

    if (!existingCourse) {
      return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (semester !== undefined) updateData.semester = semester?.trim();
    if (year !== undefined) updateData.year = parseInt(year);
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // Handle theory/lab structure updates
    const { has_theory, has_lab, total_weeks } = req.body;
    if (has_theory !== undefined) updateData.has_theory = has_theory;
    if (has_lab !== undefined) updateData.has_lab = has_lab;
    if (total_weeks !== undefined) updateData.total_weeks = parseInt(total_weeks);

    // Update course
    const [updatedCourse] = await db
      .update(coursesTable)
      .set(updateData)
      .where(eq(coursesTable.course_id, id))
      .returning();

    return res.status(200).json(
      new ApiResponse(200, updatedCourse, 'Course updated successfully')
    );
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});
