import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';
import { MaterialProcessingService } from './materialProcessingService';
import { VectorSearchService } from './vectorSearchService';

export interface CourseParameters {
  course_title: string;
  target_audience: string;
  teaching_style: string;
  teaching_objective: string;
  compulsory_areas: string[];
}

export interface CourseGenerationRequest {
  parameters: CourseParameters;
  threadId?: string;
  useExistingMaterials?: boolean;
}

export interface CourseContent {
  title: string;
  description: string;
  teaching_goal: string;
  teaching_method: string;
  topics: CourseTopic[];
  references: string[];
  generated_metadata: {
    generation_time: string;
    ai_model: string;
    material_sources: string[];
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

export interface AgentWorkflowState {
  threadId: string;
  currentStep: 'analyzing' | 'planning' | 'generating' | 'enhancing' | 'reviewing' | 'completed';
  progress: number;
  parameters: CourseParameters;
  planningOutput: string;
  contentOutput: CourseContent | null;
  enhancementNotes: string;
  reviewFeedback: string;
  relevantMaterials: any[];
}

export class AICourseGenerationService {
  private openai: OpenAI;
  private prisma: PrismaClient;
  private materialService: MaterialProcessingService;
  private vectorService: VectorSearchService;
  private activeWorkflows: Map<string, AgentWorkflowState> = new Map();

  constructor(
    materialService: MaterialProcessingService,
    vectorService: VectorSearchService
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.prisma = new PrismaClient();
    this.materialService = materialService;
    this.vectorService = vectorService;
  }

  /**
   * Main entry point for AI-powered course generation
   */
  async generateCourse(request: CourseGenerationRequest): Promise<CourseContent> {
    const threadId = request.threadId || this.generateThreadId();
    
    // Initialize workflow state
    await this.initializeWorkflow(threadId, request);
    
    try {
      // Step 1: Analyze parameters and retrieve relevant materials
      await this.analyzeAndRetrieveMaterials(threadId);
      
      // Step 2: Generate course plan
      await this.generateCoursePlan(threadId);
      
      // Step 3: Generate detailed content
      await this.generateDetailedContent(threadId);
      
      // Step 4: Enhance with AI-driven improvements
      await this.enhanceContent(threadId);
      
      // Step 5: Final review and optimization
      await this.reviewAndOptimize(threadId);
      
      const workflow = this.activeWorkflows.get(threadId)!;
      return workflow.contentOutput!;
      
    } catch (error) {
      console.error('Course generation error:', error);
      throw new Error(`Failed to generate course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream-based course generation for real-time updates
   */
  async *generateCourseStream(request: CourseGenerationRequest): AsyncGenerator<{
    step: string;
    progress: number;
    message: string;
    data?: any;
  }> {
    const threadId = request.threadId || this.generateThreadId();
    
    await this.initializeWorkflow(threadId, request);
    
    try {
      yield { step: 'analyzing', progress: 10, message: 'Analyzing course parameters...' };
      await this.analyzeAndRetrieveMaterials(threadId);
      
      yield { step: 'planning', progress: 30, message: 'Generating course structure...' };
      await this.generateCoursePlan(threadId);
      
      const workflow = this.activeWorkflows.get(threadId)!;
      yield { 
        step: 'planning', 
        progress: 40, 
        message: 'Course plan completed', 
        data: { plan: workflow.planningOutput } 
      };
      
      yield { step: 'generating', progress: 50, message: 'Creating detailed content...' };
      await this.generateDetailedContent(threadId);
      
      yield { step: 'enhancing', progress: 70, message: 'Enhancing with AI improvements...' };
      await this.enhanceContent(threadId);
      
      yield { step: 'reviewing', progress: 90, message: 'Final review and optimization...' };
      await this.reviewAndOptimize(threadId);
      
      yield { 
        step: 'completed', 
        progress: 100, 
        message: 'Course generation completed!',
        data: { course: workflow.contentOutput }
      };
      
    } catch (error) {
      yield { 
        step: 'error', 
        progress: 0, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async initializeWorkflow(threadId: string, request: CourseGenerationRequest): Promise<void> {
    const workflow: AgentWorkflowState = {
      threadId,
      currentStep: 'analyzing',
      progress: 0,
      parameters: request.parameters,
      planningOutput: '',
      contentOutput: null,
      enhancementNotes: '',
      reviewFeedback: '',
      relevantMaterials: []
    };
    
    this.activeWorkflows.set(threadId, workflow);
  }

  private async analyzeAndRetrieveMaterials(threadId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(threadId)!;
    workflow.currentStep = 'analyzing';
    
    // Generate search queries from course parameters
    const searchQueries = this.generateSearchQueries(workflow.parameters);
    
    // Search for relevant materials using vector search
    let relevantMaterials: any[] = [];
    
    for (const query of searchQueries) {
      try {
        const results = await this.vectorService.search(query, 5);
        relevantMaterials.push(...results);
      } catch (error) {
        console.warn(`Search failed for query: ${query}`, error);
      }
    }
    
    // Remove duplicates and rank by relevance
    workflow.relevantMaterials = this.deduplicateAndRank(relevantMaterials);
    workflow.progress = 20;
  }

  private async generateCoursePlan(threadId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(threadId)!;
    workflow.currentStep = 'planning';
    
    const materialContext = this.formatMaterialsForPrompt(workflow.relevantMaterials);
    
    const planningPrompt = `You are an expert course designer. Create a comprehensive course plan based on these parameters:

Title: ${workflow.parameters.course_title}
Target Audience: ${workflow.parameters.target_audience}
Teaching Style: ${workflow.parameters.teaching_style}
Teaching Objective: ${workflow.parameters.teaching_objective}
Compulsory Areas: ${workflow.parameters.compulsory_areas.join(', ')}

Available Materials:
${materialContext}

Create a detailed course plan that includes:
1. Course introduction and overview (2 paragraphs)
2. 5-7 main topics with:
   - Clear titles
   - Detailed descriptions
   - Learning objectives
   - Key concepts to cover
   - Practical applications
   - Assessment suggestions
   - Estimated duration

Ensure the plan incorporates the compulsory areas and makes effective use of the available materials.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: planningPrompt }],
        temperature: 0.8,
        max_tokens: 3000
      });

      workflow.planningOutput = response.choices[0]?.message?.content || '';
      workflow.progress = 40;
    } catch (error) {
      throw new Error(`Planning generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateDetailedContent(threadId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(threadId)!;
    workflow.currentStep = 'generating';
    
    const contentPrompt = `Transform this course plan into comprehensive course content:

PLAN:
${workflow.planningOutput}

PARAMETERS:
- Title: ${workflow.parameters.course_title}
- Target Audience: ${workflow.parameters.target_audience}  
- Teaching Style: ${workflow.parameters.teaching_style}
- Teaching Objective: ${workflow.parameters.teaching_objective}
- Compulsory Areas: ${workflow.parameters.compulsory_areas.join(', ')}

Create a structured course with:
1. Clear course title and description
2. Teaching goals and methods
3. Detailed topics with:
   - Comprehensive learning objectives
   - Detailed content outlines
   - Key concepts and practical applications
   - Assessment suggestions
   - Duration estimates
4. References and materials

Format as a complete, ready-to-teach course that integrates AI and self-management learning techniques.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: contentPrompt }],
        temperature: 0.8,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content || '';
      workflow.contentOutput = this.parseGeneratedContent(content, workflow.parameters);
      workflow.progress = 60;
    } catch (error) {
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async enhanceContent(threadId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(threadId)!;
    workflow.currentStep = 'enhancing';
    
    if (!workflow.contentOutput) {
      throw new Error('No content to enhance');
    }
    
    const enhancementPrompt = `Review and enhance this course content for better learning outcomes:

${JSON.stringify(workflow.contentOutput, null, 2)}

Focus on:
1. AI integration opportunities
2. Self-learning techniques
3. Interactive elements
4. Practical business applications
5. Modern teaching methodologies
6. Assessment variety
7. Industry relevance

Provide specific enhancement suggestions and improved content where applicable.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: enhancementPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      workflow.enhancementNotes = response.choices[0]?.message?.content || '';
      
      // Apply enhancements to content
      await this.applyEnhancements(workflow);
      workflow.progress = 80;
    } catch (error) {
      console.warn('Enhancement failed, proceeding without:', error);
      workflow.progress = 80;
    }
  }

  private async reviewAndOptimize(threadId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(threadId)!;
    workflow.currentStep = 'reviewing';
    
    // Add final metadata and optimization
    if (workflow.contentOutput) {
      workflow.contentOutput.generated_metadata = {
        generation_time: new Date().toISOString(),
        ai_model: 'gpt-4',
        material_sources: workflow.relevantMaterials.map(m => m.source || 'unknown')
      };
      
      // Final quality check and optimization
      await this.performQualityCheck(workflow);
    }
    
    workflow.currentStep = 'completed';
    workflow.progress = 100;
  }

  private generateSearchQueries(parameters: CourseParameters): string[] {
    const queries = [
      parameters.course_title,
      ...parameters.compulsory_areas,
      `${parameters.target_audience} education`,
      `${parameters.teaching_style} teaching methods`,
      parameters.teaching_objective
    ];
    
    return queries.filter(q => q && q.trim().length > 0);
  }

  private formatMaterialsForPrompt(materials: any[]): string {
    if (!materials || materials.length === 0) {
      return 'No specific materials available - create content based on general knowledge.';
    }
    
    return materials.slice(0, 5).map((material, index) => 
      `Material ${index + 1}: ${material.content || material.title || 'Untitled'}`
    ).join('\n\n');
  }

  private deduplicateAndRank(materials: any[]): any[] {
    // Simple deduplication based on content similarity
    const seen = new Set();
    const unique = materials.filter(material => {
      const key = material.source || material.content?.substring(0, 100) || JSON.stringify(material);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    // Sort by relevance score if available
    return unique.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
  }

  private parseGeneratedContent(content: string, parameters: CourseParameters): CourseContent {
    // Parse the generated content into structured format
    // This is a simplified parser - you might want to use more sophisticated parsing
    
    const topics: CourseTopic[] = [];
    
    // Extract topics from content (simplified regex-based approach)
    const topicMatches = content.match(/(?:Topic|Module|Chapter)\s*\d*[:\-]?\s*(.+?)(?=(?:Topic|Module|Chapter)\s*\d*[:\-]|$)/gs);
    
    if (topicMatches) {
      topicMatches.forEach(match => {
        const lines = match.split('\n').filter(line => line.trim());
        const title = lines[0]?.replace(/^(?:Topic|Module|Chapter)\s*\d*[:\-]?\s*/, '') || 'Untitled Topic';
        
        topics.push({
          title: title.trim(),
          description: lines.slice(1, 3).join(' ').trim() || 'No description available',
          learning_objectives: this.extractListItems(match, 'objective'),
          content_outline: this.extractSection(match, 'outline') || 'Content to be developed',
          key_concepts: this.extractListItems(match, 'concept'),
          practical_applications: this.extractListItems(match, 'application'),
          assessment_suggestions: this.extractListItems(match, 'assessment'),
          estimated_duration: this.extractDuration(match) || '2-3 hours'
        });
      });
    }
    
    return {
      title: parameters.course_title,
      description: this.extractSection(content, 'description') || `A comprehensive course on ${parameters.course_title}`,
      teaching_goal: parameters.teaching_objective,
      teaching_method: parameters.teaching_style,
      topics,
      references: this.extractReferences(content),
      generated_metadata: {
        generation_time: new Date().toISOString(),
        ai_model: 'gpt-4',
        material_sources: []
      }
    };
  }

  private extractListItems(content: string, type: string): string[] {
    const regex = new RegExp(`${type}s?[:\\-]?\\s*([^\\n]*(?:\\n\\s*[-•*]\\s*[^\\n]*)*)`, 'i');
    const match = content.match(regex);
    
    if (match && match[1]) {
      return match[1]
        .split(/\n/)
        .map(item => item.replace(/^\s*[-•*]\s*/, '').trim())
        .filter(item => item.length > 0)
        .slice(0, 5);
    }
    
    return [];
  }

  private extractSection(content: string, section: string): string | null {
    const regex = new RegExp(`${section}[:\\-]?\\s*([^\\n]+(?:\\n(?!\\w+:)[^\\n]*)*)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractDuration(content: string): string | null {
    const durationMatch = content.match(/duration[:\\-]?\s*([^\\n]+)/i);
    return durationMatch ? durationMatch[1].trim() : null;
  }

  private extractReferences(content: string): string[] {
    const refSection = content.match(/references?[:\\-]?([^]*?)(?=\n\n|\n[A-Z]|$)/i);
    if (refSection && refSection[1]) {
      return refSection[1]
        .split('\n')
        .map(ref => ref.replace(/^\s*[-•*]\s*/, '').trim())
        .filter(ref => ref.length > 0)
        .slice(0, 10);
    }
    return [];
  }

  private async applyEnhancements(workflow: AgentWorkflowState): Promise<void> {
    // Apply the enhancement suggestions to improve the content
    // This is a placeholder for more sophisticated enhancement logic
    if (workflow.contentOutput && workflow.enhancementNotes) {
      // Could parse enhancement notes and apply specific improvements
      console.log('Applying enhancements based on AI feedback');
    }
  }

  private async performQualityCheck(workflow: AgentWorkflowState): Promise<void> {
    // Perform final quality checks
    if (workflow.contentOutput) {
      // Ensure all required fields are present
      if (!workflow.contentOutput.title) {
        workflow.contentOutput.title = workflow.parameters.course_title;
      }
      
      if (workflow.contentOutput.topics.length === 0) {
        // Add a default topic if none were generated
        workflow.contentOutput.topics.push({
          title: 'Introduction to ' + workflow.parameters.course_title,
          description: 'Course introduction and overview',
          learning_objectives: ['Understand course structure', 'Identify key learning goals'],
          content_outline: 'Course overview and expectations',
          key_concepts: workflow.parameters.compulsory_areas.slice(0, 3),
          practical_applications: ['Real-world case studies', 'Hands-on exercises'],
          assessment_suggestions: ['Quiz', 'Discussion participation'],
          estimated_duration: '1-2 hours'
        });
      }
    }
  }

  private generateThreadId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(threadId: string): Promise<AgentWorkflowState | null> {
    return this.activeWorkflows.get(threadId) || null;
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(threadId: string): Promise<void> {
    this.activeWorkflows.delete(threadId);
  }
}