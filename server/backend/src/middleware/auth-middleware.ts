import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { ApiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/asyncHandler";

export const authMiddleware = asyncHandler(async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json(new ApiResponse(401, null, "Unauthorized request"));
    }

    // Verify and decode the JWT
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    ) as { user_id: string; email: string; role: string };

    if (!decodedToken || !decodedToken.user_id) {
      return res.status(401).json(new ApiResponse(401, null, "Invalid access token"));
    }

    // Fetch the user from the database
    const [user] = await db
      .select({
        user_id: usersTable.user_id,
        email: usersTable.email,
        full_name: usersTable.full_name,
        role: usersTable.role,
        avatar_url: usersTable.avatar_url,
        is_active: usersTable.is_active,
      })
      .from(usersTable)
      .where(eq(usersTable.user_id, decodedToken.user_id))
      .limit(1);
      
    if (!user) {
      return res.status(401).json(new ApiResponse(401, null, "User not found"));
    }

    if (!user.is_active) {
      return res.status(403).json(new ApiResponse(403, null, "Account is inactive"));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json(new ApiResponse(401, null, "Token has expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json(new ApiResponse(401, null, "Invalid token"));
    }
    console.error("Auth middleware error:", error);
    return res.status(401).json(new ApiResponse(401, null, "Unauthorized request"));
  }
});

// Export as verifyJWT for backward compatibility
export const verifyJWT = authMiddleware;
