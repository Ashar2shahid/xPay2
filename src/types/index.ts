export interface Chain {
  id: string;
  name: string;
  symbol: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
}

export interface Endpoint {
  id: string;
  projectId: string;
  name: string;
  url: string;
  description?: string;
  settleWhen: "before" | "after"; //default before
  useCredit?: boolean;
  costPerCall?: number;
  status: "active" | "inactive" | "error";
  requestCount: number;
  avgLatency: number;
  successRate: number;
  lastRequest: Date;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  chain: Chain[];
  endpoints: Endpoint[];
  totalRequests: number;
  avgLatency: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFormData {
  name: string;
  description: string;
  chainIds: string[];
  endpoints: Endpoint[];
}

// Input interfaces for store operations
export type SettleWhen = "before" | "after";

export interface NewEndpointInput {
  name?: string;
  url: string;
  description?: string;
  settleWhen?: SettleWhen;
  useCredit?: boolean;
  costPerCall?: number;
}

export interface NewProjectInput {
  name: string;
  description: string;
  walletAddress: string;
  chain: Chain[] | Chain; // supports single Chain for backward compatibility
  endpoints?: NewEndpointInput[];
}
