import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../src/lib/db/schema';

async function initDatabase() {
  console.log('🚀 Initializing database...');

  try {
    const sqlite = new Database('./database.sqlite');
    const db = drizzle(sqlite, { schema });

    console.log('📋 Creating tables...');

    // Create projects table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        default_price REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        pay_to TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    // Create project_endpoints table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS project_endpoints (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        url TEXT NOT NULL,
        path TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT '*',
        headers TEXT,
        body TEXT,
        params TEXT,
        price REAL,
        description TEXT,
        credits_enabled INTEGER NOT NULL DEFAULT 0,
        min_topup_amount REAL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create project_payment_chains table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS project_payment_chains (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        network TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create endpoint_credits table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS endpoint_credits (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        endpoint_id TEXT NOT NULL,
        user_address TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        total_deposited REAL NOT NULL DEFAULT 0,
        total_spent REAL NOT NULL DEFAULT 0,
        last_topup_amount REAL,
        last_topup_tx_hash TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (endpoint_id) REFERENCES project_endpoints(id) ON DELETE CASCADE
      )
    `);

    // Create api_logs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        endpoint_id TEXT,
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
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (endpoint_id) REFERENCES project_endpoints(id)
      )
    `);

    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        api_key TEXT NOT NULL UNIQUE,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    console.log('✅ Database initialized successfully!');
    console.log('📁 Database file: ./database.sqlite');

    // Display table info
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📊 Created tables:', tables.map((t: any) => t.name).join(', '));

    sqlite.close();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();