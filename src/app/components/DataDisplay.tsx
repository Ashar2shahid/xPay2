import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface DataFieldProps {
  label: string;
  value: string | number | boolean | null | undefined | string[];
  type?: "text" | "currency" | "boolean" | "date" | "array";
}

export function DataField({ label, value, type = "text" }: DataFieldProps) {
  const formatValue = () => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">N/A</span>;
    }

    switch (type) {
      case "currency":
        return <span className="font-mono">${Number(value).toFixed(2)}</span>;

      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Yes" : "No"}
          </Badge>
        );

      case "date":
        const date = new Date(value as string);
        return (
          <span className="font-mono">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </span>
        );

      case "array":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge key={index} variant="outline">
                  {String(item)}
                </Badge>
              ))}
            </div>
          );
        }
        return <span>{String(value)}</span>;

      default:
        return <span>{String(value)}</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm font-medium">{formatValue()}</div>
      </CardContent>
    </Card>
  );
}

interface DataGridProps {
  data: Record<string, string | number | boolean | null | undefined | string[]>;
  title?: string;
  excludeFields?: string[];
  fieldTypes?: Record<string, DataFieldProps["type"]>;
}

export function DataGrid({
  data,
  title,
  excludeFields = [],
  fieldTypes = {},
}: DataGridProps) {
  const fields = Object.entries(data).filter(
    ([key]) => !excludeFields.includes(key)
  );

  const formatLabel = (key: string) => {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="space-y-4">
      {title && (
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            All fields from API response
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map(([key, value]) => (
          <DataField
            key={key}
            label={formatLabel(key)}
            value={value}
            type={fieldTypes[key] || "text"}
          />
        ))}
      </div>
    </div>
  );
}
