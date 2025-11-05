// controllers/CourseParametersController.ts
import { Request, Response } from 'express';
import { CourseParametersService } from '../services/CourseParametersService';
import { CourseParameters } from '../types/course';

export class CourseParametersController {
  constructor(private courseParametersService: CourseParametersService) {}

  async listParameterFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = await this.courseParametersService.listParameterFiles();
      res.json({ success: true, data: files });
    } catch (error) {
      console.error('Error listing parameter files:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async loadParameters(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      if (!filename) {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }

      const parameters = await this.courseParametersService.loadParameters(filename);
      res.json({ success: true, data: parameters });
    } catch (error) {
      console.error('Error loading parameters:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load parameters' 
      });
    }
  }

  async saveParameters(req: Request, res: Response): Promise<void> {
    try {
      const parameters: CourseParameters = req.body;
      
      // Validate required fields
      if (!parameters.course_title) {
        res.status(400).json({ success: false, error: 'Course title is required' });
        return;
      }

      const filename = await this.courseParametersService.saveParameters(parameters);
      res.json({ success: true, data: { filename } });
    } catch (error) {
      console.error('Error saving parameters:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save parameters' 
      });
    }
  }

  async deleteParameters(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      if (!filename) {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }

      await this.courseParametersService.deleteParameters(filename);
      res.json({ success: true, data: { message: 'Parameters deleted successfully' } });
    } catch (error) {
      console.error('Error deleting parameters:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete parameters' 
      });
    }
  }

  async validateParameters(req: Request, res: Response): Promise<void> {
    try {
      const parameters: CourseParameters = req.body;
      const validation = await this.courseParametersService.validateParameters(parameters);
      res.json({ success: true, data: validation });
    } catch (error) {
      console.error('Error validating parameters:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate parameters' 
      });
    }
  }
}

// controllers/MaterialController.ts
import { Request, Response } from 'express';
import { MaterialService } from '../services/MaterialService';
import multer from 'multer';
import path from 'path';

export class MaterialController {
  constructor(private materialService: MaterialService) {}

