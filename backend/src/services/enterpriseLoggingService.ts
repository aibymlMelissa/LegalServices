import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, WriteStream } from 'fs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  service?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  stackTrace?: string;
}

export interface LoggingConfig {
  logDir: string;
  logLevel: LogLevel;
  maxFileSize: number;
  maxFiles: number;
  rotationInterval: 'hourly' | 'daily' | 'weekly';
  enableConsole: boolean;
  enableFile: boolean;
  enableStructuredLogging: boolean;
  timestampFormat: 'iso' | 'unix' | 'readable';
}

export interface LogAnalytics {
  totalEntries: number;
  entriesByLevel: Record<LogLevel, number>;
  errorRate: number;
  avgResponseTime?: number;
  topErrors: Array<{ message: string; count: number }>;
  activeServices: string[];
  timeRange: {
    start: string;
    end: string;
  };
}

export interface LogQuery {
  level?: LogLevel[];
  service?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class EnterpriseLoggingService {
  private config: LoggingConfig;
  private currentLogStream?: WriteStream;
  private currentLogFile?: string;
  private rotationTimer?: NodeJS.Timeout;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      logDir: './logs',
      logLevel: 'info',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      rotationInterval: 'daily',
      enableConsole: true,
      enableFile: true,
      enableStructuredLogging: true,
      timestampFormat: 'iso',
      ...config
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.ensureLogDirectory();
      await this.setupFileLogging();
      this.setupRotation();
      this.setupBufferFlush();
      
      console.log(`📋 Enterprise Logging Service initialized: ${this.config.logDir}`);
      await this.info('Logging service started', { 
        config: this.config,
        nodeVersion: process.version,
        platform: process.platform
      }, 'logging-service');
    } catch (error) {
      console.error('Failed to initialize logging service:', error);
    }
  }

  /**
   * Log messages with different levels
   */
  async log(
    level: LogLevel, 
    message: string, 
    metadata?: any, 
    service?: string,
    userId?: string,
    requestId?: string,
    duration?: number
  ): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      metadata,
      service,
      userId,
      requestId,
      duration
    };

    // Add stack trace for errors
    if (level === 'error' || level === 'fatal') {
      logEntry.stackTrace = new Error().stack;
    }

    // Add to buffer for batched writing
    this.logBuffer.push(logEntry);

    // Immediate flush for critical logs
    if (level === 'fatal' || level === 'error') {
      await this.flushBuffer();
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }
  }

  async debug(message: string, metadata?: any, service?: string, userId?: string, requestId?: string): Promise<void> {
    await this.log('debug', message, metadata, service, userId, requestId);
  }

  async info(message: string, metadata?: any, service?: string, userId?: string, requestId?: string): Promise<void> {
    await this.log('info', message, metadata, service, userId, requestId);
  }

  async warn(message: string, metadata?: any, service?: string, userId?: string, requestId?: string): Promise<void> {
    await this.log('warn', message, metadata, service, userId, requestId);
  }

  async error(message: string, metadata?: any, service?: string, userId?: string, requestId?: string): Promise<void> {
    await this.log('error', message, metadata, service, userId, requestId);
  }

  async fatal(message: string, metadata?: any, service?: string, userId?: string, requestId?: string): Promise<void> {
    await this.log('fatal', message, metadata, service, userId, requestId);
  }

  /**
   * Specialized logging methods
   */
  async logAPIRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string
  ): Promise<void> {
    await this.info(`API ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      type: 'api_request'
    }, 'api', userId, requestId, duration);
  }

  async logUserAction(
    action: string,
    userId: string,
    details?: any,
    requestId?: string
  ): Promise<void> {
    await this.info(`User action: ${action}`, {
      action,
      userId,
      details,
      type: 'user_action'
    }, 'user-activity', userId, requestId);
  }

  async logSystemEvent(
    event: string,
    severity: LogLevel,
    details?: any
  ): Promise<void> {
    await this.log(severity, `System event: ${event}`, {
      event,
      details,
      type: 'system_event'
    }, 'system');
  }

  async logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    service?: string
  ): Promise<void> {
    await this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      type: 'performance'
    }, service || 'performance');
  }

  /**
   * Query and analyze logs
   */
  async queryLogs(query: LogQuery = {}): Promise<LogEntry[]> {
    const logFiles = await this.getLogFiles();
    const results: LogEntry[] = [];

    for (const file of logFiles) {
      try {
        const entries = await this.readLogFile(file);
        const filtered = this.filterLogEntries(entries, query);
        results.push(...filtered);
      } catch (error) {
        console.error(`Error reading log file ${file}:`, error);
      }
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return results.slice(offset, offset + limit);
  }

  async getLogAnalytics(dateFrom?: string, dateTo?: string): Promise<LogAnalytics> {
    const query: LogQuery = {};
    if (dateFrom) query.dateFrom = dateFrom;
    if (dateTo) query.dateTo = dateTo;
    
    const logs = await this.queryLogs({ ...query, limit: 10000 });

    const analytics: LogAnalytics = {
      totalEntries: logs.length,
      entriesByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0
      },
      errorRate: 0,
      topErrors: [],
      activeServices: [],
      timeRange: {
        start: dateFrom || (logs.length > 0 ? logs[logs.length - 1].timestamp : ''),
        end: dateTo || (logs.length > 0 ? logs[0].timestamp : '')
      }
    };

    // Count by level
    const errorMap = new Map<string, number>();
    const serviceSet = new Set<string>();
    let totalDuration = 0;
    let durationCount = 0;

    logs.forEach(log => {
      analytics.entriesByLevel[log.level]++;

      if (log.level === 'error' || log.level === 'fatal') {
        const key = log.message.substring(0, 100);
        errorMap.set(key, (errorMap.get(key) || 0) + 1);
      }

      if (log.service) {
        serviceSet.add(log.service);
      }

      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
    });

    // Calculate error rate
    const errorCount = analytics.entriesByLevel.error + analytics.entriesByLevel.fatal;
    analytics.errorRate = logs.length > 0 ? Math.round((errorCount / logs.length) * 100) : 0;

    // Average response time
    if (durationCount > 0) {
      analytics.avgResponseTime = Math.round(totalDuration / durationCount);
    }

    // Top errors
    analytics.topErrors = Array.from(errorMap.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Active services
    analytics.activeServices = Array.from(serviceSet);

    return analytics;
  }

  /**
   * Log file management
   */
  async getLogFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.logDir);
      return files
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse();
    } catch (error) {
      console.error('Error listing log files:', error);
      return [];
    }
  }

  async archiveLogs(olderThanDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const archiveDir = path.join(this.config.logDir, 'archive');
      await fs.mkdir(archiveDir, { recursive: true });

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.config.logDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            const archivePath = path.join(archiveDir, file);
            await fs.rename(filePath, archivePath);
            console.log(`📦 Archived log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error archiving logs:', error);
    }
  }

  async clearLogs(olderThanDays: number = 90): Promise<void> {
    try {
      const archiveDir = path.join(this.config.logDir, 'archive');
      const files = await fs.readdir(archiveDir).catch(() => []);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(archiveDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`🗑️ Deleted old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing old logs:', error);
    }
  }

  /**
   * Export logs
   */
  async exportLogs(
    query: LogQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<Buffer> {
    const logs = await this.queryLogs(query);

    if (format === 'csv') {
      return this.exportLogsAsCsv(logs);
    } else {
      return Buffer.from(JSON.stringify(logs, null, 2), 'utf-8');
    }
  }

  private exportLogsAsCsv(logs: LogEntry[]): Buffer {
    const headers = ['timestamp', 'level', 'message', 'service', 'userId', 'requestId', 'duration'];
    const rows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        `"${log.timestamp}"`,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.service || '',
        log.userId || '',
        log.requestId || '',
        log.duration || ''
      ];
      rows.push(row.join(','));
    });

    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down logging service...');

    // Clear timers
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Flush remaining logs
    await this.flushBuffer();

    // Close file stream
    if (this.currentLogStream) {
      this.currentLogStream.end();
    }

    console.log('✅ Logging service shut down');
  }

  // Private helper methods
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.logDir, { recursive: true });
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  private async setupFileLogging(): Promise<void> {
    if (!this.config.enableFile) return;

    await this.rotateLogFile();
  }

  private setupRotation(): void {
    let interval: number;
    
    switch (this.config.rotationInterval) {
      case 'hourly':
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case 'daily':
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'weekly':
        interval = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
    }

    this.rotationTimer = setInterval(() => {
      this.rotateLogFile();
    }, interval);
  }

  private setupBufferFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, 5000); // Flush every 5 seconds
  }

  private async rotateLogFile(): Promise<void> {
    try {
      // Close current stream
      if (this.currentLogStream) {
        this.currentLogStream.end();
      }

      // Generate new log file name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `app-${timestamp}.log`;
      const filepath = path.join(this.config.logDir, filename);

      // Create new stream
      this.currentLogFile = filepath;
      this.currentLogStream = createWriteStream(filepath, { flags: 'a' });

      console.log(`📝 Rotated to new log file: ${filename}`);

      // Clean up old files
      await this.cleanupOldLogFiles();
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  private async cleanupOldLogFiles(): Promise<void> {
    try {
      const files = await this.getLogFiles();
      
      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles);
        
        for (const file of filesToDelete) {
          const filepath = path.join(this.config.logDir, file);
          await fs.unlink(filepath);
          console.log(`🗑️ Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old log files:', error);
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.enableFile || !this.currentLogStream) {
      return;
    }

    const logsToWrite = [...this.logBuffer];
    this.logBuffer = [];

    try {
      for (const log of logsToWrite) {
        const logLine = this.formatLogEntry(log) + '\n';
        this.currentLogStream.write(logLine);
      }
    } catch (error) {
      console.error('Error writing to log file:', error);
      // Put logs back in buffer
      this.logBuffer.unshift(...logsToWrite);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.enableStructuredLogging) {
      return JSON.stringify(entry);
    } else {
      const parts = [
        entry.timestamp,
        `[${entry.level.toUpperCase()}]`,
        entry.service ? `[${entry.service}]` : '',
        entry.message
      ].filter(Boolean);

      return parts.join(' ');
    }
  }

  private formatTimestamp(): string {
    const now = new Date();
    
    switch (this.config.timestampFormat) {
      case 'unix':
        return now.getTime().toString();
      case 'readable':
        return now.toLocaleString();
      case 'iso':
      default:
        return now.toISOString();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private logToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m'  // Magenta
    };

    const reset = '\x1b[0m';
    const servicePrefix = entry.service ? `[${entry.service}] ` : '';
    const durationSuffix = entry.duration ? ` (${entry.duration}ms)` : '';
    
    console.log(
      `${colors[entry.level]}[${entry.level.toUpperCase()}]${reset} ` +
      `${entry.timestamp} ${servicePrefix}${entry.message}${durationSuffix}`,
      entry.metadata ? entry.metadata : ''
    );

    if (entry.stackTrace && (entry.level === 'error' || entry.level === 'fatal')) {
      console.log(entry.stackTrace);
    }
  }

  private async readLogFile(filename: string): Promise<LogEntry[]> {
    const filepath = path.join(this.config.logDir, filename);
    const content = await fs.readFile(filepath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    const entries: LogEntry[] = [];
    
    for (const line of lines) {
      try {
        if (this.config.enableStructuredLogging) {
          entries.push(JSON.parse(line));
        } else {
          // Parse simple format (basic implementation)
          const parsed = this.parseSimpleLogLine(line);
          if (parsed) entries.push(parsed);
        }
      } catch (error) {
        // Skip invalid lines
      }
    }
    
    return entries;
  }

  private parseSimpleLogLine(line: string): LogEntry | null {
    // Basic parser for simple log format
    const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z) \[(\w+)\] (?:\[([^\]]+)\] )?(.+)/);
    
    if (!match) return null;
    
    return {
      timestamp: match[1],
      level: match[2].toLowerCase() as LogLevel,
      service: match[3] || undefined,
      message: match[4]
    };
  }

  private filterLogEntries(entries: LogEntry[], query: LogQuery): LogEntry[] {
    return entries.filter(entry => {
      // Level filter
      if (query.level && !query.level.includes(entry.level)) {
        return false;
      }

      // Service filter
      if (query.service && entry.service !== query.service) {
        return false;
      }

      // User filter
      if (query.userId && entry.userId !== query.userId) {
        return false;
      }

      // Date range filter
      if (query.dateFrom || query.dateTo) {
        const entryDate = new Date(entry.timestamp);
        
        if (query.dateFrom && entryDate < new Date(query.dateFrom)) {
          return false;
        }
        
        if (query.dateTo && entryDate > new Date(query.dateTo)) {
          return false;
        }
      }

      // Search filter
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        const messageMatch = entry.message.toLowerCase().includes(searchLower);
        const metadataMatch = entry.metadata && 
          JSON.stringify(entry.metadata).toLowerCase().includes(searchLower);
        
        if (!messageMatch && !metadataMatch) {
          return false;
        }
      }

      return true;
    });
  }
}

// Create and export singleton instance
export const enterpriseLogger = new EnterpriseLoggingService({
  logLevel: process.env.LOG_LEVEL as LogLevel || 'info',
  enableConsole: process.env.NODE_ENV !== 'test',
  enableFile: process.env.ENABLE_FILE_LOGGING !== 'false'
});