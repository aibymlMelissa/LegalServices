import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { LegalDoctrineModule } from '../services/mcp-modules/legalDoctrineModule';
import { LegalProcedureModule } from '../services/mcp-modules/legalProcedureModule';
import { LegalPrinciplesModule } from '../services/mcp-modules/legalPrinciplesModule';
import { AdmissibleEvidenceModule } from '../services/mcp-modules/admissibleEvidenceModule';
import { CasePrecedentsModule } from '../services/mcp-modules/casePrecedentsModule';
import { ClientPsychologyModule } from '../services/mcp-modules/clientPsychologyModule';
import { AIOrchestrationService } from '../services/aiOrchestrationService';
import { PresentationService } from '../services/presentationService';
import { EnhancedPresentationService, EnhancementRequest } from '../services/enhancedPresentationService';
import { GoogleSlidesService } from '../services/googleSlidesService';

const prisma = new PrismaClient();

export const generateServices = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { caseId, title = 'AI Generated Services', templateId } = req.body;

    // Verify case ownership
    const case_ = await prisma.case.findFirst({
      where: { 
        id: caseId,
        userId: req.user.id 
      }
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }

    console.log('Generating services for case:', case_.title);

    // Initialize MCP modules
    const doctrineModule = new LegalDoctrineModule();
    const procedureModule = new LegalProcedureModule();
    const principlesModule = new LegalPrinciplesModule();
    const evidenceModule = new AdmissibleEvidenceModule();
    const precedentsModule = new CasePrecedentsModule();
    const psychologyModule = new ClientPsychologyModule();

    // Run all MCP analyses
    const mcpInput = { caseId, caseDetails: case_ };
    
    console.log('Running MCP module analyses...');
    const [
      doctrineAnalysis,
      procedureAnalysis,
      principlesAnalysis,
      evidenceAnalysis,
      precedentsAnalysis,
      psychologyAnalysis
    ] = await Promise.all([
      doctrineModule.analyze(mcpInput),
      procedureModule.analyze(mcpInput),
      principlesModule.analyze(mcpInput),
      evidenceModule.analyze(mcpInput),
      precedentsModule.analyze(mcpInput),
      psychologyModule.analyze(mcpInput)
    ]);

    // Combine MCP outputs
    const mcpOutputs = {
      legalDoctrine: doctrineAnalysis,
      legalProcedure: procedureAnalysis,
      legalPrinciples: principlesAnalysis,
      admissibleEvidence: evidenceAnalysis,
      casePrecedents: precedentsAnalysis,
      clientPsychology: psychologyAnalysis
    };

    console.log('Synthesizing services with AI orchestration...');
    
    // Generate synthesized services using AI
    const aiOrchestrator = new AIOrchestrationService();
    const synthesizedServices = await aiOrchestrator.synthesizeLegalStrategy(
      mcpOutputs,
      case_
    );

    console.log('Generating PowerPoint presentation...');
    
    // Generate PowerPoint presentation
    const presentationService = new PresentationService();
    const presentationFilename = await presentationService.generatePresentation(
      synthesizedServices,
      {
        templateId: templateId || undefined, // Use firm template if provided
        caseTitle: case_.title,
        clientName: 'Client',
        lawyerName: req.user.name,
        firmName: 'Legal Services Platform'
      }
    );

    console.log('Saving services to database...');
    
    // Save services to database
    const services = await prisma.services.create({
      data: {
        title,
        caseId,
        legalDoctrine: JSON.stringify(doctrineAnalysis.data),
        legalProcedure: JSON.stringify(procedureAnalysis.data),
        legalPrinciples: JSON.stringify(principlesAnalysis.data),
        admissibleEvidence: JSON.stringify(evidenceAnalysis.data),
        casePrecedents: JSON.stringify(precedentsAnalysis.data),
        clientPsychology: JSON.stringify(psychologyAnalysis.data),
        synthesizedServices: JSON.stringify(synthesizedServices),
        presentationUrl: presentationFilename
      }
    });

    console.log('Services generation complete:', services.id);

    res.status(201).json({
      services,
      mcpAnalysis: mcpOutputs,
      synthesizedServices,
      presentationUrl: `/api/services/${services.id}/presentation`
    });

  } catch (error) {
    console.error('Generate services error:', error);
    res.status(500).json({ error: 'Failed to generate services' });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { caseId } = req.params;

    // Verify case ownership
    const case_ = await prisma.case.findFirst({
      where: { 
        id: caseId,
        userId: req.user.id 
      }
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const services = await prisma.services.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getServicesById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;

    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case) {
      return res.status(404).json({ error: 'Services not found' });
    }

    // Parse JSON fields for response
    const parsedServices = {
      ...services,
      legalDoctrine: services.legalDoctrine ? JSON.parse(services.legalDoctrine) : null,
      legalProcedure: services.legalProcedure ? JSON.parse(services.legalProcedure) : null,
      legalPrinciples: services.legalPrinciples ? JSON.parse(services.legalPrinciples) : null,
      admissibleEvidence: services.admissibleEvidence ? JSON.parse(services.admissibleEvidence) : null,
      casePrecedents: services.casePrecedents ? JSON.parse(services.casePrecedents) : null,
      clientPsychology: services.clientPsychology ? JSON.parse(services.clientPsychology) : null,
      synthesizedServices: services.synthesizedServices ? JSON.parse(services.synthesizedServices) : null
    };

    res.json(parsedServices);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;

    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case || !services.presentationUrl) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const presentationService = new PresentationService();
    const fileBuffer = await presentationService.getPresentation(services.presentationUrl);

    if (!fileBuffer) {
      return res.status(404).json({ error: 'Presentation file not found' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${services.presentationUrl}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download presentation error:', error);
    res.status(500).json({ error: 'Failed to download presentation' });
  }
};

export const deleteServices = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;

    // Verify services ownership through case ownership
    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case) {
      return res.status(404).json({ error: 'Services not found' });
    }

    // Delete the services
    await prisma.services.delete({
      where: { id: servicesId }
    });

    // Optionally, clean up presentation file
    if (services.presentationUrl) {
      try {
        const presentationService = new PresentationService();
        await presentationService.deletePresentation(services.presentationUrl);
      } catch (err) {
        console.warn('Failed to delete presentation file:', err);
        // Don't fail the whole operation if file deletion fails
      }
    }

    res.json({ message: 'Services deleted successfully' });
  } catch (error) {
    console.error('Delete services error:', error);
    res.status(500).json({ error: 'Failed to delete services' });
  }
};

