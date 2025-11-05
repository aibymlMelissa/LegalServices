// services/CourseExportService.ts
import { CourseData } from '../types/course';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export class CourseExportService {
  private parseCourseDraft(draft: string, plan: string): CourseData {
    const courseData: CourseData = {
      title: "Course Title",
      teaching_goal: "Not specified",
      teaching_method: "Not specified",
      topics: [],
      references: []
    };

    // Extract course title (look for main heading)
    const titleMatch = draft.match(/^#\s+(.+?)$/m);
    if (titleMatch) {
      courseData.title = titleMatch[1].trim();
    }

    // Extract teaching goal/objective
    const goalPatterns = [
      /(?:teaching|learning|course)\s+(?:goal|objective|aim)s?[:\s]+([^\n]+)/i,
      /(?:goal|objective|aim)s?(?:\s+of\s+the\s+course)?[:\s]+([^\n]+)/i,
      /(?:by\s+the\s+end\s+of\s+this\s+course[,\s]+students\s+will\s+)([^\n]+)/i
    ];
    
    for (const pattern of goalPatterns) {
      const goalMatch = draft.match(pattern);
      if (goalMatch) {
        courseData.teaching_goal = goalMatch[1].trim();
        break;
      }
    }

    // Extract teaching method
    const methodPatterns = [
      /(?:teaching|learning|instructional)\s+(?:method|approach|strategy|style)[s:\s]+([^\n]+)/i,
      /(?:course|class)\s+(?:will\s+be|is)\s+(?:taught|delivered)\s+(?:using|through|by|via)\s+([^\n]+)/i,
      /(?:methodology|format)[:\s]+([^\n]+)/i
    ];
    
    for (const pattern of methodPatterns) {
      const methodMatch = draft.match(pattern);
      if (methodMatch) {
        courseData.teaching_method = methodMatch[1].trim();
        break;
      }
    }

    // Extract topics (sections with ## or ### headers)
    const topicMatches = draft.match(/#{2,3}\s+(.+?)$/gm);
    if (topicMatches) {
      const nonTopicHeaders = [
        'introduction', 'overview', 'summary', 'conclusion',
        'background', 'reference', 'bibliography', 'assessment',
        'evaluation', 'grading', 'objectives', 'goals'
      ];
      
      const filteredTopics = topicMatches
        .map(match => match.replace(/#{2,3}\s+/, '').trim())
        .filter(topic => !nonTopicHeaders.some(header => 
          topic.toLowerCase().includes(header.toLowerCase())
        ));
      
      courseData.topics = filteredTopics;
    }

    // If no topics found in draft, try to extract from plan
    if (courseData.topics.length === 0) {
      const planTopicMatches = plan.match(/(?:topic|section|module|unit)[s\s]*[:\d.]+\s*([^\n]+)/gi);
      if (planTopicMatches) {
        courseData.topics = planTopicMatches.map(match => 
          match.replace(/(?:topic|section|module|unit)[s\s]*[:\d.]+\s*/i, '').trim()
        );
      }
    }

    // Extract references
    const refSection = this.extractReferencesSection(draft);
    if (refSection) {
      courseData.references = this.parseReferences(refSection);
    }

    return courseData;
  }

  private extractReferencesSection(content: string): string | null {
    const refPatterns = [
      /(?:references|bibliography|further reading|recommended texts|required texts|textbooks)[:\s]+((?:.+\n?)+)/i,
      /#{1,3}\s+(?:references|bibliography|further reading|recommended texts)[^\n]*\n+((?:.+\n?)+)/i
    ];

    for (const pattern of refPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private parseReferences(refSection: string): string[] {
    // Try to extract structured references
    let refItems = refSection.match(/(?:^|\n)[-•*]\s+([^\n]+)/g);
    
    if (!refItems) {
      // Try numbered list
      refItems = refSection.match(/(?:^|\n)\d+\.\s+([^\n]+)/g);
    }
    
    if (!refItems) {
      // Just split by lines
      refItems = refSection.split('\n').filter(line => line.trim());
    }

    return refItems.map(item => 
      item.replace(/^(?:\n)?[-•*]\s*|\d+\.\s*/, '').trim()
    ).filter(item => item.length > 0);
  }

  private generateTableHtml(courseData: CourseData): string {
    return `
      <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
        <tr>
          <th colspan="2" style="padding: 8px; text-align: center; background-color: #4CAF50; color: white; font-size: 16px;">
            Course Design Table
          </th>
        </tr>
        <tr>
          <th style="width: 20%; padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Title</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${this.escapeHtml(courseData.title)}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Teaching Goal</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${this.escapeHtml(courseData.teaching_goal)}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Teaching Method</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${this.escapeHtml(courseData.teaching_method)}</td>
        </tr>
        <tr>
          <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Course Content</th>
        </tr>
        ${courseData.topics.map((topic, index) => `
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Topic ${index + 1}</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${this.escapeHtml(topic)}</td>
        </tr>
        `).join('')}
        ${courseData.references.length > 0 ? `
        <tr>
          <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">References</th>
        </tr>
        ${courseData.references.map((ref, index) => `
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Reference ${index + 1}</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${this.escapeHtml(ref)}</td>
        </tr>
        `).join('')}
        ` : ''}
      </table>
    `;
  }

  private generateCsvContent(courseData: CourseData): string {
    const rows = [
      ['Course Design Table'],
      ['Title', courseData.title],
      ['Teaching Goal', courseData.teaching_goal],
      ['Teaching Method', courseData.teaching_method],
      ['Course Content'],
    ];

    courseData.topics.forEach((topic, index) => {
      rows.push([`Topic ${index + 1}`, topic]);
    });

    if (courseData.references.length > 0) {
      rows.push(['References']);
      courseData.references.forEach((ref, index) => {
        rows.push([`Reference ${index + 1}`, ref]);
      });
    }

    return rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  private prepareCourseDataForExport(courseData: CourseData): string[][] {
    const data = [
      ['Title', courseData.title],
      ['Teaching Goal', courseData.teaching_goal],
      ['Teaching Method', courseData.teaching_method],
      ['Course Content', ''],
    ];

    courseData.topics.forEach((topic, index) => {
      data.push([`Topic ${index + 1}`, topic]);
    });

    if (courseData.references.length > 0) {
      data.push(['References', '']);
      courseData.references.forEach((ref, index) => {
        data.push([`Reference ${index + 1}`, ref]);
      });
    }

    return data;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// services/HealthService.ts
import os from 'os';
import fs from 'fs/promises';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'up' | 'down';
    openai: 'up' | 'down';
    filesystem: 'up' | 'down';
    memory: 'normal' | 'high' | 'critical';
  };
}

export interface SystemInfo {
  platform: string;
  architecture: string;
  nodeVersion: string;
  totalMemory: string;
  freeMemory: string;
  cpuUsage: number;
  loadAverage: number[];
}

export interface DependencyStatus {
  openai: {
    status: 'available' | 'unavailable';
    apiKey: 'configured' | 'missing';
  };
  materialDirectory: {
    status: 'accessible' | 'inaccessible';
    path: string;
    fileCount: number;
  };
  parameterDirectory: {
    status: 'accessible' | 'inaccessible';
    path: string;
    fileCount: number;
  };
}

export class HealthService {
  private startTime: Date;
  private version: string;

  constructor(version: string = '1.0.0') {
    this.startTime = new Date();
    this.version = version;
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const services = await this.checkServices();
    
    const status: HealthStatus['status'] = 
      Object.values(services).includes('down' as any) || services.memory === 'critical' 
        ? 'unhealthy'
        : services.memory === 'high' 
        ? 'degraded' 
        : 'healthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      version: this.version,
      services
    };
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpus = os.cpus();
    
    return {
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      totalMemory: this.formatBytes(totalMemory),
      freeMemory: this.formatBytes(freeMemory),
      cpuUsage: this.calculateCpuUsage(cpus),
      loadAverage: os.loadavg()
    };
  }

  async checkDependencies(): Promise<DependencyStatus> {
    const openaiStatus = this.checkOpenAIStatus();
    const materialDirStatus = await this.checkDirectoryStatus('./teaching_materials');
    const parameterDirStatus = await this.checkDirectoryStatus('./course_parameters');

    return {
      openai: openaiStatus,
      materialDirectory: materialDirStatus,
      parameterDirectory: parameterDirStatus
    };
  }

  private async checkServices(): Promise<HealthStatus['services']> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const memoryUsagePercent = (memoryUsage.heapUsed / totalMemory) * 100;

    let memoryStatus: 'normal' | 'high' | 'critical' = 'normal';
    if (memoryUsagePercent > 80) {
      memoryStatus = 'critical';
    } else if (memoryUsagePercent > 60) {
      memoryStatus = 'high';
    }

    const openaiStatus = process.env.OPENAI_API_KEY ? 'up' : 'down';
    const filesystemStatus = await this.checkFilesystemAccess();

    return {
      database: 'up', // Placeholder - would check actual database if used
      openai: openaiStatus as 'up' | 'down',
      filesystem: filesystemStatus,
      memory: memoryStatus
    };
  }

  private checkOpenAIStatus(): DependencyStatus['openai'] {
    return {
      status: process.env.OPENAI_API_KEY ? 'available' : 'unavailable',
      apiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
    };
  }

  private async checkDirectoryStatus(dirPath: string): Promise<{
    status: 'accessible' | 'inaccessible';
    path: string;
    fileCount: number;
  }> {
    try {
      const files = await fs.readdir(dirPath);
      return {
        status: 'accessible',
        path: dirPath,
        fileCount: files.length
      };
    } catch (error) {
      return {
        status: 'inaccessible',
        path: dirPath,
        fileCount: 0
      };
    }
  }

  private async checkFilesystemAccess(): Promise<'up' | 'down'> {
    try {
      await fs.access('./');
      return 'up';
    } catch {
      return 'down';
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof os.CpuInfo['times']];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - Math.round((totalIdle / totalTick) * 100);
  }
}

// services/AuthService.ts (Optional)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  message?: string;
}

export class AuthService {
  private users: Map<string, any> = new Map(); // In production, use a real database
  private blacklistedTokens: Set<string> = new Set();
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.initializeDefaultUser();
  }

  async authenticate(username: string, password: string): Promise<AuthResult> {
    try {
      const user = Array.from(this.users.values()).find(u => u.username === username);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid password' };
      }

      // Remove password hash from returned user object
      const { passwordHash, ...safeUser } = user;
      
      return { success: true, user: safeUser };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: 'Authentication failed' };
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
  }): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(
        u => u.username === userData.username || u.email === userData.email
      );

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user',
        passwordHash,
        createdAt: new Date()
      };

      this.users.set(user.id, user);

      // Remove password hash from returned user object
      const { passwordHash: _, ...safeUser } = user;
      
      return { success: true, user: safeUser };
    } catch (error) {
      console.error('User creation error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  async refreshToken(token: string): Promise<string> {
    try {
      if (this.blacklistedTokens.has(token)) {
        throw new Error('Token is blacklisted');
      }

      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Create new token with extended expiry
      const newToken = jwt.sign(
        { userId: decoded.userId, username: decoded.username },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      // Blacklist the old token
      this.blacklistedTokens.add(token);

      return newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  async invalidateToken(token: string): Promise<void> {
    this.blacklistedTokens.add(token);
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      if (this.blacklistedTokens.has(token)) {
        return null;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = this.users.get(decoded.userId);
      
      if (!user) {
        return null;
      }

      // Remove password hash from returned user object
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  private async initializeDefaultUser(): Promise<void> {
    try {
      // Create default admin user if none exists
      if (this.users.size === 0) {
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const adminUser = {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@coursedesigner.com',
          role: 'admin' as const,
          passwordHash,
          createdAt: new Date()
        };

        this.users.set(adminUser.id, adminUser);
        console.log('Default admin user created. Username: admin, Password:', defaultPassword);
      }
    } catch (error) {
      console.error('Error initializing default user:', error);
    }
  }
}

// services/LoggingService.ts
import fs from 'fs/promises';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  service?: string;
}

export class LoggingService {
  private logDir: string;
  private logLevel: LogLevel;

  constructor(logDir: string = './logs', logLevel: LogLevel = 'info') {
    this.logDir = logDir;
    this.logLevel = logLevel;
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  async log(level: LogLevel, message: string, metadata?: any, service?: string): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      service
    };

    // Log to console
    this.logToConsole(logEntry);

    // Log to file
    await this.logToFile(logEntry);
  }

  async debug(message: string, metadata?: any, service?: string): Promise<void> {
    await this.log('debug', message, metadata, service);
  }

  async info(message: string, metadata?: any, service?: string): Promise<void> {
    await this.log('info', message, metadata, service);
  }

  async warn(message: string, metadata?: any, service?: string): Promise<void> {
    await this.log('warn', message, metadata, service);
  }

  async error(message: string, metadata?: any, service?: string): Promise<void> {
    await this.log('error', message, metadata, service);
  }

  private logToConsole(entry: LogEntry): void {
    const color = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m'  // Red
    };

    const reset = '\x1b[0m';
    const servicePrefix = entry.service ? `[${entry.service}] ` : '';
    
    console.log(
      `${color[entry.level]}[${entry.level.toUpperCase()}]${reset} ` +
      `${entry.timestamp} ${servicePrefix}${entry.message}`,
      entry.metadata ? entry.metadata : ''
    );
  }

  private async logToFile(entry: LogEntry): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `${date}.log`;
      const filepath = path.join(this.logDir, filename);
      
      const logLine = JSON.stringify(entry) + '\n';
      
      await fs.appendFile(filepath, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  async getLogs(date?: string, level?: LogLevel, service?: string, limit: number = 100): Promise<LogEntry[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const filename = `${targetDate}.log`;
      const filepath = path.join(this.logDir, filename);
      
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.trim().split('\n');
      
      let logs = lines
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line) as LogEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is LogEntry => entry !== null);

      // Apply filters
      if (level) {
        logs = logs.filter(entry => entry.level === level);
      }
      
      if (service) {
        logs = logs.filter(entry => entry.service === service);
      }

      // Return most recent logs first, limited to the specified count
      return logs.slice(-limit).reverse();
    } catch (error) {
      console.error('Error reading log file:', error);
      return [];
    }
  }

  async clearLogs(olderThanDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const dateString = file.replace('.log', '');
          const fileDate = new Date(dateString);
          
          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(this.logDir, file));
            console.log(`Deleted old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing old logs:', error);
    }
  }
} courseAgentService: any; // Injected dependency

  constructor(courseAgentService: any) {
    this.courseAgentService = courseAgentService;
  }

  async extractCourseData(threadId?: string): Promise<CourseData> {
    try {
      // Get current state from the agent
      const state = await this.courseAgentService.getCurrentState(threadId);
      
      if (!state.draft) {
        throw new Error('No course content found. Please generate a course first.');
      }

      // Extract structured data from the draft content
      const courseData = this.parseCourseDraft(state.draft, state.plan);
      
      return courseData;
    } catch (error) {
      console.error('Error extracting course data:', error);
      throw new Error('Failed to extract course data');
    }
  }

  async generatePreviewHtml(courseData: CourseData): Promise<string> {
    return this.generateTableHtml(courseData);
  }

  async exportToCsv(courseData: CourseData): Promise<Buffer> {
    const csvContent = this.generateCsvContent(courseData);
    return Buffer.from(csvContent, 'utf-8');
  }

  async exportToExcel(courseData: CourseData): Promise<Buffer> {
    const data = this.prepareCourseDataForExport(courseData);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Course Design');
    
    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  }

  async exportToPdf(courseData: CourseData): Promise<Buffer> {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Course Design Table', 20, 20);
    
    // Course details
    doc.setFontSize(12);
    let yPosition = 40;
    
    const addRow = (label: string, value: string) => {
      doc.setFont(undefined, 'bold');
      doc.text(label + ':', 20, yPosition);
      doc.setFont(undefined, 'normal');
      
      // Handle text wrapping
      const splitValue = doc.splitTextToSize(value, 150);
      doc.text(splitValue, 50, yPosition);
      yPosition += splitValue.length * 7;
    };

    addRow('Title', courseData.title);
    addRow('Teaching Goal', courseData.teaching_goal);
    addRow('Teaching Method', courseData.teaching_method);
    
    yPosition += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Course Content:', 20, yPosition);
    yPosition += 10;
    
    courseData.topics.forEach((topic, index) => {
      doc.setFont(undefined, 'normal');
      const topicText = `${index + 1}. ${topic}`;
      const splitTopic = doc.splitTextToSize(topicText, 170);
      doc.text(splitTopic, 20, yPosition);
      yPosition += splitTopic.length * 7;
    });

    if (courseData.references.length > 0) {
      yPosition += 10;
      doc.setFont(undefined, 'bold');
      doc.text('References:', 20, yPosition);
      yPosition += 10;
      
      courseData.references.forEach((ref, index) => {
        doc.setFont(undefined, 'normal');
        const refText = `${index + 1}. ${ref}`;
        const splitRef = doc.splitTextToSize(refText, 170);
        doc.text(splitRef, 20, yPosition);
        yPosition += splitRef.length * 7;
      });
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  async getSupportedFormats(): Promise<string[]> {
    return ['csv', 'xlsx', 'pdf', 'html'];
  }

  private