  // Configure multer for file uploads
  configureUpload(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.materialService.getMaterialsDirectory());
      },
      filename: (req, file, cb) => {
        // Keep original filename
        cb(null, file.originalname);
      }
    });

    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedExtensions = ['.txt', '.pdf', '.docx', '.doc', '.html', '.htm', '.pptx', '.ppt'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${ext} is not supported`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      }
    });
  }

  async uploadFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ success: false, error: 'No files provided' });
        return;
      }

      const results = await this.materialService.processUploadedFiles(files);
      res.json({ 
        success: true, 
        data: { 
          message: results.join('\n'),
          uploadedFiles: files.map(f => f.filename)
        }
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
    }
  }

  async listFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = await this.materialService.listFiles();
      res.json({ success: true, data: files });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list files' 
      });
    }
  }

  async getFileInfo(req: Request, res: Response): Promise<void> {
    try {
      const fileInfo = await this.materialService.getFileInfo();
      res.json({ success: true, data: fileInfo });
    } catch (error) {
      console.error('Error getting file info:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get file info' 
      });
    }
  }

  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      if (!filename) {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }

      const result = await this.materialService.deleteFile(filename);
      res.json({ success: true, data: { message: result } });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      });
    }
  }

  async getFileContent(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      if (!filename) {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }

      const content = await this.materialService.getFileContent(filename);
      res.json({ success: true, data: { content } });
    } catch (error) {
      console.error('Error getting file content:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get file content' 
      });
    }
  }

  async searchMaterials(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ success: false, error: 'Search query is required' });
        return;
      }

      const results = await this.materialService.searchMaterials(query);
      res.json({ success: true, data: results });
    } catch (error) {
      console.error('Error searching materials:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      });
    }
  }
}

// controllers/CourseAgentController.ts
import { Request, Response } from 'express';
import { CourseAgentService } from '../services/CourseAgentService';
import { AgentState, RunAgentRequest, StateUpdateRequest } from '../types/course';

export class CourseAgentController {
  constructor(private courseAgentService: CourseAgentService) {}

  async runAgent(req: Request, res: Response): Promise<void> {
    try {
      const request: RunAgentRequest = req.body;
      
      // Validate request
      if (!request.topic) {
        res.status(400).json({ success: false, error: 'Topic is required' });
        return;
      }

      const response = await this.courseAgentService.runAgent(request);
      res.json({ success: true, data: response });
    } catch (error) {
      console.error('Error running agent:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run agent' 
      });
    }
  }

  async runAgentStream(req: Request, res: Response): Promise<void> {
    try {
      const request: RunAgentRequest = req.body;
      
      if (!request.topic) {
        res.status(400).json({ success: false, error: 'Topic is required' });
        return;
      }

      // Set up Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const stream = await this.courseAgentService.runAgentStream(request);
      
      // Send updates as they come in
      for await (const update of stream) {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error in streaming agent:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Stream failed' 
      })}\n\n`);
      res.end();
    }
  }

  async getState(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { threadId } = req.query;

      if (!key) {
        res.status(400).json({ success: false, error: 'State key is required' });
        return;
      }

      const content = await this.courseAgentService.getState(key, threadId as string);
      res.json({ success: true, data: { content } });
    } catch (error) {
      console.error('Error getting state:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get state' 
      });
    }
  }

  async modifyState(req: Request, res: Response): Promise<void> {
    try {
      const request: StateUpdateRequest = req.body;
      
      if (!request.key || !request.node || !request.content) {
        res.status(400).json({ 
          success: false, 
          error: 'Key, node, and content are required' 
        });
        return;
      }

      await this.courseAgentService.modifyState(request);
      res.json({ success: true, data: { message: 'State updated successfully' } });
    } catch (error) {
      console.error('Error modifying state:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to modify state' 
      });
    }
  }

  async getCurrentState(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.query;
      const state = await this.courseAgentService.getCurrentState(threadId as string);
      res.json({ success: true, data: state });
    } catch (error) {
      console.error('Error getting current state:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get current state' 
      });
    }
  }

  async getStateHistory(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.query;
      const history = await this.courseAgentService.getStateHistory(threadId as string);
      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Error getting state history:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get state history' 
      });
    }
  }

  async getThreads(req: Request, res: Response): Promise<void> {
    try {
      const threads = await this.courseAgentService.getThreads();
      res.json({ success: true, data: threads });
    } catch (error) {
      console.error('Error getting threads:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get threads' 
      });
    }
  }

  async switchThread(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.body;
      
      if (!threadId) {
        res.status(400).json({ success: false, error: 'Thread ID is required' });
        return;
      }

      await this.courseAgentService.switchThread(threadId);
      res.json({ success: true, data: { message: 'Thread switched successfully' } });
    } catch (error) {
      console.error('Error switching thread:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to switch thread' 
      });
    }
  }

  async getRetrievedMaterials(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.query;
      const materials = await this.courseAgentService.getRetrievedMaterials(threadId as string);
      res.json({ success: true, data: materials });
    } catch (error) {
      console.error('Error getting retrieved materials:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get retrieved materials' 
      });
    }
  }

  async pauseAgent(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.body;
      await this.courseAgentService.pauseAgent(threadId);
      res.json({ success: true, data: { message: 'Agent paused successfully' } });
    } catch (error) {
      console.error('Error pausing agent:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to pause agent' 
      });
    }
  }

  async resumeAgent(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.body;
      await this.courseAgentService.resumeAgent(threadId);
      res.json({ success: true, data: { message: 'Agent resumed successfully' } });
    } catch (error) {
      console.error('Error resuming agent:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to resume agent' 
      });
    }
  }
}

// controllers/CourseExportController.ts
import { Request, Response } from 'express';
import { CourseExportService } from '../services/CourseExportService';
import { CourseData } from '../types/course';

export class CourseExportController {
  constructor(private courseExportService: CourseExportService) {}

