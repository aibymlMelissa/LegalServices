import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';
import { VectorSearchService } from './vectorSearchService';

export interface ProcessedMaterial {
  id: string;
  filename: string;
  title: string;
  content: string;
  metadata: {
    size: number;
    type: string;
    lastModified: string;
    processingTime: string;
    extractedPages?: number;
    wordCount: number;
    language?: string;
  };
  chunks: MaterialChunk[];
}

export interface MaterialChunk {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: {
    startPosition: number;
    endPosition: number;
    wordCount: number;
  };
}

export interface MaterialAnalysis {
  keyTopics: string[];
  academicLevel: 'beginner' | 'intermediate' | 'advanced';
  subjectAreas: string[];
  recommendedUse: string[];
  qualityScore: number;
  relevanceKeywords: string[];
}

export class MaterialProcessingService {
  private materialsDir: string;
  private vectorService: VectorSearchService;
  private processedMaterials: Map<string, ProcessedMaterial> = new Map();

  constructor(materialsDir: string = './teaching_materials', vectorService: VectorSearchService) {
    this.materialsDir = materialsDir;
    this.vectorService = vectorService;
    this.ensureMaterialsDirectory();
  }

  private async ensureMaterialsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.materialsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating materials directory:', error);
    }
  }

  /**
   * Process uploaded files and extract content
   */
  async processUploadedFiles(files: Express.Multer.File[]): Promise<ProcessedMaterial[]> {
    const results: ProcessedMaterial[] = [];
    
    for (const file of files) {
      try {
        const processed = await this.processFile(file.path, file.originalname);
        results.push(processed);
        
        // Index in vector store for semantic search
        await this.indexMaterialInVectorStore(processed);
        
        // Cache the processed material
        this.processedMaterials.set(processed.id, processed);
        
        console.log(`Successfully processed: ${file.originalname}`);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Process a single file
   */
  async processFile(filePath: string, originalName: string): Promise<ProcessedMaterial> {
    const startTime = Date.now();
    const stats = await fs.stat(filePath);
    const extension = path.extname(originalName).toLowerCase();
    
    // Extract content based on file type
    let content = '';
    let extractedPages = 0;
    
    switch (extension) {
      case '.txt':
      case '.md':
        content = await fs.readFile(filePath, 'utf-8');
        break;
      case '.pdf':
        const pdfData = await this.extractPdfContent(filePath);
        content = pdfData.text;
        extractedPages = pdfData.pages;
        break;
      case '.docx':
        content = await this.extractDocxContent(filePath);
        break;
      case '.html':
      case '.htm':
        content = await this.extractHtmlContent(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
    
    // Clean and normalize content
    content = this.cleanContent(content);
    
    // Generate chunks for better processing
    const chunks = this.createContentChunks(content);
    
    // Create processed material object
    const processed: ProcessedMaterial = {
      id: this.generateMaterialId(originalName),
      filename: originalName,
      title: this.extractTitle(content, originalName),
      content,
      metadata: {
        size: stats.size,
        type: this.getFileType(extension),
        lastModified: stats.mtime.toISOString(),
        processingTime: new Date().toISOString(),
        extractedPages,
        wordCount: this.countWords(content),
        language: this.detectLanguage(content)
      },
      chunks
    };
    
    console.log(`Processed ${originalName}: ${processed.metadata.wordCount} words, ${chunks.length} chunks`);
    return processed;
  }

  /**
   * Analyze material content for educational value
   */
  async analyzeMaterial(materialId: string): Promise<MaterialAnalysis> {
    const material = this.processedMaterials.get(materialId);
    if (!material) {
      throw new Error(`Material not found: ${materialId}`);
    }
    
    return {
      keyTopics: this.extractKeyTopics(material.content),
      academicLevel: this.assessAcademicLevel(material.content),
      subjectAreas: this.identifySubjectAreas(material.content),
      recommendedUse: this.suggestUseCase(material.content),
      qualityScore: this.calculateQualityScore(material),
      relevanceKeywords: this.extractRelevanceKeywords(material.content)
    };
  }

  /**
   * Search materials by content similarity
   */
  async searchMaterials(query: string, limit: number = 10): Promise<ProcessedMaterial[]> {
    try {
      // Use vector search for semantic similarity
      const searchResults = await this.vectorService.search(query, limit);
      
      // Map search results back to processed materials
      const materials: ProcessedMaterial[] = [];
      for (const result of searchResults) {
        const materialId = result.metadata?.materialId;
        if (materialId && this.processedMaterials.has(materialId)) {
          materials.push(this.processedMaterials.get(materialId)!);
        }
      }
      
      return materials;
    } catch (error) {
      console.error('Vector search failed, falling back to keyword search:', error);
      return this.keywordSearchMaterials(query, limit);
    }
  }

  /**
   * Get material recommendations for course parameters
   */
  async getRecommendedMaterials(courseParams: {
    title: string;
    target_audience: string;
    compulsory_areas: string[];
  }, limit: number = 5): Promise<ProcessedMaterial[]> {
    
    const searchQueries = [
      courseParams.title,
      ...courseParams.compulsory_areas,
      `${courseParams.target_audience} education`
    ];
    
    const allResults: ProcessedMaterial[] = [];
    
    for (const query of searchQueries) {
      const results = await this.searchMaterials(query, Math.ceil(limit / searchQueries.length));
      allResults.push(...results);
    }
    
    // Remove duplicates and rank by relevance
    const unique = this.deduplicateMaterials(allResults);
    return unique.slice(0, limit);
  }

  /**
   * Extract content from PDF
   */
  private async extractPdfContent(filePath: string): Promise<{ text: string; pages: number }> {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdf(dataBuffer);
    
    return {
      text: pdfData.text,
      pages: pdfData.numpages
    };
  }

  /**
   * Extract content from DOCX
   */
  private async extractDocxContent(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Extract content from HTML
   */
  private async extractHtmlContent(filePath: string): Promise<string> {
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const dom = new JSDOM(htmlContent);
    return dom.window.document.body?.textContent || '';
  }

  /**
   * Clean and normalize text content
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')                    // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')               // Remove excessive newlines
      .replace(/\s{2,}/g, ' ')                  // Remove excessive spaces
      .replace(/[^\S\n]{2,}/g, ' ')             // Normalize whitespace
      .trim();
  }

  /**
   * Create content chunks for better processing
   */
  private createContentChunks(content: string, chunkSize: number = 1000): MaterialChunk[] {
    const words = content.split(/\s+/);
    const chunks: MaterialChunk[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkContent = chunkWords.join(' ');
      
      chunks.push({
        id: `chunk_${i / chunkSize}`,
        content: chunkContent,
        chunkIndex: i / chunkSize,
        metadata: {
          startPosition: i,
          endPosition: Math.min(i + chunkSize, words.length),
          wordCount: chunkWords.length
        }
      });
    }
    
    return chunks;
  }

  /**
   * Extract title from content or filename
   */
  private extractTitle(content: string, filename: string): string {
    // Try to extract title from content (first heading or first line)
    const titleMatch = content.match(/^#\s+(.+?)$/m) || content.match(/^(.{1,100})[\n\r]/);
    
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    
    // Fall back to filename without extension
    return path.basename(filename, path.extname(filename));
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Detect content language (simplified)
   */
  private detectLanguage(content: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const words = content.toLowerCase().split(/\s+/).slice(0, 100);
    
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return englishCount > 5 ? 'en' : 'unknown';
  }

  /**
   * Get file type classification
   */
  private getFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      '.txt': 'text',
      '.md': 'markdown',
      '.pdf': 'pdf',
      '.docx': 'document',
      '.doc': 'document',
      '.html': 'html',
      '.htm': 'html',
      '.pptx': 'presentation',
      '.ppt': 'presentation'
    };
    
    return typeMap[extension] || 'unknown';
  }

  /**
   * Generate unique material ID
   */
  private generateMaterialId(filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const name = filename.replace(/[^a-zA-Z0-9]/g, '_');
    return `mat_${name}_${timestamp}_${random}`;
  }

  /**
   * Index material in vector store for semantic search
   */
  private async indexMaterialInVectorStore(material: ProcessedMaterial): Promise<void> {
    try {
      // Index each chunk separately for better granular search
      for (const chunk of material.chunks) {
        await this.vectorService.indexDocument(
          `${material.id}_${chunk.id}`,
          chunk.content,
          {
            materialId: material.id,
            filename: material.filename,
            title: material.title,
            chunkIndex: chunk.chunkIndex,
            fileType: material.metadata.type
          }
        );
      }
      
      // Also index the full content
      await this.vectorService.indexDocument(
        material.id,
        material.content,
        {
          materialId: material.id,
          filename: material.filename,
          title: material.title,
          fileType: material.metadata.type,
          wordCount: material.metadata.wordCount
        }
      );
      
    } catch (error) {
      console.error('Failed to index material in vector store:', error);
    }
  }

  /**
   * Fallback keyword search when vector search fails
   */
  private keywordSearchMaterials(query: string, limit: number): ProcessedMaterial[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: Array<{ material: ProcessedMaterial; score: number }> = [];
    
    for (const material of this.processedMaterials.values()) {
      const content = material.content.toLowerCase();
      let score = 0;
      
      // Calculate simple keyword matching score
      for (const word of queryWords) {
        const matches = (content.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      }
      
      if (score > 0) {
        results.push({ material, score });
      }
    }
    
    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.material);
  }

  /**
   * Extract key topics from content (simplified)
   */
  private extractKeyTopics(content: string): string[] {
    // Extract headings and important phrases
    const headings = content.match(/^#{1,3}\s+(.+?)$/gm) || [];
    const importantPhrases = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g) || [];
    
    const topics = [...headings, ...importantPhrases.slice(0, 10)]
      .map(topic => topic.replace(/^#{1,3}\s+/, '').trim())
      .filter(topic => topic.length > 3 && topic.length < 100)
      .slice(0, 10);
    
    return [...new Set(topics)];
  }

  /**
   * Assess academic level of content
   */
  private assessAcademicLevel(content: string): 'beginner' | 'intermediate' | 'advanced' {
    const advancedTerms = ['methodology', 'paradigm', 'theoretical framework', 'empirical', 'hypothesis'];
    const intermediateTerms = ['analysis', 'concept', 'principle', 'approach', 'strategy'];
    
    const advancedCount = advancedTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    
    const intermediateCount = intermediateTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    
    if (advancedCount >= 2) return 'advanced';
    if (intermediateCount >= 3) return 'intermediate';
    return 'beginner';
  }

  /**
   * Identify subject areas from content
   */
  private identifySubjectAreas(content: string): string[] {
    const subjectKeywords = {
      'business': ['business', 'management', 'strategy', 'marketing', 'finance'],
      'law': ['legal', 'law', 'regulation', 'compliance', 'court'],
      'technology': ['technology', 'digital', 'software', 'system', 'data'],
      'education': ['learning', 'teaching', 'education', 'student', 'curriculum'],
      'health': ['health', 'medical', 'patient', 'treatment', 'diagnosis']
    };
    
    const contentLower = content.toLowerCase();
    const subjects: string[] = [];
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      const matches = keywords.filter(keyword => contentLower.includes(keyword)).length;
      if (matches >= 2) {
        subjects.push(subject);
      }
    }
    
    return subjects;
  }

  /**
   * Suggest use cases for material
   */
  private suggestUseCase(content: string): string[] {
    const useCases: string[] = [];
    
    if (content.includes('case study') || content.includes('example')) {
      useCases.push('case study material');
    }
    
    if (content.match(/\b(definition|concept|theory)\b/gi)) {
      useCases.push('conceptual learning');
    }
    
    if (content.match(/\b(step|process|method|procedure)\b/gi)) {
      useCases.push('practical instruction');
    }
    
    if (content.match(/\b(research|study|analysis|findings)\b/gi)) {
      useCases.push('research reference');
    }
    
    return useCases.length > 0 ? useCases : ['general reference'];
  }

  /**
   * Calculate quality score for material
   */
  private calculateQualityScore(material: ProcessedMaterial): number {
    let score = 50; // Base score
    
    // Word count factor
    if (material.metadata.wordCount > 1000) score += 20;
    else if (material.metadata.wordCount > 500) score += 10;
    
    // Structure factor (presence of headings)
    const headingCount = (material.content.match(/^#{1,3}\s+/gm) || []).length;
    score += Math.min(headingCount * 5, 20);
    
    // Content richness (variety of sentences)
    const sentences = material.content.split(/[.!?]+/).length;
    const avgWordsPerSentence = material.metadata.wordCount / sentences;
    if (avgWordsPerSentence > 15 && avgWordsPerSentence < 30) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Extract relevance keywords
   */
  private extractRelevanceKeywords(content: string): string[] {
    // Extract frequently used important words
    const words = content.toLowerCase()
      .match(/\b[a-z]{4,}\b/g) || [];
    
    const frequency: Record<string, number> = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Get top frequent words
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Remove duplicate materials
   */
  private deduplicateMaterials(materials: ProcessedMaterial[]): ProcessedMaterial[] {
    const seen = new Set<string>();
    return materials.filter(material => {
      if (seen.has(material.id)) {
        return false;
      }
      seen.add(material.id);
      return true;
    });
  }

  /**
   * Get all processed materials
   */
  getProcessedMaterials(): ProcessedMaterial[] {
    return Array.from(this.processedMaterials.values());
  }

  /**
   * Get material by ID
   */
  getMaterial(id: string): ProcessedMaterial | null {
    return this.processedMaterials.get(id) || null;
  }

  /**
   * Clear all processed materials
   */
  clearMaterials(): void {
    this.processedMaterials.clear();
  }
}