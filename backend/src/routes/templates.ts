import { Router } from 'express';
import { 
  getAvailableTemplates, 
  uploadFirmTemplate, 
  uploadFirmLogo, 
  previewTemplate,
  generateTemplatePreview,
  downloadTemplatePreview
} from '../controllers/templateController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get all available templates
router.get('/', getAvailableTemplates);

// Upload custom firm template
router.post('/upload', uploadFirmTemplate);

// Upload firm logo
router.post('/logo', uploadFirmLogo);

// Preview specific template
router.get('/:templateId/preview', previewTemplate);

// Generate template preview presentation
router.post('/:templateId/generate-preview', generateTemplatePreview);

// Download template preview
router.get('/preview-download/:filename', downloadTemplatePreview);

export default router;