import {
  Project,
  Endpoint,
  ProjectStats,
  EndpointStats,
  ProjectWithStats,
  EndpointWithStats,
  ProjectsResponse,
  ProjectResponse,
  EndpointResponse,
  HTTPMethod,
  CurrencyCode,
} from "../types";

// ============================
// INPUT INTERFACES
// ============================

/**
 * Input interface for creating a new project
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  defaultPrice: number;
  currency: CurrencyCode;
  payTo: string;
  paymentChains: string[];
}

/**
 * Input interface for creating a new endpoint
 */
export interface CreateEndpointInput {
  url: string;
  path: string;
  method?: HTTPMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  price?: number;
  description?: string;
  creditsEnabled?: boolean;
  minTopupAmount?: number;
}

// ============================
// ERROR TYPES
// ============================

/**
 * Custom error class for API-related errors
 */
export class APIError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Custom error class for network-related errors
 */
export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "NetworkError";
  }
}

// ============================
// BASE CONFIGURATION
// ============================

/**
 * Base API configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Default headers for API requests
 */
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Delay function for retry logic
 * @param ms - Milliseconds to delay
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if error is retryable (network errors, 5xx errors)
 * @param error - Error to check
 * @returns Whether the error is retryable
 */
const isRetryableError = (error: Error): boolean => {
  if (error instanceof NetworkError) return true;
  if (error instanceof APIError) {
    return error.status ? error.status >= 500 : false;
  }
  return false;
};

/**
 * Enhanced fetch with timeout, retries, and error handling
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries remaining
 * @returns Promise resolving to Response
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    const networkError = new NetworkError(
      error instanceof Error ? error.message : "Network request failed",
      error instanceof Error ? error : undefined
    );

    if (retries > 0 && isRetryableError(networkError)) {
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }

    throw networkError;
  }
}

// ============================
// MOCK STATS GENERATOR
// ============================

/**
 * Mock statistics generator for development and testing
 */
export class MockStatsGenerator {
  /**
   * Generate realistic project statistics
   * @param project - The project to generate stats for
   * @returns Mock project statistics
   */
  static generateProjectStats(project: Project): ProjectStats {
    const baseRequests = Math.floor(Math.random() * 10000) + 1000;
    const activeEndpoints = project.endpoints.filter(
      (ep) => ep.isActive
    ).length;

    return {
      totalRequests: baseRequests,
      avgLatency: Math.floor(Math.random() * 500) + 50, // 50-550ms
      successRate: Math.random() * 20 + 80, // 80-100%
      activeEndpoints,
      errorRate: Math.random() * 5, // 0-5%
      lastActivity: new Date(Date.now() - Math.random() * 86400000), // Within last 24h
    };
  }

  /**
   * Generate realistic endpoint statistics
   * @param endpoint - The endpoint to generate stats for
   * @returns Mock endpoint statistics
   */
  static generateEndpointStats(endpoint: Endpoint): EndpointStats {
    const requestCount = Math.floor(Math.random() * 5000) + 100;
    const errorCount = Math.floor(requestCount * (Math.random() * 0.1)); // 0-10% errors

    return {
      requestCount,
      avgLatency: Math.floor(Math.random() * 300) + 30, // 30-330ms
      successRate: ((requestCount - errorCount) / requestCount) * 100,
      lastRequest: new Date(Date.now() - Math.random() * 3600000), // Within last hour
      errorCount,
      p95Latency: Math.floor(Math.random() * 800) + 100, // 100-900ms
      dailyRequests: Math.floor(requestCount * (Math.random() * 0.3 + 0.7)), // 70-100% of total
    };
  }

  /**
   * Generate time-series data for charts
   * @param days - Number of days to generate data for
   * @returns Array of data points for charts
   */
  static generateTimeSeriesData(days: number = 7): Array<{
    date: string;
    requests: number;
    latency: number;
    errors: number;
  }> {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split("T")[0],
        requests: Math.floor(Math.random() * 1000) + 500,
        latency: Math.floor(Math.random() * 200) + 50,
        errors: Math.floor(Math.random() * 50),
      });
    }
    return data;
  }
}

// ============================
// UTILITY FUNCTIONS FOR MERGING
// ============================

