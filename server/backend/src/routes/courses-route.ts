import express from 'express';
import { 
  createCourse,
  getCourses,
  getCourseById,
  enrollInCourse,
  getMyEnrolledCourses,
  updateCourse
} from '../controllers/courses-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create course (Admin only)
router.post('/', createCourse);

// Get all courses
router.get('/', getCourses);

// Get my enrolled courses
router.get('/my-courses', getMyEnrolledCourses);

// Get course by ID
router.get('/:id', getCourseById);

// Enroll in course
router.post('/:id/enroll', enrollInCourse);

// Update course (Admin only)
router.put('/:id', updateCourse);

export default router;
