import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, User, Case, CreateCaseRequest, Services, CreateServicesRequest } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token (DEMO MODE: Disabled)
    this.api.interceptors.request.use(
      (config) => {
        // DEMO MODE: Skip token authentication
        console.log('🎭 DEMO MODE: API token authentication disabled for presentation');
        return config;
        
        /* Original token code (disabled for demo):
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
        */
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/api/auth/login', credentials);
    this.setToken(response.data.token);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/api/auth/register', userData);
    this.setToken(response.data.token);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/api/auth/profile');
    return response.data;
  }

  logout(): void {
    this.removeToken();
  }

  // Case methods
  async getCases(): Promise<Case[]> {
    const response: AxiosResponse<Case[]> = await this.api.get('/api/cases');
    return response.data;
  }

  async getCase(id: string): Promise<Case> {
    const response: AxiosResponse<Case> = await this.api.get(`/api/cases/${id}`);
    return response.data;
  }

  async createCase(caseData: CreateCaseRequest): Promise<Case> {
    const response: AxiosResponse<Case> = await this.api.post('/api/cases', caseData);
    return response.data;
  }

  async updateCase(id: string, caseData: Partial<CreateCaseRequest>): Promise<Case> {
    const response: AxiosResponse<Case> = await this.api.put(`/api/cases/${id}`, caseData);
    return response.data;
  }

  async deleteCase(id: string): Promise<void> {
    await this.api.delete(`/api/cases/${id}`);
  }

  // Services methods
  async getServices(caseId: string): Promise<Services[]> {
    const response: AxiosResponse<Services[]> = await this.api.get(`/api/services/case/${caseId}`);
    return response.data;
  }

  async getServicesById(servicesId: string): Promise<Services> {
    const response: AxiosResponse<Services> = await this.api.get(`/api/services/${servicesId}`);
    return response.data;
  }

  async createServices(servicesData: CreateServicesRequest): Promise<Services> {
    const response: AxiosResponse<Services> = await this.api.post('/api/services', servicesData);
    return response.data;
  }

  async generateServices(servicesData: { caseId: string; title?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/api/services/generate`, servicesData);
    return response.data;
  }

  async downloadPresentation(servicesId: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/api/services/${servicesId}/presentation`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async deleteServices(servicesId: string): Promise<void> {
    await this.api.delete(`/api/services/${servicesId}`);
  }

  async regenerateServicesWithFeedback(servicesId: string, professionalFeedback: any, title?: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/api/services/${servicesId}/regenerate`, {
      professionalFeedback,
      title
    });
    return response.data;
  }

  async generateEnhancedPresentation(servicesId: string, enhancementRequest: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/api/services/${servicesId}/enhance-presentation`, enhancementRequest);
    return response.data;
  }

  async downloadEnhancedPresentation(servicesId: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/api/services/${servicesId}/enhanced-presentation`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async collaborativeRegeneration(servicesId: string, feedbackData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/api/services/${servicesId}/collaborative-regenerate`, feedbackData);
    return response.data;
  }

  // Course methods
  async getCourses(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/api/courses');
    return response.data;
  }

  async createCourse(courseData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/api/courses', courseData);
    return response.data;
  }

  async updateCourse(courseId: string, courseData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/api/courses/${courseId}`, courseData);
    return response.data;
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.api.delete(`/api/courses/${courseId}`);
  }

  async exportCourse(courseId: string, format: string = 'json'): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/api/courses/${courseId}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importCourse(formData: FormData): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/api/courses/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return await this.api.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return await this.api.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return await this.api.put<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return await this.api.delete<T>(url, config);
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiService = new ApiService();
export default apiService;