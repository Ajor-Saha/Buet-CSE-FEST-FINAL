import { Router } from 'express';
import { 
  generateEmbeddings, 
  semanticSearch, 
  ragChat,
  codeSearch 
} from '../controllers/rag-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Generate embeddings for material chunks
router.post('/generate-embeddings', generateEmbeddings);

// Semantic search across materials
router.post('/semantic-search', semanticSearch);

// RAG-based chatbot
router.post('/chat', ragChat);

// Syntax-aware code search
router.post('/code-search', codeSearch);

export default router;
