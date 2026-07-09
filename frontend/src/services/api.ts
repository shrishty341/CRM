/**
 * Axios API service for the Pharma CRM HCP backend.
 * Provides typed methods for all API endpoints.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ChatRequest,
  ChatResponse,
  InteractionCreatePayload,
  InteractionResponse,
  InteractionHistoryResponse,
  HCPListResponse,
  HCPRecentResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error(
            `[API] Error ${error.response.status}:`,
            error.response.data
          );
        } else if (error.request) {
          console.error('[API] Network error: No response received');
        } else {
          console.error('[API] Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================
  // Chat / AI Endpoints
  // ============================================================

  /**
   * Send a natural language message to the AI for structured data extraction.
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post<ChatResponse>('/chat', request);
    return response.data;
  }

  // ============================================================
  // Interaction Endpoints
  // ============================================================

  /**
   * Create a new interaction record.
   */
  async createInteraction(
    payload: InteractionCreatePayload
  ): Promise<InteractionResponse> {
    const response = await this.client.post<InteractionResponse>(
      '/interaction',
      payload
    );
    return response.data;
  }

  /**
   * Get a specific interaction by ID.
   */
  async getInteraction(id: number): Promise<InteractionResponse> {
    const response = await this.client.get<InteractionResponse>(
      `/interaction/${id}`
    );
    return response.data;
  }

  /**
   * Get paginated interaction history.
   */
  async getInteractionHistory(
    page: number = 1,
    pageSize: number = 20,
    doctorName?: string
  ): Promise<InteractionHistoryResponse> {
    const params: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };
    if (doctorName) {
      params.doctor_name = doctorName;
    }
    const response = await this.client.get<InteractionHistoryResponse>(
      '/interaction/history',
      { params }
    );
    return response.data;
  }

  // ============================================================
  // HCP Endpoints
  // ============================================================

  /**
   * List HCPs with optional search and pagination.
   */
  async listHCPs(
    query?: string,
    specialization?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<HCPListResponse> {
    const params: Record<string, string | number> = { limit, offset };
    if (query) params.query = query;
    if (specialization) params.specialization = specialization;
    const response = await this.client.get<HCPListResponse>('/hcp', { params });
    return response.data;
  }

  /**
   * Get recently added HCPs.
   */
  async getRecentHCPs(limit: number = 5): Promise<HCPRecentResponse> {
    const response = await this.client.get<HCPRecentResponse>('/hcp/recent', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get a specific HCP by ID.
   */
  async getHCP(id: number): Promise<{ success: boolean; hcp: any }> {
    const response = await this.client.get(`/hcp/${id}`);
    return response.data;
  }

  /**
   * Get interactions for a specific HCP.
   */
  async getHCPInteractions(
    hcpId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ success: boolean; total: number; interactions: any[] }> {
    const response = await this.client.get(`/hcp/${hcpId}/interactions`, {
      params: { limit, offset },
    });
    return response.data;
  }

  // ============================================================
  // Health Check
  // ============================================================

  /**
   * Check API health status.
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;