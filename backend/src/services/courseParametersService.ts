import fs from 'fs/promises';
import path from 'path';

export interface CourseParameters {
  course_title: string;
  target_audience: string;
  teaching_style: string;
  teaching_objective: string;
  compulsory_areas: string[];
  duration?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  learning_outcomes?: string[];
  assessment_methods?: string[];
  materials_required?: string[];
  technology_requirements?: string[];
  metadata?: {
    created_at: string;
    updated_at: string;
    version: string;
    author: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export class CourseParametersService {
  private parametersDir: string;

  constructor(parametersDir: string = './course_parameters') {
    this.parametersDir = parametersDir;
    this.ensureParametersDirectory();
  }

  private async ensureParametersDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.parametersDir, { recursive: true });
      console.log(`📁 Course parameters directory ensured at: ${this.parametersDir}`);
    } catch (error) {
      console.error('Error creating parameters directory:', error);
    }
  }

  async listParameterFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.parametersDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      console.log(`📋 Found ${jsonFiles.length} parameter files`);
      return jsonFiles;
    } catch (error) {
      console.error('Error listing parameter files:', error);
      return [];
    }
  }

  async loadParameters(filename: string): Promise<CourseParameters> {
    try {
      const filePath = path.join(this.parametersDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const parameters: CourseParameters = JSON.parse(content);
      
      // Validate the loaded parameters
      const validation = await this.validateParameters(parameters);
      if (!validation.isValid) {
        console.warn(`⚠️ Loaded parameters have validation issues:`, validation.errors);
      }
      
      console.log(`✅ Parameters loaded from: ${filename}`);
      return parameters;
    } catch (error) {
      console.error('Error loading parameters:', error);
      throw new Error(`Failed to load parameters from ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveParameters(parameters: CourseParameters): Promise<string> {
    try {
      // Add metadata
      const parametersWithMeta = {
        ...parameters,
        metadata: {
          created_at: parameters.metadata?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: parameters.metadata?.version || '1.0.0',
          author: parameters.metadata?.author || 'Course Designer AI'
        }
      };

      // Validate parameters before saving
      const validation = await this.validateParameters(parametersWithMeta);
      if (!validation.isValid) {
        throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Generate safe filename from course title
      const safeTitle = this.sanitizeFilename(parameters.course_title);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${safeTitle}_${timestamp}_parameters.json`;
      const filePath = path.join(this.parametersDir, filename);
      
      // Save parameters to file
      await fs.writeFile(filePath, JSON.stringify(parametersWithMeta, null, 2), 'utf-8');
      
      console.log(`💾 Parameters saved to: ${filename}`);
      return filename;
    } catch (error) {
      console.error('Error saving parameters:', error);
      throw new Error(`Failed to save parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateParameters(filename: string, updates: Partial<CourseParameters>): Promise<void> {
    try {
      const existing = await this.loadParameters(filename);
      const updated = {
        ...existing,
        ...updates,
        metadata: {
          ...existing.metadata,
          updated_at: new Date().toISOString(),
          version: this.incrementVersion(existing.metadata?.version || '1.0.0')
        }
      };
      
      const filePath = path.join(this.parametersDir, filename);
      await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
      
      console.log(`🔄 Parameters updated in: ${filename}`);
    } catch (error) {
      console.error('Error updating parameters:', error);
      throw new Error(`Failed to update parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteParameters(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.parametersDir, filename);
      
      // Check if file exists
      await fs.access(filePath);
      
      // Create backup before deletion
      const backupDir = path.join(this.parametersDir, '.backup');
      await fs.mkdir(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `${Date.now()}_${filename}`);
      await fs.copyFile(filePath, backupPath);
      
      // Delete the file
      await fs.unlink(filePath);
      
      console.log(`🗑️ Parameters deleted (backed up): ${filename}`);
    } catch (error) {
      console.error('Error deleting parameters:', error);
      throw new Error(`Failed to delete parameters file: ${filename}`);
    }
  }

  async duplicateParameters(filename: string, newTitle: string): Promise<string> {
    try {
      const existing = await this.loadParameters(filename);
      const duplicate = {
        ...existing,
        course_title: newTitle,
        metadata: {
          ...existing.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      const newFilename = await this.saveParameters(duplicate);
      console.log(`📄 Parameters duplicated: ${filename} -> ${newFilename}`);
      return newFilename;
    } catch (error) {
      console.error('Error duplicating parameters:', error);
      throw new Error(`Failed to duplicate parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateParameters(parameters: CourseParameters): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!parameters.course_title || parameters.course_title.trim().length === 0) {
      errors.push('Course title is required');
    } else if (parameters.course_title.length < 5) {
      warnings.push('Course title is very short - consider a more descriptive title');
    } else if (parameters.course_title.length > 100) {
      warnings.push('Course title is very long - consider shortening for better readability');
    }

    if (!parameters.target_audience || parameters.target_audience.trim().length === 0) {
      warnings.push('Target audience is not specified - this helps with course customization');
    }

    if (!parameters.teaching_style || parameters.teaching_style.trim().length === 0) {
      warnings.push('Teaching style is not specified - this affects content delivery');
    }

    if (!parameters.teaching_objective || parameters.teaching_objective.trim().length === 0) {
      errors.push('Teaching objective is required for course generation');
    } else if (parameters.teaching_objective.length < 20) {
      warnings.push('Teaching objective is very brief - consider adding more detail');
    }

    // Compulsory areas validation
    if (!parameters.compulsory_areas || parameters.compulsory_areas.length === 0) {
      warnings.push('No compulsory areas specified - consider adding key topics to cover');
    } else {
      if (parameters.compulsory_areas.length > 10) {
        warnings.push('Many compulsory areas specified - consider prioritizing the most important ones');
      }
      
      // Check for empty or duplicate areas
      const cleanAreas = parameters.compulsory_areas.filter(area => area && area.trim().length > 0);
      const uniqueAreas = [...new Set(cleanAreas.map(area => area.toLowerCase()))];
      
      if (cleanAreas.length !== parameters.compulsory_areas.length) {
        warnings.push('Some compulsory areas are empty or whitespace-only');
      }
      
      if (uniqueAreas.length !== cleanAreas.length) {
        warnings.push('Duplicate compulsory areas detected - consider removing duplicates');
      }
    }

    // Optional field suggestions
    if (!parameters.duration) {
      suggestions?.push('Consider specifying course duration for better planning');
    }

    if (!parameters.difficulty_level) {
      suggestions?.push('Adding difficulty level helps with content appropriateness');
    }

    if (!parameters.prerequisites || parameters.prerequisites.length === 0) {
      suggestions?.push('Specifying prerequisites helps learners understand requirements');
    }

    if (!parameters.learning_outcomes || parameters.learning_outcomes.length === 0) {
      suggestions?.push('Adding specific learning outcomes improves course clarity');
    }

    // Content quality checks
    if (parameters.teaching_objective && parameters.course_title) {
      const objectiveLower = parameters.teaching_objective.toLowerCase();
      const titleLower = parameters.course_title.toLowerCase();
      
      if (!this.hasCommonWords(objectiveLower, titleLower)) {
        warnings.push('Teaching objective and course title seem unrelated - ensure alignment');
      }
    }

    // Assessment method recommendations
    if (!parameters.assessment_methods || parameters.assessment_methods.length === 0) {
      suggestions?.push('Consider specifying assessment methods for comprehensive evaluation');
    }

    const isValid = errors.length === 0;
    
    console.log(`🔍 Parameter validation: ${isValid ? 'PASSED' : 'FAILED'} (${errors.length} errors, ${warnings.length} warnings)`);
    
    return {
      isValid,
      errors,
      warnings,
      suggestions
    };
  }

  async getParameterStatistics(): Promise<{
    totalFiles: number;
    totalSizeBytes: number;
    averageFileSize: number;
    newestFile: { name: string; date: string } | null;
    oldestFile: { name: string; date: string } | null;
    mostCommonTargetAudience: string | null;
    mostCommonTeachingStyle: string | null;
  }> {
    try {
      const files = await this.listParameterFiles();
      
      if (files.length === 0) {
        return {
          totalFiles: 0,
          totalSizeBytes: 0,
          averageFileSize: 0,
          newestFile: null,
          oldestFile: null,
          mostCommonTargetAudience: null,
          mostCommonTeachingStyle: null
        };
      }

      let totalSize = 0;
      const fileDates: { name: string; date: Date }[] = [];
      const audiences: string[] = [];
      const styles: string[] = [];

      for (const file of files) {
        const filePath = path.join(this.parametersDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileDates.push({ name: file, date: stats.mtime });

        try {
          const params = await this.loadParameters(file);
          if (params.target_audience) audiences.push(params.target_audience);
          if (params.teaching_style) styles.push(params.teaching_style);
        } catch (error) {
          console.warn(`Could not load parameters from ${file} for statistics`);
        }
      }

      fileDates.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        totalFiles: files.length,
        totalSizeBytes: totalSize,
        averageFileSize: Math.round(totalSize / files.length),
        newestFile: fileDates.length > 0 ? {
          name: fileDates[fileDates.length - 1].name,
          date: fileDates[fileDates.length - 1].date.toISOString()
        } : null,
        oldestFile: fileDates.length > 0 ? {
          name: fileDates[0].name,
          date: fileDates[0].date.toISOString()
        } : null,
        mostCommonTargetAudience: this.getMostCommon(audiences),
        mostCommonTeachingStyle: this.getMostCommon(styles)
      };
    } catch (error) {
      console.error('Error getting parameter statistics:', error);
      throw new Error('Failed to get parameter statistics');
    }
  }

  private sanitizeFilename(title: string): string {
    return title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0');
    return `${parts[0]}.${parts[1]}.${patch + 1}`;
  }

  private hasCommonWords(text1: string, text2: string): boolean {
    const words1 = new Set(text1.split(' ').filter(word => word.length > 3));
    const words2 = new Set(text2.split(' ').filter(word => word.length > 3));
    
    for (const word of words1) {
      if (words2.has(word)) {
        return true;
      }
    }
    return false;
  }

  private getMostCommon<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    
    const counts: Map<T, number> = new Map();
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    
    let maxCount = 0;
    let mostCommon: T | null = null;
    
    for (const [item, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    
    return mostCommon;
  }
}

export const courseParametersService = new CourseParametersService();