import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { usersTable } from '../db/schema/users';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';
import { createR2Client } from '../utils/upload-r2';

/**
 * Sign up a new user
 * @route POST /api/auth/signup
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, role = 'student' } = req.body;

    // Validate required fields
    if ([full_name, email, password].some(field => !field || field.trim() === '')) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, 'Full name, email, and password are required'));
    }

    // Validate role
    if (role !== 'admin' && role !== 'student') {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, 'Role must be either "admin" or "student"'));
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, 'User already exists with this email'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        full_name: full_name.trim(),
        role: role,
        is_active: true,
      })
      .returning({
        user_id: usersTable.user_id,
        email: usersTable.email,
        full_name: usersTable.full_name,
        role: usersTable.role,
        created_at: usersTable.created_at,
      });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newUser,
          'User registered successfully'
        )
      );
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if ([email, password].some(field => !field || field.trim() === '')) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, 'Email and password are required'));
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, 'Invalid email or password'));
    }

    // Check if user is active
    if (!user.is_active) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, 'Account is inactive. Please contact support.'));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, 'Invalid email or password'));
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      { 
        user_id: user.user_id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
      path: '/',
    };

    // Set the access token as a cookie
    res.cookie('accessToken', accessToken, cookieOptions);

    // Return user data (excluding password)
    const userData = {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };

    return res.status(200).json({
      success: true,
      data: userData,
      accessToken: accessToken,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Logout user
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Cookie clearing options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
      path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);

    return res.status(200).json(new ApiResponse(200, {}, 'Logout successful'));
  } catch (error) {
    console.error('Logout error:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const [user] = await db
      .select({
        user_id: usersTable.user_id,
        email: usersTable.email,
        full_name: usersTable.full_name,
        role: usersTable.role,
        avatar_url: usersTable.avatar_url,
        is_active: usersTable.is_active,
        created_at: usersTable.created_at,
      })
      .from(usersTable)
      .where(eq(usersTable.user_id, req.user.user_id))
      .limit(1);

    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, 'User not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, 'User profile retrieved successfully'));
  } catch (error) {
    console.error('Error getting current user:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
});

/**
 * Update profile picture
 * @route PUT /api/auth/profile-picture
 */
export const updateProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const file = req.avatar;

      if (!file || !file.filepath) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'No file uploaded or invalid file'));
      }

      // Create R2 client (S3-compatible client)
      const r2 = createR2Client();

      // Retrieve existing user from the database
      const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.user_id, req.user.user_id))
        .limit(1);

      if (!existingUser) {
        return res.status(404).json(new ApiResponse(404, {}, 'User not found'));
      }

      // Delete previous profile picture from R2 if it exists
      if (existingUser.avatar_url) {
        const currentImageKey = existingUser.avatar_url.replace(
          `${process.env.PUBLIC_ACCESS_URL}/`,
          ''
        );
        if (currentImageKey) {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.BUCKET_NAME!,
              Key: currentImageKey,
            })
          );
        }
      }

      // Read the file from the temporary path
      const buffer = await fs.readFile(file.filepath);
      const uniqueFileName = `avatars/${nanoid()}-${encodeURIComponent(
        file.originalFilename || 'avatar'
      )}`;

      // Upload new profile picture to R2
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

      // Construct new profile picture URL
      const profileUrl = `${process.env.PUBLIC_ACCESS_URL}/${uniqueFileName}`;

      // Update the user record in the database
      const [updatedUser] = await db
        .update(usersTable)
        .set({ avatar_url: profileUrl })
        .where(eq(usersTable.user_id, req.user.user_id))
        .returning({
          user_id: usersTable.user_id,
          email: usersTable.email,
          full_name: usersTable.full_name,
          role: usersTable.role,
          avatar_url: usersTable.avatar_url,
        });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedUser,
            'Profile picture updated successfully'
          )
        );
    } catch (error) {
      console.error('Error updating profile picture:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Change password (requires current password)
 * @route PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'Current password and new password are required'
            )
          );
      }

      // Get user from database
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.user_id, req.user.user_id))
        .limit(1);

      if (!user) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'User not found'));
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Current password is incorrect'));
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      await db
        .update(usersTable)
        .set({ password_hash: hashedPassword })
        .where(eq(usersTable.user_id, req.user.user_id));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password updated successfully'));
    } catch (error) {
      console.error('Error updating password:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Error updating password'));
    }
  }
);

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const { full_name } = req.body;

      // Validate required fields
      if (!full_name || full_name.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Full name is required'));
      }

      // Update the user's profile
      const [updatedUser] = await db
        .update(usersTable)
        .set({ full_name: full_name.trim() })
        .where(eq(usersTable.user_id, req.user.user_id))
        .returning({
          user_id: usersTable.user_id,
          email: usersTable.email,
          full_name: usersTable.full_name,
          role: usersTable.role,
          avatar_url: usersTable.avatar_url,
        });

      return res.status(200).json(
        new ApiResponse(200, updatedUser, 'Profile updated successfully')
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Error updating profile'));
    }
  }
);
