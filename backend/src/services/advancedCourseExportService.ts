import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CourseData {
  title: string;
  teaching_goal: string;
  teaching_method: string;
  topics: string[] | CourseTopic[];
  references: string[];
  generated_metadata?: {
    generation_time: string;
    ai_model: string;
    material_sources: string[];
  };
  parameters?: {
    target_audience: string;
    duration?: string;
    difficulty_level?: string;
    prerequisites?: string[];
  };
}

export interface CourseTopic {
  title: string;
  description: string;
  learning_objectives: string[];
  content_outline: string;
  key_concepts: string[];
  practical_applications: string[];
  assessment_suggestions: string[];
  estimated_duration: string;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'html' | 'docx' | 'json';
  includeMetadata?: boolean;
  customTemplate?: string;
  styling?: {
    primaryColor?: string;
    fontFamily?: string;
    headerStyle?: string;
  };
  sections?: {
    includeTitlePage?: boolean;
    includeTableOfContents?: boolean;
    includeReferences?: boolean;
    includeMetadata?: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  data?: Buffer;
  filename: string;
  mimeType: string;
  error?: string;
  metadata: {
    exportTime: string;
    format: string;
    fileSize: number;
    sections: string[];
  };
}

export class AdvancedCourseExportService {
  private exportDir: string;

  constructor(exportDir: string = './course_exports') {
    this.exportDir = exportDir;
    this.ensureExportDirectory();
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('Error creating export directory:', error);
    }
  }

