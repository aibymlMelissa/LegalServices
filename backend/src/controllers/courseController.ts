import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AICourseGenerationService, CourseGenerationRequest } from '../services/aiCourseGenerationService';
import { MaterialProcessingService } from '../services/materialProcessingService';
import { VectorSearchService } from '../services/vectorSearchService';

const prisma = new PrismaClient();

// Initialize AI services
const vectorService = new VectorSearchService();
const materialService = new MaterialProcessingService('./teaching_materials', vectorService);
const aiCourseService = new AICourseGenerationService(materialService, vectorService);

export const getCourses = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's courses from database
    const courses = await prisma.case.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, type = 'course' } = req.body;

    // Create course in database
    const course = await prisma.case.create({
      data: {
        title,
        description,
        type,
        status: 'draft',
        userId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// New AI-powered course generation endpoint
export const generateCourseWithAI = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { parameters, useStream = false } = req.body as {
      parameters: {
        course_title: string;
        target_audience: string;
        teaching_style: string;
        teaching_objective: string;
        compulsory_areas: string[];
      };
      useStream?: boolean;
    };

    if (!parameters?.course_title) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    const request: CourseGenerationRequest = {
      parameters,
      useExistingMaterials: true
    };

    if (useStream) {
      // Set up Server-Sent Events for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      try {
        for await (const update of aiCourseService.generateCourseStream(request)) {
          res.write(`data: ${JSON.stringify(update)}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Generation failed' 
        })}\n\n`);
        res.end();
      }
    } else {
      // Regular request - return complete course
      const courseContent = await aiCourseService.generateCourse(request);
      
      // Save generated course to database
      const course = await prisma.case.create({
        data: {
          title: courseContent.title,
          description: courseContent.description,
          type: 'ai_generated_course',
          status: 'completed',
          userId: req.user.id
        }
      });

      res.json({
        success: true,
        course,
        content: courseContent
      });
    }
  } catch (error) {
    console.error('AI course generation error:', error);
    res.status(500).json({ error: 'Failed to generate course with AI' });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { courseId } = req.params;
    const { title, description, topics } = req.body;

    // For now, we'll return success - course data is managed on frontend
    res.json({
      message: 'Course update handled on frontend',
      data: { id: courseId, title, description, topics }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { courseId } = req.params;

    // For now, we'll return success - course data is managed on frontend
    res.json({ message: 'Course deletion handled on frontend' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

export const exportCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { courseId } = req.params;
    const { format } = req.query;

    // This could be extended to generate actual course exports (PDF, Word, etc.)
    res.json({
      message: 'Course export functionality can be implemented here',
      courseId,
      format: format || 'json'
    });
  } catch (error) {
    console.error('Export course error:', error);
    res.status(500).json({ error: 'Failed to export course' });
  }
};

export const importCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // This could be extended to handle file uploads and course imports
    res.json({
      message: 'Course import functionality can be implemented here'
    });
  } catch (error) {
    console.error('Import course error:', error);
    res.status(500).json({ error: 'Failed to import course' });
  }
};

// Material processing endpoints
export const uploadMaterials = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const processedMaterials = await materialService.processUploadedFiles(files);
    
    res.json({
      success: true,
      materials: processedMaterials,
      message: `Successfully processed ${processedMaterials.length} materials`
    });
  } catch (error) {
    console.error('Material upload error:', error);
    res.status(500).json({ error: 'Failed to process materials' });
  }
};

export const searchMaterials = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { query, limit = 10 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const materials = await materialService.searchMaterials(query, Number(limit));
    
    res.json({
      success: true,
      query,
      materials,
      count: materials.length
    });
  } catch (error) {
    console.error('Material search error:', error);
    res.status(500).json({ error: 'Failed to search materials' });
  }
};

export const getRecommendedMaterials = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, target_audience, compulsory_areas, limit = 5 } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    const materials = await materialService.getRecommendedMaterials({
      title,
      target_audience: target_audience || 'general',
      compulsory_areas: compulsory_areas || []
    }, Number(limit));
    
    res.json({
      success: true,
      materials,
      count: materials.length
    });
  } catch (error) {
    console.error('Material recommendation error:', error);
    res.status(500).json({ error: 'Failed to get material recommendations' });
  }
};

export const getWorkflowStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { threadId } = req.params;
    
    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' });
    }

    const workflow = await aiCourseService.getWorkflowStatus(threadId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Workflow status error:', error);
    res.status(500).json({ error: 'Failed to get workflow status' });
  }
};

export const cancelWorkflow = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { threadId } = req.params;
    
    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' });
    }

    await aiCourseService.cancelWorkflow(threadId);
    
    res.json({
      success: true,
      message: 'Workflow cancelled successfully'
    });
  } catch (error) {
    console.error('Workflow cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel workflow' });
  }
};