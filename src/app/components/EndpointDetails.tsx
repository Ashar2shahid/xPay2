import { Endpoint } from "@/types";
import { DataGrid } from "./DataDisplay";

interface EndpointDetailsProps {
  endpoint: Endpoint;
}

export function EndpointDetails({ endpoint }: EndpointDetailsProps) {
  // Define field types for proper formatting
  const fieldTypes = {
    price: "currency" as const,
    creditsEnabled: "boolean" as const,
    isActive: "boolean" as const,
    createdAt: "date" as const,
    updatedAt: "date" as const,
  };

  // Convert endpoint to compatible record type
  const endpointData = {
    id: endpoint.id,
    projectId: endpoint.projectId,
    url: endpoint.url,
    path: endpoint.path,
    method: endpoint.method,
    price: endpoint.price,
    description: endpoint.description,
    creditsEnabled: endpoint.creditsEnabled,
    minTopupAmount: endpoint.minTopupAmount,
    isActive: endpoint.isActive,
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt,
  };

  return (
    <div className="space-y-6">
      <DataGrid
        data={endpointData}
        title="Endpoint Details"
        fieldTypes={fieldTypes}
      />
    </div>
  );
}
