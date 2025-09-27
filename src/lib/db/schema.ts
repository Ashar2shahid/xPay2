import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const proxiedServices = sqliteTable('proxied_services', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  originalUrl: text('original_url').notNull(),
  proxySlug: text('proxy_slug').notNull().unique(),
  title: text('title'),
  description: text('description'),
  pricePerRequest: real('price_per_request').notNull(),
  currency: text('currency').notNull().default('USD'),
  network: text('network').notNull().default('base-sepolia'),
  payTo: text('pay_to').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const apiLogs = sqliteTable('api_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  serviceId: text('service_id').notNull().references(() => proxiedServices.id),
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

export const receipts = sqliteTable('receipts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  logId: text('log_id').notNull().references(() => apiLogs.id),
  serviceId: text('service_id').notNull().references(() => proxiedServices.id),
  transactionHash: text('transaction_hash').notNull(),
  paymentAmount: real('payment_amount').notNull(),
  currency: text('currency').notNull(),
  network: text('network').notNull(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  blockNumber: integer('block_number'),
  gasUsed: integer('gas_used'),
  receiptData: text('receipt_data'),
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

export type ProxiedService = typeof proxiedServices.$inferSelect;
export type NewProxiedService = typeof proxiedServices.$inferInsert;
export type ApiLog = typeof apiLogs.$inferSelect;
export type NewApiLog = typeof apiLogs.$inferInsert;
export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;