  /**
   * Main export method - supports multiple formats
   */
  async exportCourse(courseData: CourseData, options: ExportOptions): Promise<ExportResult> {
    const startTime = Date.now();
    console.log(`📤 Starting course export: ${options.format.toUpperCase()}`);

    try {
      let result: ExportResult;

      switch (options.format.toLowerCase()) {
        case 'csv':
          result = await this.exportToCsv(courseData, options);
          break;
        case 'xlsx':
          result = await this.exportToExcel(courseData, options);
          break;
        case 'html':
          result = await this.exportToHtml(courseData, options);
          break;
        case 'json':
          result = await this.exportToJson(courseData, options);
          break;
        case 'docx':
          result = await this.exportToDocx(courseData, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      const exportTime = Date.now() - startTime;
      console.log(`✅ Export completed in ${exportTime}ms: ${result.filename}`);

      return result;
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Export failed',
        metadata: {
          exportTime: new Date().toISOString(),
          format: options.format,
          fileSize: 0,
          sections: []
        }
      };
    }
  }

  /**
   * Export to CSV format
   */
  private async exportToCsv(courseData: CourseData, options: ExportOptions): Promise<ExportResult> {
    const rows: string[][] = [];
    
    // Header
    rows.push(['Course Design Table']);
    rows.push([]);
    
    // Basic course information
    rows.push(['Field', 'Value']);
    rows.push(['Title', courseData.title]);
    rows.push(['Teaching Goal', courseData.teaching_goal]);
    rows.push(['Teaching Method', courseData.teaching_method]);
    
    if (courseData.parameters?.target_audience) {
      rows.push(['Target Audience', courseData.parameters.target_audience]);
    }
    
    if (courseData.parameters?.duration) {
      rows.push(['Duration', courseData.parameters.duration]);
    }
    
    rows.push([]);
    rows.push(['Course Content']);
    rows.push([]);

    // Topics
    if (Array.isArray(courseData.topics)) {
      if (typeof courseData.topics[0] === 'string') {
        // Simple string topics
        (courseData.topics as string[]).forEach((topic, index) => {
          rows.push([`Topic ${index + 1}`, topic]);
        });
      } else {
        // Detailed topic objects
        (courseData.topics as CourseTopic[]).forEach((topic, index) => {
          rows.push([`Topic ${index + 1}`, topic.title]);
          rows.push(['Description', topic.description]);
          rows.push(['Duration', topic.estimated_duration]);
          
          if (topic.learning_objectives.length > 0) {
            rows.push(['Learning Objectives', topic.learning_objectives.join('; ')]);
          }
          
          if (topic.key_concepts.length > 0) {
            rows.push(['Key Concepts', topic.key_concepts.join('; ')]);
          }
          
          rows.push([]);
        });
      }
    }

    // References
    if (courseData.references.length > 0) {
      rows.push(['References']);
      courseData.references.forEach((ref, index) => {
        rows.push([`Reference ${index + 1}`, ref]);
      });
    }

    // Metadata
    if (options.includeMetadata && courseData.generated_metadata) {
      rows.push([]);
      rows.push(['Generation Metadata']);
      rows.push(['Generation Time', courseData.generated_metadata.generation_time]);
      rows.push(['AI Model', courseData.generated_metadata.ai_model]);
      rows.push(['Material Sources', courseData.generated_metadata.material_sources.join('; ')]);
    }

    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const buffer = Buffer.from(csvContent, 'utf-8');
    const filename = this.generateFilename(courseData.title, 'csv');

    return {
      success: true,
      data: buffer,
      filename,
      mimeType: 'text/csv',
      metadata: {
        exportTime: new Date().toISOString(),
        format: 'csv',
        fileSize: buffer.length,
        sections: ['header', 'content', 'references', ...(options.includeMetadata ? ['metadata'] : [])]
      }
    };
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(courseData: CourseData, options: ExportOptions): Promise<ExportResult> {
    const workbook = XLSX.utils.book_new();

    // Main course sheet
    const courseSheet = this.createCourseSheet(courseData, options);
    XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course Overview');

    // Detailed topics sheet (if topics are detailed)
    if (Array.isArray(courseData.topics) && courseData.topics.length > 0 && typeof courseData.topics[0] === 'object') {
      const topicsSheet = this.createTopicsSheet(courseData.topics as CourseTopic[]);
      XLSX.utils.book_append_sheet(workbook, topicsSheet, 'Detailed Topics');
    }

    // References sheet
    if (courseData.references.length > 0) {
      const referencesSheet = this.createReferencesSheet(courseData.references);
      XLSX.utils.book_append_sheet(workbook, referencesSheet, 'References');
    }

    // Metadata sheet
    if (options.includeMetadata && courseData.generated_metadata) {
      const metadataSheet = this.createMetadataSheet(courseData.generated_metadata);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const filename = this.generateFilename(courseData.title, 'xlsx');

    return {
      success: true,
      data: buffer,
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      metadata: {
        exportTime: new Date().toISOString(),
        format: 'xlsx',
        fileSize: buffer.length,
        sections: ['overview', 'topics', 'references', ...(options.includeMetadata ? ['metadata'] : [])]
      }
    };
  }

  /**
   * Export to HTML format
   */
  private async exportToHtml(courseData: CourseData, options: ExportOptions): Promise<ExportResult> {
    const html = this.generateHtmlContent(courseData, options);
    const buffer = Buffer.from(html, 'utf-8');
    const filename = this.generateFilename(courseData.title, 'html');

    return {
      success: true,
      data: buffer,
      filename,
      mimeType: 'text/html',
      metadata: {
        exportTime: new Date().toISOString(),
        format: 'html',
        fileSize: buffer.length,
        sections: ['header', 'content', 'topics', 'references']
      }
    };
  }

  /**
   * Export to JSON format
   */
  private async exportToJson(courseData: CourseData, options: ExportOptions): Promise<ExportResult> {
    const exportData = {
      ...courseData,
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_format: 'json',
        exporter_version: '2.0.0',
        options: options
      }
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonContent, 'utf-8');
    const filename = this.generateFilename(courseData.title, 'json');

    return {
      success: true,
      data: buffer,
      filename,
      mimeType: 'application/json',
      metadata: {
        exportTime: new Date().toISOString(),
        format: 'json',
        fileSize: buffer.length,
        sections: ['complete_data']
      }
    };
  }

  /**
   * Export to DOCX format (simplified version)
   */
  private async exportToDocx(courseData: CourseData, options: ExportOptions): Promise<ExportResult> {
    // This is a simplified implementation
    // In a full implementation, you would use a library like 'docx' to create proper Word documents
    const htmlContent = this.generateHtmlContent(courseData, options);
    const buffer = Buffer.from(htmlContent, 'utf-8');
    const filename = this.generateFilename(courseData.title, 'html'); // Using HTML as fallback

    return {
      success: true,
      data: buffer,
      filename,
      mimeType: 'text/html',
      metadata: {
        exportTime: new Date().toISOString(),
        format: 'docx_fallback',
        fileSize: buffer.length,
        sections: ['document_content']
      }
    };
  }

  /**
   * Generate preview HTML
   */
  async generatePreviewHtml(courseData: CourseData): Promise<string> {
    return this.generateHtmlContent(courseData, { format: 'html', includeMetadata: true });
  }

  /**
   * Parse course draft content from AI generation
   */
  parseCourseDraft(draft: string, plan?: string): CourseData {
    const courseData: CourseData = {
      title: "Course Title",
      teaching_goal: "Not specified",
      teaching_method: "Not specified",
      topics: [],
      references: []
    };

    // Extract course title
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

    // Extract topics
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

    // Extract references
    const refSection = this.extractReferencesSection(draft);
    if (refSection) {
      courseData.references = this.parseReferences(refSection);
    }

    return courseData;
  }

  // Helper methods
  private createCourseSheet(courseData: CourseData, options: ExportOptions) {
    const data = [
      ['Course Design Overview'],
      [],
      ['Field', 'Value'],
      ['Title', courseData.title],
      ['Teaching Goal', courseData.teaching_goal],
      ['Teaching Method', courseData.teaching_method],
    ];

    if (courseData.parameters?.target_audience) {
      data.push(['Target Audience', courseData.parameters.target_audience]);
    }

    data.push([]);
    data.push(['Course Topics']);

    if (Array.isArray(courseData.topics)) {
      courseData.topics.forEach((topic, index) => {
        if (typeof topic === 'string') {
          data.push([`Topic ${index + 1}`, topic]);
        } else {
          data.push([`Topic ${index + 1}`, topic.title]);
        }
      });
    }

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createTopicsSheet(topics: CourseTopic[]) {
    const data = [
      ['Topic Title', 'Description', 'Duration', 'Learning Objectives', 'Key Concepts', 'Assessment Suggestions']
    ];

    topics.forEach(topic => {
      data.push([
        topic.title,
        topic.description,
        topic.estimated_duration,
        topic.learning_objectives.join('; '),
        topic.key_concepts.join('; '),
        topic.assessment_suggestions.join('; ')
      ]);
    });

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createReferencesSheet(references: string[]) {
    const data = [['References']];
    references.forEach((ref, index) => {
      data.push([`${index + 1}. ${ref}`]);
    });
    return XLSX.utils.aoa_to_sheet(data);
  }

  private createMetadataSheet(metadata: any) {
    const data = [
      ['Metadata Field', 'Value'],
      ['Generation Time', metadata.generation_time],
      ['AI Model', metadata.ai_model],
      ['Material Sources', metadata.material_sources?.join('; ') || 'None']
    ];
    return XLSX.utils.aoa_to_sheet(data);
  }

  private generateHtmlContent(courseData: CourseData, options: ExportOptions): string {
    const primaryColor = options.styling?.primaryColor || '#1976d2';
    const fontFamily = options.styling?.fontFamily || 'Arial, sans-serif';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(courseData.title)}</title>
    <style>
        body {
            font-family: ${fontFamily};
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9f9;
        }
        .course-header {
            background: ${primaryColor};
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        .course-header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: ${primaryColor};
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 10px;
        }
        .topic-card {
            border: 1px solid #ddd;
            padding: 20px;
            margin: 15px 0;
            border-radius: 6px;
            background: #f8f9fa;
        }
        .topic-title {
            color: ${primaryColor};
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .metadata {
            background: #e8f4f8;
            padding: 15px;
            border-left: 4px solid ${primaryColor};
            font-size: 0.9em;
            color: #666;
        }
        ul {
            padding-left: 20px;
        }
        .export-info {
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 4px;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="course-header">
        <h1>${this.escapeHtml(courseData.title)}</h1>
        <p>AI-Generated Course Design</p>
    </div>

    <div class="section">
        <h2>Course Overview</h2>
        <p><strong>Teaching Goal:</strong> ${this.escapeHtml(courseData.teaching_goal)}</p>
        <p><strong>Teaching Method:</strong> ${this.escapeHtml(courseData.teaching_method)}</p>
        ${courseData.parameters?.target_audience ? 
          `<p><strong>Target Audience:</strong> ${this.escapeHtml(courseData.parameters.target_audience)}</p>` : ''}
        ${courseData.parameters?.duration ? 
          `<p><strong>Duration:</strong> ${this.escapeHtml(courseData.parameters.duration)}</p>` : ''}
    </div>

    <div class="section">
        <h2>Course Content</h2>
        ${this.generateTopicsHtml(courseData.topics)}
    </div>

    ${courseData.references.length > 0 ? `
    <div class="section">
        <h2>References</h2>
        <ul>
            ${courseData.references.map(ref => `<li>${this.escapeHtml(ref)}</li>`).join('')}
        </ul>
    </div>` : ''}

    ${options.includeMetadata && courseData.generated_metadata ? `
    <div class="section">
        <h2>Generation Metadata</h2>
        <div class="metadata">
            <p><strong>Generated:</strong> ${courseData.generated_metadata.generation_time}</p>
            <p><strong>AI Model:</strong> ${courseData.generated_metadata.ai_model}</p>
            <p><strong>Material Sources:</strong> ${courseData.generated_metadata.material_sources.length}</p>
        </div>
    </div>` : ''}

    <div class="export-info">
        Generated on ${new Date().toLocaleString()} | AI-Powered Course Creator
    </div>
</body>
</html>`;
  }

  private generateTopicsHtml(topics: string[] | CourseTopic[]): string {
    if (!Array.isArray(topics) || topics.length === 0) {
      return '<p>No topics specified.</p>';
    }

    if (typeof topics[0] === 'string') {
      return `<ul>${(topics as string[]).map(topic => `<li>${this.escapeHtml(topic)}</li>`).join('')}</ul>`;
    }

    return (topics as CourseTopic[]).map((topic, index) => `
      <div class="topic-card">
        <div class="topic-title">Topic ${index + 1}: ${this.escapeHtml(topic.title)}</div>
        <p>${this.escapeHtml(topic.description)}</p>
        <p><strong>Duration:</strong> ${this.escapeHtml(topic.estimated_duration)}</p>
        ${topic.learning_objectives.length > 0 ? `
          <p><strong>Learning Objectives:</strong></p>
          <ul>${topic.learning_objectives.map(obj => `<li>${this.escapeHtml(obj)}</li>`).join('')}</ul>
        ` : ''}
        ${topic.key_concepts.length > 0 ? `
          <p><strong>Key Concepts:</strong> ${topic.key_concepts.map(concept => this.escapeHtml(concept)).join(', ')}</p>
        ` : ''}
      </div>
    `).join('');
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
    let refItems = refSection.match(/(?:^|\n)[-•*]\s+([^\n]+)/g);
    
    if (!refItems) {
      refItems = refSection.match(/(?:^|\n)\d+\.\s+([^\n]+)/g);
    }
    
    if (!refItems) {
      refItems = refSection.split('\n').filter(line => line.trim());
    }

    return refItems.map(item => 
      item.replace(/^(?:\n)?[-•*]\s*|\d+\.\s*/, '').trim()
    ).filter(item => item.length > 0);
  }

  private generateFilename(title: string, extension: string): string {
    const safeTitle = title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 50);
    
    const timestamp = new Date().toISOString().split('T')[0];
    return `${safeTitle}_${timestamp}.${extension}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): string[] {
    return ['csv', 'xlsx', 'html', 'json', 'docx'];
  }

  /**
   * Get format details
   */
  getFormatDetails() {
    return {
      csv: { name: 'CSV', description: 'Comma-separated values', mimeType: 'text/csv' },
      xlsx: { name: 'Excel', description: 'Microsoft Excel workbook', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      html: { name: 'HTML', description: 'Web page format', mimeType: 'text/html' },
      json: { name: 'JSON', description: 'JavaScript Object Notation', mimeType: 'application/json' },
      docx: { name: 'Word', description: 'Microsoft Word document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    };
  }
}

export const advancedCourseExportService = new AdvancedCourseExportService();