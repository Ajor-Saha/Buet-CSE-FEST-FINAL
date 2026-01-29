import { Router } from 'express';
import { ragChat } from '../controllers/rag-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// RAG chatbot - semantic search + answer generation
router.post('/chat', ragChat);

export default router;
