import { Router } from 'express';
import { generateServices, getServices, getServicesById, downloadPresentation, deleteServices, regenerateWithFeedback, generateEnhancedPresentation, downloadEnhancedPresentation, generateGoogleSlidesPresentation, downloadGoogleSlidesPresentation, convertGraphicsFolder } from '../controllers/servicesController';
import { authenticateToken } from '../middleware/auth';
import { validateServices } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

router.post('/generate', validateServices.create, generateServices);
router.post('/:servicesId/regenerate', regenerateWithFeedback);
router.post('/:servicesId/enhance-presentation', generateEnhancedPresentation);
router.post('/:servicesId/google-slides', generateGoogleSlidesPresentation);
router.post('/:servicesId/convert-graphics', convertGraphicsFolder);
router.get('/case/:caseId', getServices);
router.get('/:servicesId', getServicesById);
router.get('/:servicesId/presentation', downloadPresentation);
router.get('/:servicesId/enhanced-presentation', downloadEnhancedPresentation);
router.get('/:servicesId/google-slides-download', downloadGoogleSlidesPresentation);
router.delete('/:servicesId', deleteServices);

export default router;