export const regenerateWithFeedback = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;
    const { professionalFeedback, title = 'AI Generated Services (Improved)', templateId } = req.body;

    // Verify services ownership and get original services
    const originalServices = await prisma.services.findFirst({
      where: { id: servicesId },
      include: {
        case: {
          where: { userId: req.user.id }
        }
      }
    });

    if (!originalServices || !originalServices.case) {
      return res.status(404).json({ error: 'Services not found' });
    }

    console.log('Regenerating services with feedback for:', originalServices.title);

    // Parse original services data
    const mcpOutputs = {
      legalDoctrine: { data: originalServices.legalDoctrine ? JSON.parse(originalServices.legalDoctrine) : null },
      legalProcedure: { data: originalServices.legalProcedure ? JSON.parse(originalServices.legalProcedure) : null },
      legalPrinciples: { data: originalServices.legalPrinciples ? JSON.parse(originalServices.legalPrinciples) : null },
      admissibleEvidence: { data: originalServices.admissibleEvidence ? JSON.parse(originalServices.admissibleEvidence) : null },
      casePrecedents: { data: originalServices.casePrecedents ? JSON.parse(originalServices.casePrecedents) : null },
      clientPsychology: { data: originalServices.clientPsychology ? JSON.parse(originalServices.clientPsychology) : null }
    };

    const previousServices = originalServices.synthesizedServices ? 
      JSON.parse(originalServices.synthesizedServices) : null;

    if (!previousServices) {
      return res.status(400).json({ error: 'Original services missing synthesized data' });
    }

    console.log('Regenerating services with AI feedback integration...');
    
    // Generate improved services using AI with feedback
    const aiOrchestrator = new AIOrchestrationService();
    const improvedServices = await aiOrchestrator.regenerateStrategyWithFeedback(
      mcpOutputs,
      originalServices.case,
      previousServices,
      professionalFeedback
    );

    console.log('Generating PowerPoint presentation for improved services...');
    
    // Generate PowerPoint presentation
    const presentationService = new PresentationService();
    const presentationFilename = await presentationService.generatePresentation(
      improvedServices,
      {
        templateId: templateId || undefined, // Use firm template if provided
        caseTitle: originalServices.case.title,
        clientName: 'Client',
        lawyerName: req.user.name,
        firmName: 'Legal Services Platform'
      }
    );

    // Save feedback history
    const feedbackHistory = originalServices.feedbackHistory ? 
      JSON.parse(originalServices.feedbackHistory) : [];
    feedbackHistory.push({
      timestamp: new Date(),
      feedback: professionalFeedback,
      version: (originalServices.version || 1) + 1
    });

    console.log('Saving improved services to database...');
    
    // Save improved services to database
    const newServices = await prisma.services.create({
      data: {
        title,
        caseId: originalServices.caseId,
        legalDoctrine: originalServices.legalDoctrine, // Keep original MCP data
        legalProcedure: originalServices.legalProcedure,
        legalPrinciples: originalServices.legalPrinciples,
        admissibleEvidence: originalServices.admissibleEvidence,
        casePrecedents: originalServices.casePrecedents,
        clientPsychology: originalServices.clientPsychology,
        synthesizedServices: JSON.stringify(improvedServices),
        presentationUrl: presentationFilename,
        professionalFeedback: JSON.stringify(professionalFeedback),
        feedbackHistory: JSON.stringify(feedbackHistory),
        version: (originalServices.version || 1) + 1,
        parentServicesId: servicesId
      }
    });

    console.log('Services regeneration complete:', newServices.id);

    res.status(201).json({
      services: newServices,
      improvedServices,
      presentationUrl: `/api/strategies/${newServices.id}/presentation`,
      previousVersion: originalServices.version || 1,
      newVersion: newServices.version
    });

  } catch (error) {
    console.error('Regenerate services with feedback error:', error);
    res.status(500).json({ error: 'Failed to regenerate services' });
  }
};

