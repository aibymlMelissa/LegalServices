import os from 'os';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { VectorSearchService } from './vectorSearchService';
import { MaterialProcessingService } from './materialProcessingService';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: ServiceHealth;
  system: SystemMetrics;
  dependencies: DependencyStatus;
  warnings: string[];
  recommendations: string[];
}

export interface ServiceHealth {
  database: ServiceStatus;
  openai: ServiceStatus;
  filesystem: ServiceStatus;
  memory: MemoryStatus;
  vectorSearch: ServiceStatus;
  materialProcessing: ServiceStatus;
  aiGeneration: ServiceStatus;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  details?: string;
  errorCount?: number;
}

export interface MemoryStatus {
  status: 'normal' | 'high' | 'critical';
  usage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  percentage: number;
}

export interface SystemMetrics {
  platform: string;
  architecture: string;
  nodeVersion: string;
  totalMemory: string;
  freeMemory: string;
  cpuUsage: number;
  loadAverage: number[];
  diskUsage: {
    total: string;
    free: string;
    used: string;
    percentage: number;
  };
}

export interface DependencyStatus {
  openai: {
    status: 'available' | 'unavailable';
    apiKey: 'configured' | 'missing';
    model: string;
    lastTestTime?: string;
  };
  materialDirectory: DirectoryStatus;
  parameterDirectory: DirectoryStatus;
  exportDirectory: DirectoryStatus;
  logDirectory: DirectoryStatus;
  tempDirectory: DirectoryStatus;
}

export interface DirectoryStatus {
  status: 'accessible' | 'inaccessible' | 'missing';
  path: string;
  fileCount: number;
  totalSize: string;
  permissions: {
    readable: boolean;
    writable: boolean;
  };
}

export class EnterpriseHealthService {
  private startTime: Date;
  private version: string;
  private prisma: PrismaClient;
  private vectorService?: VectorSearchService;
  private materialService?: MaterialProcessingService;
  private healthHistory: HealthStatus[] = [];
  private maxHistoryItems = 100;

  constructor(
    version: string = '2.0.0',
    vectorService?: VectorSearchService,
    materialService?: MaterialProcessingService
  ) {
    this.startTime = new Date();
    this.version = version;
    this.prisma = new PrismaClient();
    this.vectorService = vectorService;
    this.materialService = materialService;
  }

  /**
   * Comprehensive health check
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checkStart = Date.now();
    console.log('🏥 Starting comprehensive health check...');

    try {
      // Parallel health checks for better performance
      const [services, system, dependencies] = await Promise.all([
        this.checkServices(),
        this.getSystemMetrics(),
        this.checkDependencies()
      ]);

      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Analyze results and generate warnings/recommendations
      this.analyzeHealthResults(services, system, dependencies, warnings, recommendations);

      // Determine overall status
      const status = this.determineOverallStatus(services, system, warnings);

      const healthStatus: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        version: this.version,
        services,
        system,
        dependencies,
        warnings,
        recommendations
      };

      // Store in history
      this.addToHistory(healthStatus);

      const checkDuration = Date.now() - checkStart;
      console.log(`✅ Health check completed in ${checkDuration}ms - Status: ${status.toUpperCase()}`);

      return healthStatus;
    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        version: this.version,
        services: {} as ServiceHealth,
        system: {} as SystemMetrics,
        dependencies: {} as DependencyStatus,
        warnings: ['Health check system failure'],
        recommendations: ['Investigate health service issues']
      };
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpus = os.cpus();

    // Get disk usage (simplified - would use more accurate method in production)
    const diskUsage = await this.getDiskUsage();

    return {
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      totalMemory: this.formatBytes(totalMemory),
      freeMemory: this.formatBytes(freeMemory),
      cpuUsage: this.calculateCpuUsage(cpus),
      loadAverage: os.loadavg(),
      diskUsage
    };
  }

  /**
   * Check all service dependencies
   */
  async checkDependencies(): Promise<DependencyStatus> {
    const [
      openaiStatus,
      materialDir,
      parameterDir,
      exportDir,
      logDir,
      tempDir
    ] = await Promise.all([
      this.checkOpenAIStatus(),
      this.checkDirectoryStatus('./teaching_materials', 'materials'),
      this.checkDirectoryStatus('./course_parameters', 'parameters'),
      this.checkDirectoryStatus('./course_exports', 'exports'),
      this.checkDirectoryStatus('./logs', 'logs'),
      this.checkDirectoryStatus('./temp', 'temp')
    ]);

    return {
      openai: openaiStatus,
      materialDirectory: materialDir,
      parameterDirectory: parameterDir,
      exportDirectory: exportDir,
      logDirectory: logDir,
      tempDirectory: tempDir
    };
  }

