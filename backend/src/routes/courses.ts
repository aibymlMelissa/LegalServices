import { Router } from 'express';
import multer from 'multer';
import { 
  getCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  exportCourse, 
  importCourse,
  generateCourseWithAI,
  uploadMaterials,
  searchMaterials,
  getRecommendedMaterials,
  getWorkflowStatus,
  cancelWorkflow
} from '../controllers/courseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: './teaching_materials/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/html',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`));
    }
  }
});

router.use(authenticateToken);

// Traditional course management
router.get('/', getCourses);
router.post('/', createCourse);
router.put('/:courseId', updateCourse);
router.delete('/:courseId', deleteCourse);
router.get('/:courseId/export', exportCourse);
router.post('/import', importCourse);

// AI-powered course generation
router.post('/generate-ai', generateCourseWithAI);
router.get('/workflow/:threadId/status', getWorkflowStatus);
router.post('/workflow/:threadId/cancel', cancelWorkflow);

// Material processing
router.post('/materials/upload', upload.array('files'), uploadMaterials);
router.get('/materials/search', searchMaterials);
router.post('/materials/recommendations', getRecommendedMaterials);

// Enterprise parameter management
router.post('/parameters/validate', async (req, res) => {
  try {
    const { courseParametersService } = await import('../services/courseParametersService');
    const validation = await courseParametersService.validateParameters(req.body);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: 'Parameter validation failed' });
  }
});

router.post('/parameters/save', async (req, res) => {
  try {
    const { courseParametersService } = await import('../services/courseParametersService');
    const filename = await courseParametersService.saveParameters(req.body);
    res.json({ filename });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save parameters' });
  }
});

router.get('/parameters/list', async (req, res) => {
  try {
    const { courseParametersService } = await import('../services/courseParametersService');
    const files = await courseParametersService.listParameterFiles();
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list parameter files' });
  }
});

router.get('/parameters/load/:filename', async (req, res) => {
  try {
    const { courseParametersService } = await import('../services/courseParametersService');
    const parameters = await courseParametersService.loadParameters(req.params.filename);
    res.json({ parameters });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load parameters' });
  }
});

// Advanced export with multiple formats
router.post('/export', async (req, res) => {
  try {
    const { advancedCourseExportService } = await import('../services/advancedCourseExportService');
    const { courseData, format, options } = req.body;
    
    const result = await advancedCourseExportService.exportCourse(courseData, {
      format,
      ...options
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;