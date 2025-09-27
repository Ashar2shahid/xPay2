// Database initialization script
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { proxiedServices, users } from '../src/lib/db/schema';
import { createId } from '@paralleldrive/cuid2';
import * as fs from 'fs';

// Create database file if it doesn't exist
const dbPath = './database.sqlite';
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Create tables
console.log('Creating database tables...');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS proxied_services (
    id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    proxy_slug TEXT NOT NULL UNIQUE,
    title TEXT,
    description TEXT,
    price_per_request REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    network TEXT NOT NULL DEFAULT 'base-sepolia',
    pay_to TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS api_logs (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    request_method TEXT NOT NULL,
    request_path TEXT NOT NULL,
    request_headers TEXT,
    request_body TEXT,
    response_status INTEGER,
    response_headers TEXT,
    response_body TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_amount REAL,
    transaction_hash TEXT,
    settlement_status TEXT DEFAULT 'pending',
    settlement_tx_hash TEXT,
    settlement_error TEXT,
    client_ip TEXT,
    user_agent TEXT,
    processing_time_ms INTEGER,
    created_at INTEGER,
    FOREIGN KEY (service_id) REFERENCES proxied_services (id)
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    log_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    payment_amount REAL NOT NULL,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    block_number INTEGER,
    gas_used INTEGER,
    receipt_data TEXT,
    created_at INTEGER,
    FOREIGN KEY (log_id) REFERENCES api_logs (id),
    FOREIGN KEY (service_id) REFERENCES proxied_services (id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    api_key TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER,
    updated_at INTEGER
  );
`);

// Insert test data
console.log('Inserting test data...');

const testServiceId = createId();
const testUserId = createId();

// Insert test user
sqlite.prepare(`
  INSERT OR REPLACE INTO users (id, email, name, api_key, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  testUserId,
  'test@example.com',
  'Test User',
  'test-api-key-' + createId(),
  Date.now(),
  Date.now()
);

// Insert test proxied service pointing to a public API
sqlite.prepare(`
  INSERT OR REPLACE INTO proxied_services (
    id, original_url, proxy_slug, title, description,
    price_per_request, currency, network, pay_to,
    is_active, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  testServiceId,
  'https://jsonplaceholder.typicode.com', // Free testing API
  'test-api',
  'Test JSON API',
  'A test API service for testing x402 payments',
  0.01, // $0.01 per request
  'USD',
  'base-sepolia',
  process.env.ADDRESS || '0x0000000000000000000000000000000000000000',
  1,
  Date.now(),
  Date.now()
);

console.log('✅ Database initialized successfully!');
console.log('📝 Test service created:');
console.log(`   - Proxy URL: http://localhost:3000/api/proxy/test-api/posts/1`);
console.log(`   - Original URL: https://jsonplaceholder.typicode.com/posts/1`);
console.log(`   - Price: $0.01 per request`);
console.log(`   - Network: base-sepolia`);

sqlite.close();