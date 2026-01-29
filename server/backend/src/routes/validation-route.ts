import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware';
import { validateCode, validateText } from '../controllers/validation-controller';

const validation_router = Router();

/**
 * @route POST /api/validation/validate-code
 * @desc Validate AI-generated code with compilation check and AI evaluation
 * @access Private
 */
validation_router.post('/validate-code', authMiddleware, validateCode);

/**
 * @route POST /api/validation/validate-text
 * @desc Validate AI-generated text content with AI evaluation
 * @access Private
 */
validation_router.post('/validate-text', authMiddleware, validateText);

export default validation_router;
