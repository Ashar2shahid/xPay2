import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  defaultPrice: real('default_price').notNull(),
  currency: text('currency').notNull().default('USD'),
  payTo: text('pay_to').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectEndpoints = sqliteTable('project_endpoints', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  path: text('path').notNull(),
  method: text('method').notNull().default('*'),
  price: real('price'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectPaymentChains = sqliteTable('project_payment_chains', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  network: text('network').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const apiLogs = sqliteTable('api_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id),
  endpointId: text('endpoint_id').references(() => projectEndpoints.id),
  requestMethod: text('request_method').notNull(),
  requestPath: text('request_path').notNull(),
  requestHeaders: text('request_headers'),
  requestBody: text('request_body'),
  responseStatus: integer('response_status'),
  responseHeaders: text('response_headers'),
  responseBody: text('response_body'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentAmount: real('payment_amount'),
  transactionHash: text('transaction_hash'),
  settlementStatus: text('settlement_status').default('pending'),
  settlementTxHash: text('settlement_tx_hash'),
  settlementError: text('settlement_error'),
  clientIp: text('client_ip'),
  userAgent: text('user_agent'),
  processingTimeMs: integer('processing_time_ms'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  apiKey: text('api_key').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectEndpoint = typeof projectEndpoints.$inferSelect;
export type NewProjectEndpoint = typeof projectEndpoints.$inferInsert;
export type ProjectPaymentChain = typeof projectPaymentChains.$inferSelect;
export type NewProjectPaymentChain = typeof projectPaymentChains.$inferInsert;
export type ApiLog = typeof apiLogs.$inferSelect;
export type NewApiLog = typeof apiLogs.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;