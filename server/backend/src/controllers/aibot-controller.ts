import { Request, Response } from "express";
import * as fs from "node:fs";
import { asyncHandler } from "../utils/asyncHandler";
import { GoogleGenAI, Type } from "@google/genai";
import { ApiResponse } from "../utils/api-response";

// Initialize Gemini AI with API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate text from uploaded image using Gemini AI
 * @route POST /api/ai/generate-from-image
 * @access Public
 */
export const generateTextFromImage = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Check if file was uploaded
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return res.status(400).json(
          new ApiResponse(400, null, "No image file uploaded")
        );
      }

      // Get the uploaded file
      const imageFile = Array.isArray(req.files) ? req.files[0] : req.files;
      
      if (!imageFile || !imageFile.filepath) {
        return res.status(400).json(
          new ApiResponse(400, null, "Invalid file upload")
        );
      }

      // Get custom prompt from request body, default to "Caption this image."
      const prompt = req.body.prompt || "Caption this image.";

      // Read the image file and convert to base64
      const base64ImageFile = fs.readFileSync(imageFile.filepath, {
        encoding: "base64",
      });

      // Determine MIME type from the uploaded file
      const mimeType = imageFile.mimetype || "image/jpeg";

      // Prepare content for Gemini
      const contents = [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64ImageFile,
          },
        },
        { text: prompt },
      ];

      // Generate content using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: contents,
      });

      // Clean up the temporary file
      try {
        fs.unlinkSync(imageFile.filepath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }

      // Return the generated text
      return res.status(200).json(
        new ApiResponse(200, {
          generatedText: response.text,
          prompt: prompt,
          imageInfo: {
            originalFilename: imageFile.originalFilename,
            mimeType: mimeType,
            size: imageFile.size,
          },
        }, "Text generated successfully from image")
      );

    } catch (error: any) {
      console.error("Error generating text from image:", error);
      return res.status(500).json(
        new ApiResponse(500, null, error.message || "Failed to generate text from image")
      );
    }
  }
);

