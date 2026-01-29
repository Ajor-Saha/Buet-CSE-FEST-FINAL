import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { and, eq, ilike, or, inArray } from 'drizzle-orm';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { materialsTable, coursesTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';
import { createR2Client } from '../utils/upload-r2';

/**
 * Upload course material (Admin only)
 * @route POST /api/materials/upload
 */
export const uploadMaterial = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json(new ApiResponse(403, {}, 'Only admins can upload materials'));
    }

    const { 
      course_id, 
      title, 
      description, 
      category, 
      content_type,
      week_number,
      topic,
      tags,
      programming_language 
    } = req.body;

    const file = (req as any).file;

    // Validate required fields
    if (!course_id || !title || !category || !content_type || !file || !file.filepath) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Course ID, title, category, content type, and file are required')
      );
    }

    // Validate category
    if (category !== 'theory' && category !== 'lab') {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Category must be either "theory" or "lab"')
      );
    }

    // Verify course exists
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.course_id, course_id))
      .limit(1);

    if (!course) {
      return res.status(404).json(new ApiResponse(404, {}, 'Course not found'));
    }

    // Create R2 client for file upload
    const r2 = createR2Client();

    // Read the file from the temporary path
    const buffer = await fs.readFile(file.filepath);
    const fileExtension = file.originalFilename?.split('.').pop() || 'bin';
    const uniqueFileName = `materials/${category}/${course_id}/${nanoid()}.${fileExtension}`;

    // Get file stats
    const fileStats = await fs.stat(file.filepath);

    // Upload file to R2/S3
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      })
    );

    // Clean up the temporary file
    await fs.unlink(file.filepath);

    // Construct file URL
    const fileUrl = `${process.env.PUBLIC_ACCESS_URL}/${uniqueFileName}`;

    // Parse tags if provided as string
    let tagsArray: string[] = [];
    if (tags) {
      tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Insert material into database
    const [newMaterial] = await db
      .insert(materialsTable)
      .values({
        course_id,
        title: title.trim(),
        description: description?.trim(),
        category,
        material_type: content_type,
        file_url: fileUrl,
        file_name: file.originalname,
        file_size: fileStats.size,
        mime_type: file.mimetype,
        week_number: week_number ? parseInt(week_number) : undefined,
        topic: topic?.trim(),
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        uploaded_by: req.user.user_id,
        view_count: 0,
        download_count: 0,
      })
      .returning();

    return res.status(201).json(
      new ApiResponse(201, newMaterial, 'Material uploaded successfully')
    );
  } catch (error) {
    console.error('Error uploading material:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Get all materials with filters
 * @route GET /api/materials
 */
export const getMaterials = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { 
      course_id, 
      category, 
      week_number, 
      topic, 
      content_type,
      tags,
      search 
    } = req.query;

    // Build filter conditions
    const conditions: any[] = [];

    if (course_id) {
      conditions.push(eq(materialsTable.course_id, course_id as string));
    }

    if (category) {
      conditions.push(eq(materialsTable.category, category as string));
    }

    if (week_number) {
      conditions.push(eq(materialsTable.week_number, parseInt(week_number as string)));
    }

    if (topic) {
      conditions.push(ilike(materialsTable.topic, `%${topic}%`));
    }

    if (content_type) {
      conditions.push(eq(materialsTable.material_type, content_type as string));
    }

    // Search in title and description
    if (search) {
      conditions.push(
        or(
          ilike(materialsTable.title, `%${search}%`),
          ilike(materialsTable.description, `%${search}%`)
        )
      );
    }

    // Query materials with course info
    const materials = await db
      .select({
        material_id: materialsTable.material_id,
        course_id: materialsTable.course_id,
        course_name: coursesTable.name,
        course_code: coursesTable.code,
        title: materialsTable.title,
        description: materialsTable.description,
        category: materialsTable.category,
        material_type: materialsTable.material_type,
        file_url: materialsTable.file_url,
        file_name: materialsTable.file_name,
        file_size: materialsTable.file_size,
        mime_type: materialsTable.mime_type,
        week_number: materialsTable.week_number,
        topic: materialsTable.topic,
        tags: materialsTable.tags,
        view_count: materialsTable.view_count,
        download_count: materialsTable.download_count,
        uploaded_at: materialsTable.uploaded_at,
      })
      .from(materialsTable)
      .leftJoin(coursesTable, eq(materialsTable.course_id, coursesTable.course_id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(materialsTable.uploaded_at);

    return res.status(200).json(
      new ApiResponse(200, materials, 'Materials retrieved successfully')
    );
  } catch (error) {
    console.error('Error getting materials:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Get material by ID
 * @route GET /api/materials/:id
 */
export const getMaterialById = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { id } = req.params;

    const [material] = await db
      .select({
        material_id: materialsTable.material_id,
        course_id: materialsTable.course_id,
        course_name: coursesTable.name,
        course_code: coursesTable.code,
        title: materialsTable.title,
        description: materialsTable.description,
        category: materialsTable.category,
        material_type: materialsTable.material_type,
        file_url: materialsTable.file_url,
        file_name: materialsTable.file_name,
        file_size: materialsTable.file_size,
        mime_type: materialsTable.mime_type,
        week_number: materialsTable.week_number,
        topic: materialsTable.topic,
        tags: materialsTable.tags,
        view_count: materialsTable.view_count,
        download_count: materialsTable.download_count,
        uploaded_at: materialsTable.uploaded_at,
      })
      .from(materialsTable)
      .leftJoin(coursesTable, eq(materialsTable.course_id, coursesTable.course_id))
      .where(eq(materialsTable.material_id, id))
      .limit(1);

    if (!material) {
      return res.status(404).json(new ApiResponse(404, {}, 'Material not found'));
    }

    // Increment view count
    await db
      .update(materialsTable)
      .set({ view_count: (material.view_count || 0) + 1 })
      .where(eq(materialsTable.material_id, id));

    return res.status(200).json(
      new ApiResponse(200, material, 'Material retrieved successfully')
    );
  } catch (error) {
    console.error('Error getting material:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Update material metadata (Admin only)
 * @route PUT /api/materials/:id
 */
export const updateMaterial = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json(
        new ApiResponse(403, {}, 'Only admins can update materials')
      );
    }

    const { id } = req.params;
    const {
      title,
      description,
      category,
      week_number,
      topic,
      tags,
      programming_language,
      is_public,
    } = req.body;

    // Check if material exists
    const [existingMaterial] = await db
      .select()
      .from(materialsTable)
      .where(eq(materialsTable.material_id, id))
      .limit(1);

    if (!existingMaterial) {
      return res.status(404).json(new ApiResponse(404, {}, 'Material not found'));
    }

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (category) updateData.category = category;
    if (week_number !== undefined) updateData.week_number = parseInt(week_number);
    if (topic !== undefined) updateData.topic = topic?.trim();
    if (tags !== undefined) {
      updateData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    if (programming_language !== undefined) {
      updateData.programming_language = programming_language?.trim();
    }
    if (is_public !== undefined) updateData.is_public = is_public;

    // Update material
    const [updatedMaterial] = await db
      .update(materialsTable)
      .set(updateData)
      .where(eq(materialsTable.material_id, id))
      .returning();

    return res.status(200).json(
      new ApiResponse(200, updatedMaterial, 'Material updated successfully')
    );
  } catch (error) {
    console.error('Error updating material:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Delete material (Admin only)
 * @route DELETE /api/materials/:id
 */
export const deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json(
        new ApiResponse(403, {}, 'Only admins can delete materials')
      );
    }

    const { id } = req.params;

    // Get material to delete file from storage
    const [material] = await db
      .select()
      .from(materialsTable)
      .where(eq(materialsTable.material_id, id))
      .limit(1);

    if (!material) {
      return res.status(404).json(new ApiResponse(404, {}, 'Material not found'));
    }

    // Delete file from R2/S3
    if (material.file_url) {
      const r2 = createR2Client();
      const fileKey = material.file_url.replace(`${process.env.PUBLIC_ACCESS_URL}/`, '');
      
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: fileKey,
        })
      );
    }

    // Delete material from database
    await db
      .delete(materialsTable)
      .where(eq(materialsTable.material_id, id));

    return res.status(200).json(
      new ApiResponse(200, {}, 'Material deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Browse materials by category (Theory/Lab)
 * @route GET /api/materials/browse/:category
 */
export const browseByCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { category } = req.params;
    const { course_id } = req.query;

    if (category !== 'theory' && category !== 'lab') {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Category must be either "theory" or "lab"')
      );
    }

    const conditions = [eq(materialsTable.category, category)];
    if (course_id) {
      conditions.push(eq(materialsTable.course_id, course_id as string));
    }

    const materials = await db
      .select({
        material_id: materialsTable.material_id,
        course_id: materialsTable.course_id,
        course_name: coursesTable.name,
        course_code: coursesTable.code,
        title: materialsTable.title,
        description: materialsTable.description,
        category: materialsTable.category,
        material_type: materialsTable.material_type,
        week_number: materialsTable.week_number,
        topic: materialsTable.topic,
        tags: materialsTable.tags,
        view_count: materialsTable.view_count,
        uploaded_at: materialsTable.uploaded_at,
      })
      .from(materialsTable)
      .leftJoin(coursesTable, eq(materialsTable.course_id, coursesTable.course_id))
      .where(and(...conditions))
      .orderBy(materialsTable.week_number, materialsTable.uploaded_at);

    return res.status(200).json(
      new ApiResponse(200, materials, `${category} materials retrieved successfully`)
    );
  } catch (error) {
    console.error('Error browsing materials:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Get materials by week
 * @route GET /api/materials/week/:week_number
 */
export const getMaterialsByWeek = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { week_number } = req.params;
    const { course_id } = req.query;

    const conditions = [eq(materialsTable.week_number, parseInt(week_number))];
    if (course_id) {
      conditions.push(eq(materialsTable.course_id, course_id as string));
    }

    const materials = await db
      .select({
        material_id: materialsTable.material_id,
        course_id: materialsTable.course_id,
        course_name: coursesTable.name,
        title: materialsTable.title,
        description: materialsTable.description,
        category: materialsTable.category,
        material_type: materialsTable.material_type,
        topic: materialsTable.topic,
        tags: materialsTable.tags,
        file_url: materialsTable.file_url,
        uploaded_at: materialsTable.uploaded_at,
      })
      .from(materialsTable)
      .leftJoin(coursesTable, eq(materialsTable.course_id, coursesTable.course_id))
      .where(and(...conditions))
      .orderBy(materialsTable.category, materialsTable.uploaded_at);

    return res.status(200).json(
      new ApiResponse(200, materials, `Week ${week_number} materials retrieved successfully`)
    );
  } catch (error) {
    console.error('Error getting materials by week:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Increment download count
 * @route POST /api/materials/:id/download
 */
export const trackDownload = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { id } = req.params;

    const [material] = await db
      .select()
      .from(materialsTable)
      .where(eq(materialsTable.material_id, id))
      .limit(1);

    if (!material) {
      return res.status(404).json(new ApiResponse(404, {}, 'Material not found'));
    }

    // Increment download count
    await db
      .update(materialsTable)
      .set({ download_count: (material.download_count || 0) + 1 })
      .where(eq(materialsTable.material_id, id));

    return res.status(200).json(
      new ApiResponse(200, { file_url: material.file_url }, 'Download tracked')
    );
  } catch (error) {
    console.error('Error tracking download:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});