  async extractCourseData(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.query;
      const courseData = await this.courseExportService.extractCourseData(threadId as string);
      res.json({ success: true, data: courseData });
    } catch (error) {
      console.error('Error extracting course data:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract course data' 
      });
    }
  }

  async generatePreviewHtml(req: Request, res: Response): Promise<void> {
    try {
      const courseData: CourseData = req.body;
      const html = await this.courseExportService.generatePreviewHtml(courseData);
      res.json({ success: true, data: { html } });
    } catch (error) {
      console.error('Error generating preview HTML:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate preview' 
      });
    }
  }

  async exportToCsv(req: Request, res: Response): Promise<void> {
    try {
      const courseData: CourseData = req.body;
      const csvBuffer = await this.courseExportService.exportToCsv(courseData);
      
      const filename = `${courseData.title.replace(/\s+/g, '_').toLowerCase()}_table.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvBuffer);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to export to CSV' 
      });
    }
  }

  async exportToExcel(req: Request, res: Response): Promise<void> {
    try {
      const courseData: CourseData = req.body;
      const excelBuffer = await this.courseExportService.exportToExcel(courseData);
      
      const filename = `${courseData.title.replace(/\s+/g, '_').toLowerCase()}_table.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to export to Excel' 
      });
    }
  }

  async exportToPdf(req: Request, res: Response): Promise<void> {
    try {
      const courseData: CourseData = req.body;
      const pdfBuffer = await this.courseExportService.exportToPdf(courseData);
      
      const filename = `${courseData.title.replace(/\s+/g, '_').toLowerCase()}_table.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to export to PDF' 
      });
    }
  }

  async getExportFormats(req: Request, res: Response): Promise<void> {
    try {
      const formats = await this.courseExportService.getSupportedFormats();
      res.json({ success: true, data: formats });
    } catch (error) {
      console.error('Error getting export formats:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get export formats' 
      });
    }
  }
}

// controllers/WebSocketController.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { CourseAgentService } from '../services/CourseAgentService';

export class WebSocketController {
  private io: SocketIOServer;

  constructor(
    server: HTTPServer, 
    private courseAgentService: CourseAgentService
  ) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Configure appropriately for production
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join a room based on thread ID for targeted updates
      socket.on('join_thread', (threadId: string) => {
        socket.join(`thread_${threadId}`);
        console.log(`Client ${socket.id} joined thread ${threadId}`);
      });

      socket.on('leave_thread', (threadId: string) => {
        socket.leave(`thread_${threadId}`);
        console.log(`Client ${socket.id} left thread ${threadId}`);
      });

      // Handle agent run requests with real-time updates
      socket.on('run_agent', async (data) => {
        try {
          const { request, threadId } = data;
          const room = `thread_${threadId}`;

          // Notify that agent is starting
          this.io.to(room).emit('agent_status', { status: 'starting' });

          // Run agent with streaming updates
          const stream = await this.courseAgentService.runAgentStream(request);
          
          for await (const update of stream) {
            this.io.to(room).emit('agent_update', update);
          }

          this.io.to(room).emit('agent_status', { status: 'completed' });
        } catch (error) {
          console.error('Error in WebSocket agent run:', error);
          socket.emit('agent_error', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });

      // Handle state updates
      socket.on('update_state', async (data) => {
        try {
          const { request, threadId } = data;
          await this.courseAgentService.modifyState(request);
          
          // Broadcast state update to all clients in the thread
          this.io.to(`thread_${threadId}`).emit('state_updated', {
            key: request.key,
            threadId
          });
        } catch (error) {
          console.error('Error updating state via WebSocket:', error);
          socket.emit('update_error', { 
            error: error instanceof Error ? error.message : 'Update failed' 
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Method to broadcast updates from other parts of the application
  public broadcastAgentUpdate(threadId: string, update: any): void {
    this.io.to(`thread_${threadId}`).emit('agent_update', update);
  }

  public broadcastStateChange(threadId: string, stateKey: string, content: any): void {
    this.io.to(`thread_${threadId}`).emit('state_changed', {
      key: stateKey,
      content,
      threadId
    });
  }

  public broadcastError(threadId: string, error: string): void {
    this.io.to(`thread_${threadId}`).emit('agent_error', { error });
  }
}

// controllers/HealthController.ts
import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';

export class HealthController {
  constructor(private healthService: HealthService) {}

  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthService.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({ success: true, data: health });
    } catch (error) {
      console.error('Error getting health status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  async getSystemInfo(req: Request, res: Response): Promise<void> {
    try {
      const systemInfo = await this.healthService.getSystemInfo();
      res.json({ success: true, data: systemInfo });
    } catch (error) {
      console.error('Error getting system info:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get system info' 
      });
    }
  }

  async getDependencyStatus(req: Request, res: Response): Promise<void> {
    try {
      const dependencies = await this.healthService.checkDependencies();
      res.json({ success: true, data: dependencies });
    } catch (error) {
      console.error('Error checking dependencies:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check dependencies' 
      });
    }
  }
}

// controllers/AuthController.ts (Optional - for authentication if needed)
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ success: false, error: 'Username and password are required' });
        return;
      }

      const result = await this.authService.authenticate(username, password);
      
      if (result.success) {
        const token = jwt.sign(
          { userId: result.user.id, username: result.user.username },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        res.json({ 
          success: true, 
          data: { 
            token, 
            user: result.user 
          } 
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      });
    }
  }

  async validateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({ success: false, error: 'No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        res.status(401).json({ success: false, error: 'Invalid token format' });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      (req as any).user = decoded;
      next();
    } catch (error) {
      console.error('Error validating token:', error);
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ success: false, error: 'Token is required' });
        return;
      }

      const newToken = await this.authService.refreshToken(token);
      res.json({ success: true, data: { token: newToken } });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(401).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      
      if (token) {
        await this.authService.invalidateToken(token);
      }

      res.json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      });
    }
  }
}
      