export const generateEnhancedPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;
    const enhancementRequest: EnhancementRequest = req.body;

    // Verify services ownership
    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case) {
      return res.status(404).json({ error: 'Services not found' });
    }

    // Parse synthesized services
    const synthesizedServices = services.synthesizedServices ? 
      JSON.parse(services.synthesizedServices) : null;

    if (!synthesizedServices) {
      return res.status(400).json({ error: 'Services missing synthesized data' });
    }

    console.log('Generating enhanced presentation with Gemini AI...');
    
    // Generate enhanced presentation
    const enhancedPresentationService = new EnhancedPresentationService();
    const enhancedFilename = await enhancedPresentationService.generateEnhancedPresentation(
      synthesizedServices,
      enhancementRequest,
      {
        caseTitle: services.case.title,
        clientName: 'Client',
        lawyerName: req.user.name,
        firmName: 'Legal Services Platform',
        theme: enhancementRequest.preferredStyle as any
      }
    );

    console.log('Enhanced presentation generated:', enhancedFilename);

    // Update services with enhanced presentation URL
    await prisma.services.update({
      where: { id: servicesId },
      data: {
        enhancedPresentationUrl: enhancedFilename,
        enhancementRequest: JSON.stringify(enhancementRequest)
      }
    });

    res.status(200).json({
      message: 'Enhanced presentation generated successfully',
      filename: enhancedFilename,
      downloadUrl: `/api/strategies/${servicesId}/enhanced-presentation`,
      enhancementRequest
    });

  } catch (error) {
    console.error('Generate enhanced presentation error:', error);
    res.status(500).json({ error: 'Failed to generate enhanced presentation' });
  }
};

