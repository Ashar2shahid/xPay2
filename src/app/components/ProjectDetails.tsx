import { Project } from "@/types";
import { DataGrid } from "./DataDisplay";

interface ProjectDetailsProps {
  project: Project;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  // Define field types for proper formatting
  const fieldTypes = {
    defaultPrice: "currency" as const,
    isActive: "boolean" as const,
    createdAt: "date" as const,
    updatedAt: "date" as const,
    paymentChains: "array" as const,
  };

  // Exclude endpoints from the general data display since they're complex
  const excludeFields = ["endpoints"];

  // Convert project to compatible record type
  const projectData = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    defaultPrice: project.defaultPrice,
    currency: project.currency,
    payTo: project.payTo,
    isActive: project.isActive,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    paymentChains: project.paymentChains,
  };

  return (
    <div className="space-y-6">
      <DataGrid
        data={projectData}
        title="Project Details"
        excludeFields={excludeFields}
        fieldTypes={fieldTypes}
      />

      {project.endpoints.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Endpoints</h3>
            <p className="text-sm text-muted-foreground">
              {project.endpoints.length} endpoint(s) configured
            </p>
          </div>
          <div className="grid gap-4">
            {project.endpoints.map((endpoint) => (
              <div key={endpoint.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{endpoint.url}</h4>
                  <span className="text-sm text-muted-foreground">
                    {endpoint.method}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {endpoint.description || "No description"}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>ID: {endpoint.id}</span>
                  <span>Active: {endpoint.isActive ? "Yes" : "No"}</span>
                  {endpoint.price && <span>Price: ${endpoint.price}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
