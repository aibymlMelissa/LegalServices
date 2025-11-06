// services/apiClient.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFiles(endpoint: string, formData: FormData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        body: formData, // Don't set Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('File upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }
}

export const apiClient = new ApiClient();

// services/courseParametersService.ts
import { CourseParameters } from '../types/course';
import { apiClient, ApiResponse } from './apiClient';

export class CourseParametersService {
  async listParameterFiles(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/parameters/files');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to list parameter files');
  }

  async loadParameters(filename: string): Promise<CourseParameters> {
    const response = await apiClient.get<CourseParameters>(`/parameters/${filename}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to load parameters');
  }

  async saveParameters(parameters: CourseParameters): Promise<string> {
    const response = await apiClient.post<{ filename: string }>('/parameters', parameters);
    if (response.success && response.data) {
      return response.data.filename;
    }
    throw new Error(response.error || 'Failed to save parameters');
  }

  async deleteParameters(filename: string): Promise<void> {
    const response = await apiClient.delete(`/parameters/${filename}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete parameters');
    }
  }
}

export const courseParametersService = new CourseParametersService();

// services/materialService.ts
import { apiClient } from './apiClient';

export interface MaterialInfo {
  filename: string;
  size: number;
  lastModified: string;
  type: string;
}

export class MaterialService {
  async uploadFiles(formData: FormData): Promise<string> {
    const response = await apiClient.uploadFiles('/materials/upload', formData);
    if (response.success && response.data) {
      return response.data.message || 'Files uploaded successfully';
    }
    throw new Error(response.error || 'Failed to upload files');
  }

  async listFiles(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/materials/files');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to list files');
  }

  async getFileInfo(): Promise<MaterialInfo[]> {
    const response = await apiClient.get<MaterialInfo[]>('/materials/info');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get file info');
  }

  async deleteFile(filename: string): Promise<string> {
    const response = await apiClient.delete<{ message: string }>(`/materials/${filename}`);
    if (response.success && response.data) {
      return response.data.message;
    }
    throw new Error(response.error || 'Failed to delete file');
  }

  async getFileContent(filename: string): Promise<string> {
    const response = await apiClient.get<{ content: string }>(`/materials/${filename}/content`);
    if (response.success && response.data) {
      return response.data.content;
    }
    throw new Error(response.error || 'Failed to get file content');
  }
}

export const materialService = new MaterialService();

// services/courseAgentService.ts
import { AgentState, AgentResponse, RetrievedDocument } from '../types/course';
import { apiClient } from './apiClient';

export interface RunAgentRequest {
  start: boolean;
  topic: string;
  stopAfter: string[];
  threadId?: string;
}

export interface StateUpdateRequest {
  key: string;
  node: string;
  content: string;
  threadId?: string;
}

export class CourseAgentService {
  async runAgent(request: RunAgentRequest): Promise<AgentResponse> {
    const response = await apiClient.post<AgentResponse>('/agent/run', request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to run agent');
  }

  async getState(key: string, threadId?: string): Promise<string> {
    const endpoint = threadId ? `/agent/state/${key}?threadId=${threadId}` : `/agent/state/${key}`;
    const response = await apiClient.get<{ content: string }>(endpoint);
    if (response.success && response.data) {
      return response.data.content;
    }
    throw new Error(response.error || 'Failed to get state');
  }

  async modifyState(key: string, node: string, content: string, threadId?: string): Promise<void> {
    const request: StateUpdateRequest = { key, node, content, threadId };
    const response = await apiClient.post('/agent/state', request);
    if (!response.success) {
      throw new Error(response.error || 'Failed to modify state');
    }
  }

  async getCurrentState(threadId?: string): Promise<AgentState> {
    const endpoint = threadId ? `/agent/current-state?threadId=${threadId}` : '/agent/current-state';
    const response = await apiClient.get<AgentState>(endpoint);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get current state');
  }

  async getStateHistory(threadId?: string): Promise<AgentState[]> {
    const endpoint = threadId ? `/agent/history?threadId=${threadId}` : '/agent/history';
    const response = await apiClient.get<AgentState[]>(endpoint);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get state history');
  }

  async getThreads(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/agent/threads');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get threads');
  }

  async switchThread(threadId: string): Promise<void> {
    const response = await apiClient.post('/agent/switch-thread', { threadId });
    if (!response.success) {
      throw new Error(response.error || 'Failed to switch thread');
    }
  }

  async getRetrievedMaterials(threadId?: string): Promise<RetrievedDocument[]> {
    const endpoint = threadId ? `/agent/materials?threadId=${threadId}` : '/agent/materials';
    const response = await apiClient.get<RetrievedDocument[]>(endpoint);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get retrieved materials');
  }

  // Stream-based agent run for real-time updates
  async runAgentStream(request: RunAgentRequest): Promise<ReadableStream<AgentResponse>> {
    const response = await fetch(`${apiClient.baseURL}/agent/run-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
      start(controller) {
        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  controller.enqueue(data);
                } catch (e) {
                  console.warn('Failed to parse SSE data:', line);
                }
              }
            }

            return pump();
          });
        }

        return pump();
      },
    });
  }
}

export const courseAgentService = new CourseAgentService();

// services/courseExportService.ts
import { CourseData } from '../types/course';
import { apiClient } from './apiClient';
import * as XLSX from 'xlsx';

export class CourseExportService {
  async extractCourseData(threadId?: string): Promise<CourseData> {
    const endpoint = threadId ? `/export/extract?threadId=${threadId}` : '/export/extract';
    const response = await apiClient.get<CourseData>(endpoint);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to extract course data');
  }

  async exportToCsv(courseData: CourseData): Promise<Blob> {
    // Generate CSV content locally
    const csvContent = this.generateCsvContent(courseData);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  async exportToExcel(courseData: CourseData): Promise<Blob> {
    // Generate Excel content locally using SheetJS
    const data = this.prepareCourseDataForExport(courseData);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Course Design');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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

  async generatePreviewHtml(courseData: CourseData): Promise<string> {
    const response = await apiClient.post<{ html: string }>('/export/preview', courseData);
    if (response.success && response.data) {
      return response.data.html;
    }
    throw new Error(response.error || 'Failed to generate preview HTML');
  }
}

export const courseExportService = new CourseExportService();

// services/websocketService.ts
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string = 'ws://localhost:8000/ws'): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(url);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  subscribe(messageType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(messageType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(message.data));
    }
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

export const websocketService = new WebSocketService();

// services/notificationService.ts
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
}

export class NotificationService {
  private listeners: ((notification: Notification) => void)[] = [];

  subscribe(callback: (notification: Notification) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const fullNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    this.listeners.forEach(callback => callback(fullNotification));
  }

  success(title: string, message: string, duration?: number): void {
    this.notify({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration?: number): void {
    this.notify({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration?: number): void {
    this.notify({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration?: number): void {
    this.notify({ type: 'info', title, message, duration });
  }
}

export const notificationService = new NotificationService();