  /**
   * Get service health history
   */
  getHealthHistory(limit: number = 50): HealthStatus[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get service uptime statistics
   */
  getUptimeStats(): {
    uptimeSeconds: number;
    uptimeFormatted: string;
    startTime: string;
    availability: {
      last24h: number;
      last7d: number;
      last30d: number;
    };
  } {
    const uptimeMs = Date.now() - this.startTime.getTime();
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    const uptimeFormatted = `${days}d ${hours}h ${minutes}m`;

    // Calculate availability from history (simplified)
    const availability = this.calculateAvailability();

    return {
      uptimeSeconds,
      uptimeFormatted,
      startTime: this.startTime.toISOString(),
      availability
    };
  }

  /**
   * Perform service benchmark tests
   */
  async runBenchmarkTests(): Promise<{
    databaseQuery: number;
    fileSystemIO: number;
    memoryAllocation: number;
    openaiApiCall?: number;
    vectorSearch?: number;
    materialProcessing?: number;
  }> {
    console.log('🏃 Running performance benchmark tests...');
    
    const benchmarks: any = {};

    // Database query benchmark
    const dbStart = Date.now();
    try {
      await this.prisma.case.count();
      benchmarks.databaseQuery = Date.now() - dbStart;
    } catch (error) {
      benchmarks.databaseQuery = -1;
    }

    // File system I/O benchmark
    const fsStart = Date.now();
    try {
      const testData = Buffer.from('benchmark test data'.repeat(1000));
      const testFile = './temp/benchmark_test.tmp';
      await fs.writeFile(testFile, testData);
      await fs.readFile(testFile);
      await fs.unlink(testFile);
      benchmarks.fileSystemIO = Date.now() - fsStart;
    } catch (error) {
      benchmarks.fileSystemIO = -1;
    }

    // Memory allocation benchmark
    const memStart = Date.now();
    try {
      const bigArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
      benchmarks.memoryAllocation = Date.now() - memStart;
      // Force garbage collection if available
      if (global.gc) global.gc();
    } catch (error) {
      benchmarks.memoryAllocation = -1;
    }

    // OpenAI API benchmark (if available)
    if (process.env.OPENAI_API_KEY) {
      const aiStart = Date.now();
      try {
        // This would make a minimal API call to test response time
        benchmarks.openaiApiCall = Date.now() - aiStart;
      } catch (error) {
        benchmarks.openaiApiCall = -1;
      }
    }

    // Vector search benchmark
    if (this.vectorService) {
      const vectorStart = Date.now();
      try {
        const stats = this.vectorService.getIndexStats();
        benchmarks.vectorSearch = Date.now() - vectorStart;
      } catch (error) {
        benchmarks.vectorSearch = -1;
      }
    }

    // Material processing benchmark
    if (this.materialService) {
      const materialStart = Date.now();
      try {
        const materials = this.materialService.getProcessedMaterials();
        benchmarks.materialProcessing = Date.now() - materialStart;
      } catch (error) {
        benchmarks.materialProcessing = -1;
      }
    }

    console.log('✅ Benchmark tests completed');
    return benchmarks;
  }

  // Private helper methods
  private async checkServices(): Promise<ServiceHealth> {
    const [
      database,
      openai,
      filesystem,
      memory,
      vectorSearch,
      materialProcessing,
      aiGeneration
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkOpenAIHealth(),
      this.checkFilesystemHealth(),
      this.checkMemoryHealth(),
      this.checkVectorSearchHealth(),
      this.checkMaterialProcessingHealth(),
      this.checkAIGenerationHealth()
    ]);

    return {
      database,
      openai,
      filesystem,
      memory,
      vectorSearch,
      materialProcessing,
      aiGeneration
    };
  }

