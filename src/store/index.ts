import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Project, Endpoint, HTTPMethod } from "@/types";
import {
  APIClient,
  CreateProjectInput,
  CreateEndpointInput,
} from "@/lib/api-client";

// Input interfaces for creating new items
interface CreateProjectParams {
  name: string;
  description?: string;
  defaultPrice?: number;
  currency?: string;
  payTo: string;
  paymentChains?: string[];
}

interface CreateEndpointParams {
  url: string;
  path?: string;
  method?: HTTPMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  price?: number;
  description?: string;
  creditsEnabled?: boolean;
  minTopupAmount?: number;
}

interface Store {
  // State properties
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;

  // Project methods
  addProject: (project: CreateProjectParams) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;

  // Endpoint methods
  addEndpoint: (
    projectId: string,
    endpoint: CreateEndpointParams
  ) => Promise<void>;
  updateEndpoint: (
    projectId: string,
    endpointId: string,
    updates: Partial<Endpoint>
  ) => void;
  deleteEndpoint: (projectId: string, endpointId: string) => void;
  getEndpoint: (projectId: string, endpointId: string) => Endpoint | undefined;

  // API methods
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initialize with empty projects array
      projects: [],

      // API integration properties
      isLoading: false,
      error: null,
      lastFetch: null,

      // API methods
      loadProjects: async () => {
        const state = get();

        // Check if we have recent data (within 5 minutes) to avoid unnecessary API calls
        if (
          state.lastFetch &&
          Date.now() - state.lastFetch.getTime() < 5 * 60 * 1000
        ) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Try to fetch from API
          const projectsWithStats = await APIClient.getProjects();

          // Extract just the project data (without stats for store)
          const projects = projectsWithStats.map(
            ({ stats, ...project }) => project
          );

          set({
            projects,
            isLoading: false,
            error: null,
            lastFetch: new Date(),
          });
        } catch (error) {
          console.error(
            "Failed to load projects from API, falling back to mock data:",
            error
          );

          // Fallback to empty array if API fails
          set({
            projects: [],
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load projects",
            lastFetch: new Date(),
          });
        }
      },

      loadProject: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const projectWithStats = await APIClient.getProject(id);

          if (projectWithStats) {
            // Extract just the project data (without stats)
            const { stats, ...project } = projectWithStats;

            // Fix: Add project if it doesn't exist, update if it does
            set((state) => {
              const existingIndex = state.projects.findIndex(
                (p) => p.id === id
              );

              if (existingIndex >= 0) {
                // Update existing project
                const newProjects = [...state.projects];
                newProjects[existingIndex] = project;
                return {
                  projects: newProjects,
                  isLoading: false,
                  error: null,
                  lastFetch: new Date(),
                };
              } else {
                // Add new project if not found
                return {
                  projects: [...state.projects, project],
                  isLoading: false,
                  error: null,
                  lastFetch: new Date(),
                };
              }
            });
          } else {
            set({
              isLoading: false,
              error: `Project with ID ${id} not found`,
            });
          }
        } catch (error) {
          console.error(`Failed to load project ${id}:`, error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : `Failed to load project ${id}`,
          });
        }
      },

      refreshData: async () => {
        // Force refresh by clearing lastFetch and reloading
        set({ lastFetch: null });
        await get().loadProjects();
      },

      addProject: async (project) => {
        try {
          // Try to create project via API first
          const createInput: CreateProjectInput = {
            name: project.name,
            description: project.description || "",
            defaultPrice: project.defaultPrice || 0,
            currency:
              (project.currency as "USD" | "EUR" | "BTC" | "ETH") || "USD",
            payTo: project.payTo,
            paymentChains: project.paymentChains || [],
          };

          const apiProject = await APIClient.createProject(createInput);

          // Add to store
          set((state) => ({
            projects: [...state.projects, apiProject],
            lastFetch: new Date(),
          }));

          return apiProject.id;
        } catch (error) {
          console.error(
            "Failed to create project via API, falling back to local creation:",
            error
          );

          // Fallback to local implementation
          const newId = crypto.randomUUID();
          const now = new Date().toISOString();

          const newProject: Project = {
            id: newId,
            name: project.name,
            slug: project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: project.description || null,
            defaultPrice: project.defaultPrice || 0,
            currency: project.currency || "USD",
            payTo: project.payTo,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            paymentChains: project.paymentChains || [],
            endpoints: [],
          };

          set((state) => ({
            projects: [...state.projects, newProject],
          }));

          return newId;
        }
      },

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      getProject: (id) => get().projects.find((p) => p.id === id),

      addEndpoint: async (projectId, endpoint) => {
        try {
          // Try to create endpoint via API first
          const createInput: CreateEndpointInput = {
            url: endpoint.url,
            path: endpoint.path || endpoint.url,
            method: endpoint.method || "GET",
            headers: endpoint.headers,
            body: endpoint.body,
            params: endpoint.params,
            price: endpoint.price,
            description: endpoint.description,
            creditsEnabled: endpoint.creditsEnabled || false,
            minTopupAmount: endpoint.minTopupAmount || 10,
          };

          const apiEndpoint = await APIClient.createEndpoint(
            projectId,
            createInput
          );

          // Add to store
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    endpoints: [...p.endpoints, apiEndpoint],
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
            lastFetch: new Date(),
          }));
        } catch (error) {
          console.error(
            "Failed to create endpoint via API, falling back to local creation:",
            error
          );

          // Fallback to local implementation
          const now = new Date().toISOString();

          const newEndpoint: Endpoint = {
            id: crypto.randomUUID(),
            projectId,
            url: endpoint.url,
            path: endpoint.path || endpoint.url,
            method: endpoint.method || "GET",
            headers: endpoint.headers ? JSON.stringify(endpoint.headers) : null,
            body: endpoint.body ? JSON.stringify(endpoint.body) : null,
            params: endpoint.params ? JSON.stringify(endpoint.params) : null,
            price: endpoint.price || null,
            description: endpoint.description || null,
            creditsEnabled: endpoint.creditsEnabled || false,
            minTopupAmount: endpoint.minTopupAmount || 10,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            proxyUrl: `${endpoint.url}`, // Add required proxyUrl field
          };

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    endpoints: [...p.endpoints, newEndpoint],
                    updatedAt: now,
                  }
                : p
            ),
          }));
        }
      },

      updateEndpoint: (projectId, endpointId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  endpoints: p.endpoints.map((e) =>
                    e.id === endpointId
                      ? {
                          ...e,
                          ...updates,
                          updatedAt: new Date().toISOString(),
                        }
                      : e
                  ),
                  updatedAt: new Date().toISOString(),
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
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      getEndpoint: (projectId, endpointId) =>
        get()
          .projects.find((p) => p.id === projectId)
          ?.endpoints.find((e) => e.id === endpointId),
    }),
    {
      name: "xpay-store", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        lastFetch: state.lastFetch ? state.lastFetch.toISOString() : null,
        // Don't persist loading/error states
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.lastFetch && typeof state.lastFetch === "string") {
          state.lastFetch = new Date(state.lastFetch);
        }
      },
    }
  )
);
