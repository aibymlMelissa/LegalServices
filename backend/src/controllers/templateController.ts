import { Request, Response } from 'express';
import { PresentationService } from '../services/presentationService';
import multer from 'multer';
import path from 'path';

const presentationService = new PresentationService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('image') || file.mimetype.includes('powerpoint') || file.mimetype.includes('template')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload image or PowerPoint files.'));
    }
  }
});

export const getAvailableTemplates = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const templates = presentationService.getAvailableTemplates();
    
    res.json({
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        colors: template.colors,
        fonts: template.fonts,
        hasLogo: !!template.logo?.path
      }))
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

export const uploadFirmTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const uploadMiddleware = upload.single('template');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No template file provided' });
      }

      const { templateConfig } = req.body;
      let config = {};
      
      try {
        config = templateConfig ? JSON.parse(templateConfig) : {};
      } catch (parseError) {
        return res.status(400).json({ error: 'Invalid template configuration JSON' });
      }

      const firmId = req.user.id; // Use user ID as firm identifier
      const templateId = await presentationService.uploadFirmTemplate(
        firmId,
        req.file.buffer,
        config
      );

      res.status(201).json({
        message: 'Template uploaded successfully',
        templateId,
        config
      });
    });

  } catch (error) {
    console.error('Upload template error:', error);
    res.status(500).json({ error: 'Failed to upload template' });
  }
};

export const uploadFirmLogo = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const uploadMiddleware = upload.single('logo');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No logo file provided' });
      }

      const firmId = req.user.id;
      const logoPath = await presentationService.uploadFirmLogo(
        firmId,
        req.file.buffer,
        req.file.originalname
      );

      res.status(201).json({
        message: 'Logo uploaded successfully',
        logoPath: path.basename(logoPath)
      });
    });

  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
};

export const previewTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { templateId } = req.params;
    const templates = presentationService.getAvailableTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Return template details for preview
    res.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        colors: template.colors,
        fonts: template.fonts,
        layouts: {
          title: template.layouts.title,
          content: template.layouts.content,
          twoColumn: template.layouts.twoColumn,
          conclusion: template.layouts.conclusion
        }
      }
    });

  } catch (error) {
    console.error('Preview template error:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
};

export const generateTemplatePreview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { templateId } = req.params;
    
    // Sample strategy data for preview
    const sampleStrategy = {
      executiveSummary: 'This is a sample legal strategy presentation demonstrating the template styling and layout.',
      keyStrengths: [
        'Strong legal precedent support',
        'Comprehensive evidence collection',
        'Expert witness testimony available'
      ],
      potentialWeaknesses: [
        'Limited discovery time',
        'Opposing counsel experience',
        'Jurisdiction considerations'
      ],
      recommendedApproach: 'Pursue aggressive litigation strategy with focus on early settlement negotiations',
      tacticalConsiderations: [
        'Phase 1: Discovery and evidence gathering',
        'Phase 2: Motion practice and pre-trial preparation',
        'Phase 3: Trial or settlement negotiation'
      ],
      expectedOutcomes: [
        'Favorable settlement within 6 months',
        'Cost-effective resolution',
        'Client satisfaction'
      ],
      alternativeStrategies: [
        'Alternative dispute resolution',
        'Mediation approach',
        'Arbitration option'
      ]
    };

    const sampleOptions = {
      templateId,
      caseTitle: 'Sample Case Preview',
      clientName: 'Sample Client',
      lawyerName: req.user.name,
      firmName: 'Your Law Firm'
    };

    const filename = await presentationService.generatePresentation(sampleStrategy, sampleOptions);
    
    res.json({
      message: 'Template preview generated successfully',
      downloadUrl: `/api/templates/preview-download/${filename}`,
      templateId
    });

  } catch (error) {
    console.error('Generate template preview error:', error);
    res.status(500).json({ error: 'Failed to generate template preview' });
  }
};

export const downloadTemplatePreview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { filename } = req.params;
    const fileBuffer = await presentationService.getPresentation(filename);

    if (!fileBuffer) {
      return res.status(404).json({ error: 'Preview file not found' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="template_preview_${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download template preview error:', error);
    res.status(500).json({ error: 'Failed to download template preview' });
  }
};

export { upload };