/**
 * Merge project with stats data
 * @param project - The project
 * @param stats - Project statistics
 * @returns Project with stats merged
 */
function mergeProjectWithStats(
  project: Project,
  stats: ProjectStats
): ProjectWithStats {
  return {
    ...project,
    stats,
  };
}

/**
 * Merge endpoint with stats data
 * @param endpoint - The endpoint
 * @param stats - Endpoint statistics
 * @returns Endpoint with stats merged
 */
function mergeEndpointWithStats(
  endpoint: Endpoint,
  stats: EndpointStats
): EndpointWithStats {
  return {
    ...endpoint,
    stats,
  };
}

// ============================
// API CLIENT CLASS
// ============================

/**
 * Main API client for interacting with the backend APIs
 */
export class APIClient {
  /**
   * Fetch all projects from the API
   * @returns Promise resolving to array of projects with stats
   */
  static async getProjects(): Promise<ProjectWithStats[]> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/api/projects`);
      const data: ProjectsResponse = await response.json();

      // Merge projects with mock stats
      return data.projects.map((project) =>
        mergeProjectWithStats(
          project,
          MockStatsGenerator.generateProjectStats(project)
        )
      );
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      throw error;
    }
  }

  /**
   * Fetch a single project by ID
   * @param id - Project ID
   * @returns Promise resolving to project with stats or null if not found
   */
  static async getProject(id: string): Promise<ProjectWithStats | null> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/projects/${id}`
      );
      const data: ProjectResponse = await response.json();

      // Merge project with mock stats
      return mergeProjectWithStats(
        data.project,
        MockStatsGenerator.generateProjectStats(data.project)
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      console.error(`Failed to fetch project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a single endpoint by ID
   * @param id - Endpoint ID
   * @returns Promise resolving to endpoint with stats or null if not found
   */
  static async getEndpoint(id: string): Promise<EndpointWithStats | null> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/endpoints/${id}`
      );
      const data: EndpointResponse = await response.json();

      // Merge endpoint with mock stats
      return mergeEndpointWithStats(
        data.endpoint,
        MockStatsGenerator.generateEndpointStats(data.endpoint)
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      console.error(`Failed to fetch endpoint ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new project
   * @param input - Project creation data
   * @returns Promise resolving to created project
   */
  static async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        body: JSON.stringify(input),
      });

      const data: ProjectResponse = await response.json();
      return data.project;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  }

  /**
   * Create a new endpoint for a project
   * @param projectId - Project ID to add endpoint to
   * @param input - Endpoint creation data
   * @returns Promise resolving to created endpoint
   */
  static async createEndpoint(
    projectId: string,
    input: CreateEndpointInput
  ): Promise<Endpoint> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/projects/${projectId}/endpoints`,
        {
          method: "POST",
          body: JSON.stringify(input),
        }
      );

      const data: EndpointResponse = await response.json();
      return data.endpoint;
    } catch (error) {
      console.error(
        `Failed to create endpoint for project ${projectId}:`,
        error
      );
      throw error;
    }
  }

  // ============================
  // UTILITY METHODS
  // ============================

  /**
   * Check API health and connectivity
   * @returns Promise resolving to boolean indicating API health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/api/health`, {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      console.error("API health check failed:", error);
      return false;
    }
  }

  /**
   * Get API configuration and environment info
   * @returns Object containing API configuration
   */
  static getConfig(): {
    baseUrl: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
  } {
    return {
      baseUrl: API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      maxRetries: MAX_RETRIES,
      retryDelay: RETRY_DELAY,
    };
  }

  /**
   * Create a new APIClient instance with custom configuration
   * @param config - Custom configuration options
   * @returns APIClient instance with custom config
   */
  static withConfig(config: {
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    headers?: Record<string, string>;
  }): typeof APIClient {
    // This would return a new class instance with custom config
    // For now, we'll return the static class
    // In a real implementation, you might want to create an instance-based client
    return APIClient;
  }
}

// ============================
// EXPORTS
// ============================

export default APIClient;

// Re-export commonly used types for convenience
export type {
  ProjectWithStats,
  EndpointWithStats,
  Project,
  Endpoint,
  ProjectStats,
  EndpointStats,
};