export const downloadEnhancedPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;

    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case || !services.enhancedPresentationUrl) {
      return res.status(404).json({ error: 'Enhanced presentation not found' });
    }

    const enhancedPresentationService = new EnhancedPresentationService();
    const fileBuffer = await enhancedPresentationService.getPresentation(services.enhancedPresentationUrl);

    if (!fileBuffer) {
      return res.status(404).json({ error: 'Enhanced presentation file not found' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${services.enhancedPresentationUrl}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download enhanced presentation error:', error);
    res.status(500).json({ error: 'Failed to download enhanced presentation' });
  }
};

export const generateGoogleSlidesPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;
    const enhancementRequest: EnhancementRequest = req.body;

    // Verify services ownership
    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case) {
      return res.status(404).json({ error: 'Services not found' });
    }

    // Parse synthesized services
    const synthesizedServices = services.synthesizedServices ? 
      JSON.parse(services.synthesizedServices) : null;

    if (!synthesizedServices) {
      return res.status(400).json({ error: 'Services missing synthesized data' });
    }

    console.log('Generating Google Slides presentation with graphics...');
    
    // Create color palette
    const getColorPalette = (request: EnhancementRequest) => {
      if (request.colorScheme === 'custom' && request.customColors) {
        return request.customColors;
      }
      const schemes = {
        'vibrant': { primary: '#2E86AB', secondary: '#A23B72', accent: '#F18F01', background: '#FFFFFF', text: '#333333' },
        'muted': { primary: '#5D737E', secondary: '#A8BABC', accent: '#B85042', background: '#F7F7F7', text: '#2F2F2F' },
        'monochrome': { primary: '#2F2F2F', secondary: '#666666', accent: '#999999', background: '#FFFFFF', text: '#000000' }
      };
      return schemes[request.colorScheme] || schemes['vibrant'];
    };

    const colorPalette = getColorPalette(enhancementRequest);

    // Generate Google Slides presentation
    const googleSlidesService = new GoogleSlidesService();
    const presentationPath = await googleSlidesService.createPresentationWithGraphics(
      synthesizedServices,
      enhancementRequest,
      colorPalette
    );

    console.log('Google Slides presentation generated:', presentationPath);

    // Update services with Google Slides presentation URL
    await prisma.services.update({
      where: { id: servicesId },
      data: {
        googleSlidesUrl: presentationPath,
        enhancementRequest: JSON.stringify(enhancementRequest)
      }
    });

    res.status(200).json({
      message: 'Google Slides presentation generated successfully',
      filename: presentationPath,
      downloadUrl: `/api/strategies/${servicesId}/google-slides-download`,
      enhancementRequest
    });

  } catch (error) {
    console.error('Generate Google Slides presentation error:', error);
    res.status(500).json({ error: 'Failed to generate Google Slides presentation' });
  }
};

export const downloadGoogleSlidesPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;

    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case || !services.googleSlidesUrl) {
      return res.status(404).json({ error: 'Google Slides presentation not found' });
    }

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(services.googleSlidesUrl)) {
      return res.status(404).json({ error: 'Presentation file not found' });
    }

    // Determine content type based on file extension
    const path = require('path');
    const ext = path.extname(services.googleSlidesUrl).toLowerCase();
    let contentType = 'application/octet-stream';
    let disposition = 'attachment';

    if (ext === '.pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.html') {
      contentType = 'text/html';
      disposition = 'inline'; // Open HTML in browser
    }

    const fileBuffer = fs.readFileSync(services.googleSlidesUrl);
    const filename = path.basename(services.googleSlidesUrl);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download Google Slides presentation error:', error);
    res.status(500).json({ error: 'Failed to download Google Slides presentation' });
  }
};

export const convertGraphicsFolder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { servicesId } = req.params;
    const { graphicsPath, enhancementRequest } = req.body;

    // Verify services ownership
    const services = await prisma.services.findFirst({
      where: { 
        id: servicesId,
        case: {
          userId: req.user.id
        }
      },
      include: {
        case: true
      }
    });

    if (!services || !services.case) {
      return res.status(404).json({ error: 'Services not found' });
    }

    const synthesizedServices = services.synthesizedServices ? 
      JSON.parse(services.synthesizedServices) : null;

    if (!synthesizedServices) {
      return res.status(400).json({ error: 'Services missing synthesized data' });
    }

    console.log('Converting graphics folder to presentation...');

    const googleSlidesService = new GoogleSlidesService();
    const presentationPath = await googleSlidesService.convertExistingGraphicsFolder(
      graphicsPath,
      synthesizedServices,
      enhancementRequest
    );

    res.status(200).json({
      message: 'Graphics folder converted successfully',
      filename: presentationPath,
      downloadUrl: `/api/strategies/${servicesId}/converted-download`
    });

  } catch (error) {
    console.error('Convert graphics folder error:', error);
    res.status(500).json({ error: 'Failed to convert graphics folder' });
  }
};