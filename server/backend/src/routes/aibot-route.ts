import { Router } from "express";
import { generateTextFromImage } from "../controllers/aibot-controller";
import { uploadFilesMiddleware } from "../middleware/upload-middleware";

const router = Router();

// POST /generate-from-image - Upload image and generate text description
router.post("/generate-from-image", uploadFilesMiddleware, generateTextFromImage);

export default router;
