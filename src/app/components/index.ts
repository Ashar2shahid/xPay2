// Page components
export { DynamicHeader } from "./DynamicHeader";

// Metric components
export { MetricCard } from "./MetricCard";
export type { MetricCardProps } from "./MetricCard";
export { StatsOverview } from "./StatsOverview";
export type { StatsOverviewProps } from "./StatsOverview";

// Endpoint components
export { EndpointCard } from "./EndpointCard";
export type { EndpointCardProps } from "./EndpointCard";
export { EndpointList } from "./EndpointList";
export type { EndpointListProps } from "./EndpointList";

// Chart components
export { PerformanceChart, generateHourlyData } from "./PerformanceChart";
export type { PerformanceChartProps, ChartDataPoint } from "./PerformanceChart";

// Activity components
export {
  RecentActivity,
  generateMockErrors,
  generateMockConfig,
} from "./RecentActivity";
export type {
  RecentActivityProps,
  ErrorItem,
  ConfigItem,
} from "./RecentActivity";

// Utility components
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";
export { ChainSymbol } from "./ChainSymbol";
export type { ChainSymbolProps } from "./ChainSymbol";

// Dialog components
export { EditEndpointDialog } from "./EditEndpointDialog";
export type { EditEndpointDialogProps } from "./EditEndpointDialog";

// Existing components
export { ProjectCard } from "./ProjectCard";
export { AddEndpoint } from "./AddEndpoint";
export type { AddEndpointProps } from "./AddEndpoint";
