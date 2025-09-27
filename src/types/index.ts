// ============================
// MAIN API TYPES
// ============================

/**
 * Main project interface aligned with backend schema
 */
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  defaultPrice: number;
  currency: string;
  payTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  paymentChains: string[];
  endpoints: Endpoint[];
}

/**
 * Endpoint interface aligned with backend schema
 */
export interface Endpoint {
  id: string;
  projectId: string;
  url: string;
  path: string;
  method?: string;
  price: number | null;
  description: string | null;
  creditsEnabled: boolean;
  minTopupAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project statistics interface for analytics data
 */
export interface ProjectStats {
  totalRequests: number;
  avgLatency: number;
  successRate: number;
  activeEndpoints: number;
  errorRate: number;
  lastActivity: Date;
}

/**
 * Endpoint statistics interface for detailed metrics
 */
export interface EndpointStats {
  requestCount: number;
  avgLatency: number;
  successRate: number;
  lastRequest: Date;
  errorCount: number;
  p95Latency: number;
  dailyRequests: number;
}

/**
 * API response wrapper for projects list
 */
export interface ProjectsResponse {
  projects: Project[];
}

/**
 * API response wrapper for single project
 */
export interface ProjectResponse {
  project: Project;
}

/**
 * API response wrapper for single endpoint
 */
export interface EndpointResponse {
  endpoint: Endpoint;
}

/**
 * Extended project interface with stats
 */
export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

/**
 * Extended endpoint interface with stats
 */
export interface EndpointWithStats extends Endpoint {
  stats: EndpointStats;
}

// ============================
// UTILITY TYPES
// ============================

/**
 * HTTP methods supported by endpoints
 */
export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

/**
 * Status types for projects and endpoints
 */
export type EntityStatus = "active" | "inactive" | "error";

/**
 * Currency codes supported by the platform
 */
export type CurrencyCode = "USD" | "EUR" | "BTC" | "ETH";

/**
 * Time range options for analytics
 */
export type TimeRange = "1h" | "24h" | "7d" | "30d" | "90d";
