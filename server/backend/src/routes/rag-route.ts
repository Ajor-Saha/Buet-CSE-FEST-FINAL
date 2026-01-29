import { Router } from 'express';
import { 
  processAndIndexMaterial,
  ragChat
} from '../controllers/rag-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// API 1: Process, parse, chunk (20% overlap), embed, and index in Pinecone
router.post('/process-and-index', processAndIndexMaterial);

// API 2: RAG chatbot - semantic search + answer generation
router.post('/chat', ragChat);

export default router;
