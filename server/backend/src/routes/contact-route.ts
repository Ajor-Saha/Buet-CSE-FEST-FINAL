import { Router } from "express";
import { parseContact, healthCheck } from "../controllers/contact-controller";

const router = Router();

// POST /parse - Parse contact information
router.post("/parse", parseContact);

// GET /health - Health check
router.get("/health", healthCheck);

export default router;
