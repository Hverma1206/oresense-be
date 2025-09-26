import { Router } from 'express';
import lcaController from '../controllers/lcaController.js';
const router = Router();

router.post('/suggest-parameters', lcaController.suggestParameters);
router.post('/generate-recommendations', lcaController.generateRecommendations);

export default router;