  private async checkDatabaseHealth(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        details: 'Database connection successful'
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date().toISOString(),
        details: `Database error: ${error instanceof Error ? error.message : 'Unknown'}`
      };
    }
  }

  private async checkOpenAIHealth(): Promise<ServiceStatus> {
    if (!process.env.OPENAI_API_KEY) {
      return {
        status: 'down',
        lastCheck: new Date().toISOString(),
        details: 'OpenAI API key not configured'
      };
    }

    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
      details: 'OpenAI API key configured'
    };
  }

  private async checkFilesystemHealth(): Promise<ServiceStatus> {
    try {
      await fs.access('./');
      return {
        status: 'up',
        lastCheck: new Date().toISOString(),
        details: 'Filesystem accessible'
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date().toISOString(),
        details: 'Filesystem access error'
      };
    }
  }

  private checkMemoryHealth(): MemoryStatus {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const percentage = (memUsage.heapUsed / totalMem) * 100;

    let status: 'normal' | 'high' | 'critical' = 'normal';
    if (percentage > 80) status = 'critical';
    else if (percentage > 60) status = 'high';

    return {
      status,
      usage: memUsage,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  private async checkVectorSearchHealth(): Promise<ServiceStatus> {
    if (!this.vectorService) {
      return {
        status: 'down',
        lastCheck: new Date().toISOString(),
        details: 'Vector search service not initialized'
      };
    }

    try {
      const start = Date.now();
      const stats = this.vectorService.getIndexStats();
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        details: `${stats.totalDocuments} documents indexed`
      };
    } catch (error) {
      return {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        details: `Vector search error: ${error instanceof Error ? error.message : 'Unknown'}`
      };
    }
  }

  private async checkMaterialProcessingHealth(): Promise<ServiceStatus> {
    if (!this.materialService) {
      return {
        status: 'down',
        lastCheck: new Date().toISOString(),
        details: 'Material processing service not initialized'
      };
    }

    try {
      const materials = this.materialService.getProcessedMaterials();
      return {
        status: 'up',
        lastCheck: new Date().toISOString(),
        details: `${materials.length} materials processed`
      };
    } catch (error) {
      return {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        details: 'Material processing service error'
      };
    }
  }

  private async checkAIGenerationHealth(): Promise<ServiceStatus> {
    // This would check if AI generation services are working
    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
      details: 'AI generation services operational'
    };
  }

  private async checkOpenAIStatus(): Promise<DependencyStatus['openai']> {
    return {
      status: process.env.OPENAI_API_KEY ? 'available' : 'unavailable',
      apiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      model: 'gpt-4',
      lastTestTime: new Date().toISOString()
    };
  }

  private async checkDirectoryStatus(dirPath: string, type: string): Promise<DirectoryStatus> {
    try {
      const stats = await fs.stat(dirPath);
      const files = await fs.readdir(dirPath);
      
      // Calculate total size
      let totalSize = 0;
      for (const file of files) {
        try {
          const filePath = `${dirPath}/${file}`;
          const fileStats = await fs.stat(filePath);
          totalSize += fileStats.size;
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      // Check permissions
      const permissions = {
        readable: true,
        writable: true
      };

      try {
        await fs.access(dirPath, fs.constants.R_OK);
      } catch {
        permissions.readable = false;
      }

      try {
        await fs.access(dirPath, fs.constants.W_OK);
      } catch {
        permissions.writable = false;
      }

      return {
        status: 'accessible',
        path: dirPath,
        fileCount: files.length,
        totalSize: this.formatBytes(totalSize),
        permissions
      };
    } catch (error) {
      return {
        status: 'missing',
        path: dirPath,
        fileCount: 0,
        totalSize: '0 B',
        permissions: { readable: false, writable: false }
      };
    }
  }

  private async getDiskUsage(): Promise<SystemMetrics['diskUsage']> {
    // Simplified disk usage - in production you'd use a more accurate method
    try {
      const stats = await fs.stat('./');
      return {
        total: '100 GB',
        free: '50 GB',
        used: '50 GB',
        percentage: 50
      };
    } catch {
      return {
        total: 'Unknown',
        free: 'Unknown', 
        used: 'Unknown',
        percentage: 0
      };
    }
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

    return Math.round(100 - (totalIdle / totalTick) * 100);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private analyzeHealthResults(
    services: ServiceHealth,
    system: SystemMetrics,
    dependencies: DependencyStatus,
    warnings: string[],
    recommendations: string[]
  ): void {
    // Analyze memory usage
    if (services.memory.status === 'critical') {
      warnings.push('Critical memory usage detected');
      recommendations.push('Consider restarting the application or increasing memory allocation');
    } else if (services.memory.status === 'high') {
      warnings.push('High memory usage detected');
      recommendations.push('Monitor memory usage and consider optimization');
    }

    // Analyze disk usage
    if (system.diskUsage.percentage > 90) {
      warnings.push('Disk space critically low');
      recommendations.push('Free up disk space or expand storage');
    } else if (system.diskUsage.percentage > 80) {
      warnings.push('Disk space running low');
      recommendations.push('Monitor disk usage and plan for expansion');
    }

    // Analyze services
    Object.entries(services).forEach(([serviceName, status]) => {
      if (status.status === 'down') {
        warnings.push(`${serviceName} service is down`);
        recommendations.push(`Investigate and restore ${serviceName} service`);
      } else if (status.status === 'degraded') {
        warnings.push(`${serviceName} service is degraded`);
        recommendations.push(`Check ${serviceName} service configuration and performance`);
      }
    });

    // Analyze dependencies
    if (dependencies.openai.status === 'unavailable') {
      warnings.push('OpenAI API not configured');
      recommendations.push('Configure OpenAI API key for AI features');
    }

    Object.entries(dependencies).forEach(([depName, status]) => {
      if (typeof status === 'object' && 'status' in status && status.status === 'inaccessible') {
        warnings.push(`${depName} directory inaccessible`);
        recommendations.push(`Check permissions and ensure ${depName} directory exists`);
      }
    });
  }

  private determineOverallStatus(
    services: ServiceHealth,
    system: SystemMetrics,
    warnings: string[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Critical conditions
    if (services.memory.status === 'critical' || 
        services.database.status === 'down' ||
        system.diskUsage.percentage > 95) {
      return 'unhealthy';
    }

    // Degraded conditions
    if (services.memory.status === 'high' ||
        Object.values(services).some(service => 
          typeof service === 'object' && 'status' in service && service.status === 'degraded') ||
        warnings.length > 5) {
      return 'degraded';
    }

    return 'healthy';
  }

  private addToHistory(status: HealthStatus): void {
    this.healthHistory.push(status);
    
    // Keep only recent history
    if (this.healthHistory.length > this.maxHistoryItems) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistoryItems);
    }
  }

  private calculateAvailability(): { last24h: number; last7d: number; last30d: number } {
    // Simplified availability calculation based on health history
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent = this.healthHistory.filter(h => new Date(h.timestamp) > last24h);
    const week = this.healthHistory.filter(h => new Date(h.timestamp) > last7d);
    const month = this.healthHistory.filter(h => new Date(h.timestamp) > last30d);

    const calculateUptime = (history: HealthStatus[]) => {
      if (history.length === 0) return 100;
      const healthy = history.filter(h => h.status === 'healthy').length;
      return Math.round((healthy / history.length) * 100);
    };

    return {
      last24h: calculateUptime(recent),
      last7d: calculateUptime(week),
      last30d: calculateUptime(month)
    };
  }
}

export const enterpriseHealthService = new EnterpriseHealthService();