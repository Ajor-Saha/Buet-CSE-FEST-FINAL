import express from 'express';
import { 
  uploadMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  browseByCategory,
  getMaterialsByWeek,
  trackDownload
} from '../controllers/materials-controller';
import { authMiddleware } from '../middleware/auth-middleware';
import { uploadFilesMiddleware } from '../middleware/upload-middleware';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Upload material (Admin only)
router.post('/upload', uploadFilesMiddleware, uploadMaterial);

// Get all materials with filters
router.get('/', getMaterials);

// Browse by category (theory/lab)
router.get('/browse/:category', browseByCategory);

// Get materials by week
router.get('/week/:week_number', getMaterialsByWeek);

// Get material by ID
router.get('/:id', getMaterialById);

// Update material (Admin only)
router.put('/:id', updateMaterial);

// Delete material (Admin only)
router.delete('/:id', deleteMaterial);

// Track download
router.post('/:id/download', trackDownload);

export default router;
