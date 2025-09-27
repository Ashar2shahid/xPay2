import { create } from "zustand";
import {
  Project,
  Endpoint,
  NewEndpointInput,
  NewProjectInput,
  Chain,
} from "@/types";
import { mockProjects } from "@/data/mockData";

type LegacyProjectInput = {
  name: string;
  description: string;
  walletAddress?: string;
  chain: Chain | Chain[]; // backward-compatible: single Chain or array
  endpoints?: Array<
    NewEndpointInput | Partial<Omit<Endpoint, "id" | "projectId" | "createdAt">>
  >;
  totalRequests?: number;
  avgLatency?: number;
  successRate?: number;
};

type LooseEndpointInit = Partial<
  Omit<Endpoint, "id" | "projectId" | "createdAt" | "status">
> & {
  status?: Endpoint["status"] | string;
};

type AddEndpointParam =
  | NewEndpointInput
  | {
      name?: string;
      url: string;
      description?: string;
      status?: Endpoint["status"] | string;
      requestCount?: number;
      avgLatency?: number;
      successRate?: number;
      lastRequest?: Date | string | number;
      settleWhen?: "before" | "after" | string;
    };

interface Store {
  projects: Project[];
  addProject: (
    project:
      | NewProjectInput
      | LegacyProjectInput
      | Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  addEndpoint: (
    projectId: string,
    endpoint:
      | Partial<Omit<Endpoint, "id" | "projectId" | "createdAt">>
      | NewEndpointInput
  ) => void;
  updateEndpoint: (
    projectId: string,
    endpointId: string,
    updates: Partial<Endpoint>
  ) => void;
  deleteEndpoint: (projectId: string, endpointId: string) => void;
  getEndpoint: (projectId: string, endpointId: string) => Endpoint | undefined;
}

export const useStore = create<Store>((set, get) => ({
  projects: mockProjects,

  addProject: (project) => {
    const newId = crypto.randomUUID();
    const now = new Date();

    // helpers for coercion
    const toDate = (v: any) =>
      v instanceof Date ? v : v ? new Date(v) : new Date(0);
    const toStatus = (v: any): Endpoint["status"] =>
      v === "inactive" ? "inactive" : v === "error" ? "error" : "active";
    const toSettleWhen = (v: any): "before" | "after" =>
      v === "after" ? "after" : "before";

    // Normalize chain to an array (backward compatibility for single Chain, and handle undefined)
    const rawChain = (project as any).chain;
    const chain = Array.isArray(rawChain)
      ? rawChain.filter(Boolean)
      : rawChain
      ? [rawChain]
      : [];

    // Helper to construct Endpoint with sensible defaults
    const buildEndpoint = (input: any): Endpoint => {
      const nameFromUrl = (() => {
        try {
          const u = new URL(input.url);
          return u.hostname;
        } catch {
          return "endpoint";
        }
      })();

      const name =
        input.name && typeof input.name === "string" && input.name.trim().length
          ? input.name
          : nameFromUrl;

      return {
        id: crypto.randomUUID(),
        projectId: newId,
        name,
        url: input.url,
        description: input.description,
        settleWhen: toSettleWhen(input.settleWhen),
        status: toStatus(input.status),
        requestCount: input.requestCount ?? 0,
        avgLatency: input.avgLatency ?? 0,
        successRate: input.successRate ?? 0,
        lastRequest: toDate(input.lastRequest),
        createdAt: input.createdAt ?? now,
      };
    };

    // Support optional endpoints on creation; accept both minimal input and full Endpoint-like
    let endpoints: Endpoint[] = [];
    if (
      "endpoints" in (project as any) &&
      Array.isArray((project as any).endpoints)
    ) {
      endpoints = (project as any).endpoints.map((ep: any) =>
        buildEndpoint(ep)
      );
    }

    const walletAddress = (project as any).walletAddress ?? "";

    const newProject: Project = {
      id: newId,
      name: (project as any).name,
      description: (project as any).description,
      walletAddress,
      chain,
      endpoints,
      totalRequests: (project as any).totalRequests ?? 0,
      avgLatency: (project as any).avgLatency ?? 0,
      successRate: (project as any).successRate ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      projects: [...state.projects, newProject],
    }));
    return newId;
  },

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),

  getProject: (id) => get().projects.find((p) => p.id === id),

  addEndpoint: (projectId, endpoint) =>
    set((state) => {
      const now = new Date();

      const toDate = (v: any) =>
        v instanceof Date ? v : v ? new Date(v) : new Date(0);
      const toStatus = (v: any): Endpoint["status"] =>
        v === "inactive" ? "inactive" : v === "error" ? "error" : "active";
      const toSettleWhen = (v: any): "before" | "after" =>
        v === "after" ? "after" : "before";
      const buildName = (urlStr: string, provided?: string) => {
        if (provided && provided.trim().length) return provided;
        try {
          return new URL(urlStr).hostname;
        } catch {
          return "endpoint";
        }
      };

      return {
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                endpoints: [
                  ...p.endpoints,
                  {
                    id: crypto.randomUUID(),
                    projectId,
                    name: buildName(
                      (endpoint as any).url,
                      (endpoint as any).name
                    ),
                    url: (endpoint as any).url,
                    description: (endpoint as any).description,
                    settleWhen: toSettleWhen((endpoint as any).settleWhen),
                    status: toStatus((endpoint as any).status),
                    requestCount: (endpoint as any).requestCount ?? 0,
                    avgLatency: (endpoint as any).avgLatency ?? 0,
                    successRate: (endpoint as any).successRate ?? 0,
                    lastRequest: toDate((endpoint as any).lastRequest),
                    createdAt: now,
                  },
                ],
                updatedAt: now,
              }
            : p
        ),
      };
    }),

  updateEndpoint: (projectId, endpointId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              endpoints: p.endpoints.map((e) =>
                e.id === endpointId ? { ...e, ...updates } : e
              ),
              updatedAt: new Date(),
            }
          : p
      ),
    })),

  deleteEndpoint: (projectId, endpointId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              endpoints: p.endpoints.filter((e) => e.id !== endpointId),
              updatedAt: new Date(),
            }
          : p
      ),
    })),

  getEndpoint: (projectId, endpointId) =>
    get()
      .projects.find((p) => p.id === projectId)
      ?.endpoints.find((e) => e.id === endpointId),
}));
