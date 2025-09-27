import { Router } from 'express';
import lcaController from '../controllers/lcaController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = Router();

// AI analysis endpoints
router.post('/suggest-parameters', lcaController.suggestParameters);
router.post('/generate-recommendations', lcaController.generateRecommendations);
router.post('/node-insights', lcaController.getNodeInsights); // New endpoint for dynamic node insights

// Report management endpoints
router.get('/reports', lcaController.getReports);
router.get('/reports/:id', lcaController.getReportById);
router.put('/reports/:id', protect, lcaController.updateReport); // Protected route
router.delete('/reports/:id', protect, lcaController.deleteReport); // Protected route

export default router;