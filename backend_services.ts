// services/CourseParametersService.ts
import fs from 'fs/promises';
import path from 'path';
import { CourseParameters } from '../types/course';

export class CourseParametersService {
  private parametersDir: string;

  constructor(parametersDir: string = './course_parameters') {
    this.parametersDir = parametersDir;
    this.ensureParametersDirectory();
  }

  private async ensureParametersDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.parametersDir, { recursive: true });
    } catch (error) {
      console.error('Error creating parameters directory:', error);
    }
  }

  async listParameterFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.parametersDir);
      return files.filter(file => file.endsWith('.json'));
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
      this.validateParametersStructure(parameters);
      
      return parameters;
    } catch (error) {
      console.error('Error loading parameters:', error);
      throw new Error(`Failed to load parameters from ${filename}`);
    }
  }

  async saveParameters(parameters: CourseParameters): Promise<string> {
    try {
      // Validate parameters before saving
      this.validateParametersStructure(parameters);
      
      // Generate safe filename from course title
      const safeTitle = this.sanitizeFilename(parameters.course_title);
      const filename = `${safeTitle}_parameters.json`;
      const filePath = path.join(this.parametersDir, filename);
      
      // Save parameters to file
      await fs.writeFile(filePath, JSON.stringify(parameters, null, 2), 'utf-8');
      
      return filename;
    } catch (error) {
      console.error('Error saving parameters:', error);
      throw new Error('Failed to save parameters');
    }
  }

  async deleteParameters(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.parametersDir, filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting parameters:', error);
      throw new Error(`Failed to delete parameters file: ${filename}`);
    }
  }

  async validateParameters(parameters: CourseParameters): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!parameters.course_title || parameters.course_title.trim().length === 0) {
      errors.push('Course title is required');
    }

    if (!parameters.target_audience || parameters.target_audience.trim().length === 0) {
      warnings.push('Target audience is not specified');
    }

    if (!parameters.teaching_style || parameters.teaching_style.trim().length === 0) {
      warnings.push('Teaching style is not specified');
    }

    if (!parameters.teaching_objective || parameters.teaching_objective.trim().length === 0) {
      warnings.push('Teaching objective is not specified');
    }

    if (!parameters.compulsory_areas || parameters.compulsory_areas.length === 0) {
      warnings.push('No compulsory knowledge areas specified');
    }

    // Additional validation logic
    if (parameters.course_title && parameters.course_title.length > 100) {
      warnings.push('Course title is very long (>100 characters)');
    }

    if (parameters.compulsory_areas && parameters.compulsory_areas.length > 10) {
      warnings.push('Many compulsory areas specified (>10). Consider consolidating.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateParametersStructure(parameters: any): void {
    if (!parameters || typeof parameters !== 'object') {
      throw new Error('Invalid parameters structure');
    }

    const requiredFields = ['course_title', 'target_audience', 'teaching_style', 'teaching_objective', 'compulsory_areas'];
    for (const field of requiredFields) {
      if (!(field in parameters)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(parameters.compulsory_areas)) {
      throw new Error('compulsory_areas must be an array');
    }
  }

  private sanitizeFilename(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_')
      .substring(0, 50);
  }

  async createSampleParameters(): Promise<void> {
    const sampleParams: CourseParameters = {
      course_title: "Business Innovation and Sustainability",
      target_audience: "Graduate students",
      teaching_style: "Interactive and case-based",
      teaching_objective: "To develop skills in sustainable business management",
      compulsory_areas: [
        "Business Service Management with innovations",
        "Achieving Sustainable Development Goals",
        "Knowledge of environment social governance in decision making"
      ]
    };

    try {
      await this.saveParameters(sampleParams);
      console.log('Sample parameters created successfully');
    } catch (error) {
      console.error('Error creating sample parameters:', error);
    }
  }
}

// services/MaterialService.ts
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';

export interface MaterialInfo {
  filename: string;
  size: number;
  lastModified: string;
  type: string;
  extension: string;
}

export interface SearchResult {
  filename: string;
  content: string;
  score: number;
  matches: string[];
}

export class MaterialService {
  private materialsDir: string;

  constructor(materialsDir: string = './teaching_materials') {
    this.materialsDir = materialsDir;
    this.ensureMaterialsDirectory();
  }

  public getMaterialsDirectory(): string {
    return this.materialsDir;
  }

  private async ensureMaterialsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.materialsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating materials directory:', error);
    }
  }

  async processUploadedFiles(files: Express.Multer.File[]): Promise<string[]> {
    const results: string[] = [];
    
    for (const file of files) {
      try {
        // File is already saved by multer, so we just need to verify and process
        const filePath = path.join(this.materialsDir, file.filename);
        const stats = await fs.stat(filePath);
        
        results.push(`Successfully uploaded: ${file.originalname} (${this.formatFileSize(stats.size)})`);
        
        // Optional: Extract and index content for search
        await this.indexFileContent(file.filename);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        results.push(`Error processing: ${file.originalname}`);
      }
    }
    
    return results;
  }

  async listFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.materialsDir);
      return files.filter(file => !file.startsWith('.'));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async getFileInfo(): Promise<MaterialInfo[]> {
    try {
      const files = await this.listFiles();
      const fileInfos: MaterialInfo[] = [];

      for (const filename of files) {
        try {
          const filePath = path.join(this.materialsDir, filename);
          const stats = await fs.stat(filePath);
          const extension = path.extname(filename).toLowerCase();

          fileInfos.push({
            filename,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            type: this.getFileType(extension),
            extension
          });
        } catch (error) {
          console.error(`Error getting info for file ${filename}:`, error);
        }
      }

      return fileInfos;
    } catch (error) {
      console.error('Error getting file info:', error);
      return [];
    }
  }

  async deleteFile(filename: string): Promise<string> {
    try {
      const filePath = path.join(this.materialsDir, filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new Error(`File not found: ${filename}`);
      }

      // Delete the file
      await fs.unlink(filePath);
      
      // Also remove from search index if it exists
      await this.removeFromIndex(filename);
      
      return `Successfully deleted: ${filename}`;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${filename}`);
    }
  }

  async getFileContent(filename: string): Promise<string> {
    try {
      const filePath = path.join(this.materialsDir, filename);
      const extension = path.extname(filename).toLowerCase();

      switch (extension) {
        case '.txt':
        case '.md':
          return await fs.readFile(filePath, 'utf-8');
        
        case '.pdf':
          return await this.extractPdfContent(filePath);
        
        case '.docx':
          return await this.extractDocxContent(filePath);
        
        case '.html':
        case '.htm':
          return await this.extractHtmlContent(filePath);
        
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    } catch (error) {
      console.error('Error getting file content:', error);
      throw new Error(`Failed to get content from: ${filename}`);
    }
  }

  async searchMaterials(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const files = await this.listFiles();
      const results: SearchResult[] = [];

      for (const filename of files) {
        try {
          const content = await this.getFileContent(filename);
          const matches = this.findMatches(content, query);
          
          if (matches.length > 0) {
            results.push({
              filename,
              content: this.getContentPreview(content, matches[0], 200),
              score: matches.length,
              matches: matches.slice(0, 3)
            });
          }
        } catch (error) {
          console.error(`Error searching file ${filename}:`, error);
        }
      }

      // Sort by score (number of matches) and return top results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching materials:', error);
      return [];
    }
  }

  private async extractPdfContent(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      throw new Error('Failed to extract PDF content');
    }
  }

  private async extractDocxContent(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX content:', error);
      throw new Error('Failed to extract DOCX content');
    }
  }

  private async extractHtmlContent(filePath: string): Promise<string> {
    try {
      const htmlContent = await fs.readFile(filePath, 'utf-8');
      const dom = new JSDOM(htmlContent);
      return dom.window.document.body?.textContent || '';
    } catch (error) {
      console.error('Error extracting HTML content:', error);
      throw new Error('Failed to extract HTML content');
    }
  }

  private getFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      '.txt': 'text',
      '.md': 'markdown',
      '.pdf': 'pdf',
      '.docx': 'word',
      '.doc': 'word',
      '.html': 'html',
      '.htm': 'html',
      '.pptx': 'powerpoint',
      '.ppt': 'powerpoint'
    };
    
    return typeMap[extension] || 'unknown';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private findMatches(content: string, query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    const matches: string[] = [];

    for (const word of words) {
      if (word.length > 2 && contentLower.includes(word)) {
        const regex = new RegExp(`.{0,50}${word}.{0,50}`, 'gi');
        const wordMatches = content.match(regex) || [];
        matches.push(...wordMatches);
      }
    }

    return matches;
  }

  private getContentPreview(content: string, match: string, length: number): string {
    const index = content.toLowerCase().indexOf(match.toLowerCase());
    if (index === -1) return content.substring(0, length);
    
    const start = Math.max(0, index - length / 2);
    const end = Math.min(content.length, start + length);
    
    return content.substring(start, end);
  }

  private async indexFileContent(filename: string): Promise<void> {
    // Placeholder for content indexing logic
    // This could be implemented with a search engine like Elasticsearch
    // or a vector database for more sophisticated search
    console.log(`Indexing content for: ${filename}`);
  }

  private async removeFromIndex(filename: string): Promise<void> {
    // Placeholder for removing content from search index
    console.log(`Removing from index: ${filename}`);
  }
}

// services/CourseAgentService.ts
import { AgentState, RunAgentRequest, StateUpdateRequest, RetrievedDocument } from '../types/course';
import { OpenAI } from 'openai';
import { MaterialService } from './MaterialService';
import { VectorStoreService } from './VectorStoreService';

export interface AgentResponse {
  live_output: string;
  lnode: string;
  nnode: string;
  thread_id: string;
  revision: number;
  count: number;
}

export class CourseAgentService {
  private openai: OpenAI;
  private materialService: MaterialService;
  private vectorStoreService: VectorStoreService;
  private agentStates: Map<string, AgentState> = new Map();
  private stateHistory: Map<string, AgentState[]> = new Map();
  private currentThreadId: string = '0';

  constructor(
    materialService: MaterialService,
    vectorStoreService: VectorStoreService
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.materialService = materialService;
    this.vectorStoreService = vectorStoreService;
  }

  async runAgent(request: RunAgentRequest): Promise<AgentResponse> {
    try {
      const threadId = request.threadId || this.currentThreadId;
      
      if (request.start) {
        // Initialize new agent state
        await this.initializeAgentState(threadId, request.topic);
      }

      // Retrieve relevant documents
      const retrievedDocs = await this.retrieveRelevantDocuments(request.topic);
      
      // Update state with retrieved documents
      const currentState = this.agentStates.get(threadId);
      if (currentState) {
        currentState.retrieved_docs = retrievedDocs;
        this.agentStates.set(threadId, currentState);
      }

      // Run the agent workflow
      return await this.executeAgentWorkflow(threadId, request);
    } catch (error) {
      console.error('Error running agent:', error);
      throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *runAgentStream(request: RunAgentRequest): AsyncGenerator<AgentResponse> {
    try {
      const threadId = request.threadId || this.currentThreadId;
      
      if (request.start) {
        await this.initializeAgentState(threadId, request.topic);
        yield {
          live_output: 'Initializing agent state...\n',
          lnode: 'init',
          nnode: 'planner',
          thread_id: threadId,
          revision: 0,
          count: 1
        };
      }

      // Retrieve relevant documents
      yield {
        live_output: 'Retrieving relevant teaching materials...\n',
        lnode: 'retrieval',
        nnode: 'planner',
        thread_id: threadId,
        revision: 0,
        count: 2
      };

      const retrievedDocs = await this.retrieveRelevantDocuments(request.topic);
      
      // Update state
      const currentState = this.agentStates.get(threadId);
      if (currentState) {
        currentState.retrieved_docs = retrievedDocs;
        this.agentStates.set(threadId, currentState);
      }

      // Execute workflow with streaming updates
      yield* this.executeAgentWorkflowStream(threadId, request);
    } catch (error) {
      console.error('Error in streaming agent:', error);
      yield {
        live_output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
        lnode: 'error',
        nnode: '',
        thread_id: request.threadId || this.currentThreadId,
        revision: 0,
        count: 0
      };
    }
  }

  async getState(key: string, threadId?: string): Promise<string> {
    const id = threadId || this.currentThreadId;
    const state = this.agentStates.get(id);
    
    if (!state) {
      throw new Error('No agent state found');
    }

    const keyMap: Record<string, keyof AgentState> = {
      'plan': 'plan',
      'design': 'draft',
      'draft': 'draft',
      'critique': 'critique',
      'materials': 'retrieved_docs'
    };

    const stateKey = keyMap[key] || key;
    
    if (stateKey === 'retrieved_docs') {
      const docs = state.retrieved_docs || [];
      return this.formatRetrievedDocs(docs);
    }

    return state[stateKey as keyof AgentState]?.toString() || '';
  }

  async modifyState(request: StateUpdateRequest): Promise<void> {
    const threadId = request.threadId || this.currentThreadId;
    const state = this.agentStates.get(threadId);
    
    if (!state) {
      throw new Error('No agent state found');
    }

    const keyMap: Record<string, keyof AgentState> = {
      'plan': 'plan',
      'design': 'draft',
      'draft': 'draft',
      'critique': 'critique'
    };

    const stateKey = keyMap[request.key] || request.key;
    (state as any)[stateKey] = request.content;
    
    // Update last node to reflect the modification
    state.lnode = request.node;
    state.count += 1;

    this.agentStates.set(threadId, state);
    this.addToHistory(threadId, { ...state });
  }

  async getCurrentState(threadId?: string): Promise<AgentState> {
    const id = threadId || this.currentThreadId;
    const state = this.agentStates.get(id);
    
    if (!state) {
      throw new Error('No agent state found');
    }

    return { ...state };
  }

  async getStateHistory(threadId?: string): Promise<AgentState[]> {
    const id = threadId || this.currentThreadId;
    return this.stateHistory.get(id) || [];
  }

  async getThreads(): Promise<string[]> {
    return Array.from(this.agentStates.keys());
  }

  async switchThread(threadId: string): Promise<void> {
    this.currentThreadId = threadId;
    
    // Initialize state if thread doesn't exist
    if (!this.agentStates.has(threadId)) {
      this.agentStates.set(threadId, this.createInitialState(''));
      this.stateHistory.set(threadId, []);
    }
  }

  async getRetrievedMaterials(threadId?: string): Promise<RetrievedDocument[]> {
    const id = threadId || this.currentThreadId;
    const state = this.agentStates.get(id);
    
    return state?.retrieved_docs || [];
  }

  async pauseAgent(threadId?: string): Promise<void> {
    const id = threadId || this.currentThreadId;
    // Implementation for pausing agent execution
    console.log(`Pausing agent for thread: ${id}`);
  }

  async resumeAgent(threadId?: string): Promise<void> {
    const id = threadId || this.currentThreadId;
    // Implementation for resuming agent execution
    console.log(`Resuming agent for thread: ${id}`);
  }

  private async initializeAgentState(threadId: string, topic: string): Promise<void> {
    const initialState = this.createInitialState(topic);
    this.agentStates.set(threadId, initialState);
    this.stateHistory.set(threadId, [{ ...initialState }]);
    this.currentThreadId = threadId;
  }

  private createInitialState(topic: string): AgentState {
    return {
      task: topic,
      lnode: '',
      plan: '',
      draft: '',
      critique: '',
      revision_number: 0,
      max_revisions: 2,
      count: 0,
      retrieved_docs: []
    };
  }

  private async retrieveRelevantDocuments(query: string, k: number = 3): Promise<RetrievedDocument[]> {
    try {
      // Use vector store to find relevant documents
      const searchResults = await this.vectorStoreService.search(query, k);
      
      // If vector store is not available, fall back to material service search
      if (searchResults.length === 0) {
        const materialResults = await this.materialService.searchMaterials(query, k);
        return materialResults.map(result => ({
          content: result.content,
          source: result.filename,
          metadata: { score: result.score, matches: result.matches }
        }));
      }

      return searchResults;
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  private async executeAgentWorkflow(threadId: string, request: RunAgentRequest): Promise<AgentResponse> {
    const state = this.agentStates.get(threadId);
    if (!state) {
      throw new Error('No agent state found');
    }

    let liveOutput = '';
    let currentNode = state.lnode || 'planner';
    
    // Execute the workflow based on the current node
    switch (currentNode) {
      case '':
      case 'planner':
        liveOutput += await this.executePlannerNode(state);
        currentNode = 'planner';
        break;
      case 'planner':
        liveOutput += await this.executeCourseDesignerNode(state);
        currentNode = 'course designer';
        break;
      case 'course designer':
        liveOutput += await this.executeReflectionNode(state);
        currentNode = 'reflect';
        break;
      default:
        liveOutput += 'Workflow completed.\n';
    }

    state.lnode = currentNode;
    state.count += 1;
    
    // Determine next node
    const nextNode = this.getNextNode(currentNode, state, request.stopAfter);
    
    this.agentStates.set(threadId, state);
    this.addToHistory(threadId, { ...state });

    return {
      live_output: liveOutput,
      lnode: currentNode,
      nnode: nextNode,
      thread_id: threadId,
      revision: state.revision_number,
      count: state.count
    };
  }

  private async *executeAgentWorkflowStream(
    threadId: string, 
    request: RunAgentRequest
  ): AsyncGenerator<AgentResponse> {
    const state = this.agentStates.get(threadId);
    if (!state) {
      throw new Error('No agent state found');
    }

    let currentNode = state.lnode || 'planner';
    
    while (currentNode && !request.stopAfter.includes(currentNode)) {
      let liveOutput = '';
      
      switch (currentNode) {
        case '':
        case 'planner':
          liveOutput = await this.executePlannerNode(state);
          currentNode = 'planner';
          break;
        case 'planner':
          liveOutput = await this.executeCourseDesignerNode(state);
          currentNode = 'course designer';
          break;
        case 'course designer':
          liveOutput = await this.executeReflectionNode(state);
          currentNode = 'reflect';
          break;
        default:
          liveOutput = 'Workflow completed.\n';
          currentNode = '';
      }

      state.lnode = currentNode;
      state.count += 1;
      
      const nextNode = this.getNextNode(currentNode, state, request.stopAfter);
      
      this.agentStates.set(threadId, state);
      this.addToHistory(threadId, { ...state });

      yield {
        live_output: liveOutput,
        lnode: currentNode,
        nnode: nextNode,
        thread_id: threadId,
        revision: state.revision_number,
        count: state.count
      };

      if (!nextNode || request.stopAfter.includes(currentNode)) {
        break;
      }

      currentNode = nextNode;
    }
  }

  private async executePlannerNode(state: AgentState): Promise<string> {
    const context = this.formatRetrievedDocsForPrompt(state.retrieved_docs || []);
    
    const prompt = `You are a course planning expert. Create a detailed course outline for: "${state.task}"

${context}

Your outline should include:
- A compelling introduction (2 paragraphs)
- 5-7 main topic areas with 2-3 subtopics each
- Clear learning objectives for each main topic
- References to the retrieved teaching materials

Target audience: graduate students
Learning objective: to be a good management in 21st century`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      });

      state.plan = response.choices[0]?.message?.content || '';
      return `Planning completed.\n${state.plan}\n------------------\n\n`;
    } catch (error) {
      console.error('Error in planner node:', error);
      return 'Error in planning phase.\n------------------\n\n';
    }
  }

  private async executeCourseDesignerNode(state: AgentState): Promise<string> {
    const prompt = `You are an expert course content developer. Transform this course plan into comprehensive course content:

PLAN:
${state.plan}

Requirements:
1. Include compulsory areas: Business Service Management with innovations, Business marketing transformation, Achieving SDGs, ESG in decision making
2. Use a friendly teaching style
3. Integrate AI and self-management learning techniques
4. Reference the teaching materials provided in the plan
5. Format with clear headings and learning objectives

Create detailed course content based on this plan.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      });

      state.draft = response.choices[0]?.message?.content || '';
      return `Course design completed.\n${state.draft}\n------------------\n\n`;
    } catch (error) {
      console.error('Error in course designer node:', error);
      return 'Error in course design phase.\n------------------\n\n';
    }
  }

  private async executeReflectionNode(state: AgentState): Promise<string> {
    const prompt = `You are an experienced educational consultant. Evaluate this course content:

COURSE CONTENT:
${state.draft}

Provide specific critique on:
1. Self-learning and self-management techniques
2. Business partnerships and responsible business practices
3. Use of teaching materials and references
4. Learning methods and evaluation criteria
5. Areas for improvement

Focus on constructive, actionable feedback.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      });

      state.critique = response.choices[0]?.message?.content || '';
      state.revision_number += 1;
      
      return `Course critique completed.\n${state.critique}\n------------------\n\n`;
    } catch (error) {
      console.error('Error in reflection node:', error);
      return 'Error in reflection phase.\n------------------\n\n';
    }
  }

  private getNextNode(currentNode: string, state: AgentState, stopAfter: string[]): string {
    if (stopAfter.includes(currentNode)) {
      return '';
    }

    switch (currentNode) {
      case 'planner':
        return 'course designer';
      case 'course designer':
        return state.revision_number < state.max_revisions ? 'reflect' : '';
      case 'reflect':
        return state.revision_number < state.max_revisions ? 'course designer' : '';
      default:
        return '';
    }
  }

  private formatRetrievedDocs(docs: RetrievedDocument[]): string {
    if (!docs || docs.length === 0) {
      return 'No teaching materials were retrieved for this course topic.';
    }

    return docs.map((doc, index) => 
      `Document ${index + 1} - Source: ${doc.source}\n${doc.content}\n\n`
    ).join('');
  }

  private formatRetrievedDocsForPrompt(docs: RetrievedDocument[]): string {
    if (!docs || docs.length === 0) {
      return 'No relevant teaching materials found.';
    }

    return `RELEVANT TEACHING MATERIALS:\n\n${docs.map((doc, index) => 
      `Document ${index + 1} - Source: ${doc.source}\n${doc.content}\n`
    ).join('\n')}`;
  }

  private addToHistory(threadId: string, state: AgentState): void {
    const history = this.stateHistory.get(threadId) || [];
    history.push({ ...state });
    
    // Keep only last 50 states to prevent memory issues
    if (history.length > 50) {
      history.shift();
    }
    
    this.stateHistory.set(threadId, history);
  }
}

// services/VectorStoreService.ts
import { RetrievedDocument } from '../types/course';

export interface VectorStoreDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export class VectorStoreService {
  private documents: Map<string, VectorStoreDocument> = new Map();
  private openai: any; // OpenAI client for embeddings

  constructor() {
    // Initialize OpenAI client if needed for embeddings
    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = require('openai');
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async indexDocument(id: string, content: string, metadata: Record<string, any>): Promise<void> {
    try {
      let embedding: number[] | undefined;
      
      // Generate embedding if OpenAI is available
      if (this.openai) {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: content
        });
        embedding = response.data[0].embedding;
      }

      const document: VectorStoreDocument = {
        id,
        content,
        metadata,
        embedding
      };

      this.documents.set(id, document);
    } catch (error) {
      console.error('Error indexing document:', error);
      throw new Error('Failed to index document');
    }
  }

  async search(query: string, k: number = 5): Promise<RetrievedDocument[]> {
    try {
      let queryEmbedding: number[] | undefined;

      // Generate query embedding if OpenAI is available
      if (this.openai) {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: query
        });
        queryEmbedding = response.data[0].embedding;
      }

      const documents = Array.from(this.documents.values());
      
      if (queryEmbedding && documents.some(doc => doc.embedding)) {
        // Use semantic search with embeddings
        return this.semanticSearch(documents, queryEmbedding, k);
      } else {
        // Fall back to keyword search
        return this.keywordSearch(documents, query, k);
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  private semanticSearch(
    documents: VectorStoreDocument[], 
    queryEmbedding: number[], 
    k: number
  ): RetrievedDocument[] {
    const scores = documents
      .filter(doc => doc.embedding)
      .map(doc => ({
        document: doc,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    return scores.map(item => ({
      content: item.document.content,
      source: item.document.metadata.source || item.document.id,
      metadata: { ...item.document.metadata, similarity_score: item.score }
    }));
  }

  private keywordSearch(documents: VectorStoreDocument[], query: string, k: number): RetrievedDocument[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const scores = documents.map(doc => {
      const contentWords = doc.content.toLowerCase().split(/\s+/);
      let score = 0;
      
      for (const queryWord of queryWords) {
        for (const contentWord of contentWords) {
          if (contentWord.includes(queryWord) || queryWord.includes(contentWord)) {
            score += 1;
          }
        }
      }
      
      return { document: doc, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

    return scores.map(item => ({
      content: item.document.content,
      source: item.document.metadata.source || item.document.id,
      metadata: { ...item.document.metadata, keyword_score: item.score }
    }));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async updateDocument(id: string, content: string, metadata: Record<string, any>): Promise<void> {
    await this.indexDocument(id, content, metadata);
  }

  async getDocumentCount(): Promise<number> {
    return this.documents.size;
  }

  async clearIndex(): Promise<void> {
    this.documents.clear();
  }
}