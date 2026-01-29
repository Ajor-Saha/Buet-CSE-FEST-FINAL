import express from 'express';
import { parseFromUrl, extractTextOnly } from '../controllers/pdf-parser-controller';
import { authMiddleware } from '../middleware/auth-middleware';
import { uploadFilesMiddleware } from '../middleware/upload-middleware';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Parse material from uploaded file URL and store chunks for RAG
 * POST /api/pdf-parser/parse-from-url
 * Body: { material_id: string, file_url: string }
 */
router.post('/parse-from-url', parseFromUrl);

/**
 * Extract text only (faster, for file uploads - backward compatibility)
 * POST /api/pdf-parser/extract-text
 */
router.post('/extract-text', uploadFilesMiddleware, extractTextOnly);

export default router;
