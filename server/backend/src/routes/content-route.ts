import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware';
import { 
  generateEnhancedContent, 
  generatePDF 
} from '../controllers/content-controller';

const content_router = Router();

/**
 * @route POST /api/content/generate-enhanced
 * @desc Generate enhanced content with semantic search + AI + online research
 * @access Private
 */
content_router.post('/generate-enhanced', authMiddleware, generateEnhancedContent);

/**
 * @route POST /api/content/generate-pdf
 * @desc Generate PDF from course materials and user prompt
 * @access Private
 */
content_router.post('/generate-pdf', authMiddleware, generatePDF);

export default content_router;
