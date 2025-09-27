#!/usr/bin/env tsx

/**
 * Database migration script to add credit system tables and columns
 * Run with: npm run migrate-schema
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';

const db = drizzle(new Database('./database.sqlite'));

async function migrateSchema() {
  console.log('🔄 Starting database migration for credit system...\n');

  try {
    // Check if new columns already exist
    const tableInfo = await db.all(sql`PRAGMA table_info(project_endpoints)`);
    const hasCreditsEnabled = tableInfo.some((col: any) => col.name === 'credits_enabled');
    const hasMinTopupAmount = tableInfo.some((col: any) => col.name === 'min_topup_amount');

    if (!hasCreditsEnabled || !hasMinTopupAmount) {
      console.log('➕ Adding credits configuration columns to project_endpoints table...');

      if (!hasCreditsEnabled) {
        await db.run(sql`ALTER TABLE project_endpoints ADD COLUMN credits_enabled INTEGER DEFAULT 0`);
        console.log('   ✅ Added credits_enabled column');
      }

      if (!hasMinTopupAmount) {
        await db.run(sql`ALTER TABLE project_endpoints ADD COLUMN min_topup_amount REAL DEFAULT 0`);
        console.log('   ✅ Added min_topup_amount column');
      }
    } else {
      console.log('✅ Credits configuration columns already exist in project_endpoints table');
    }

    // Check if endpoint_credits table exists
    const tables = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='endpoint_credits'`);

    if (tables.length === 0) {
      console.log('\n➕ Creating endpoint_credits table...');

      await db.run(sql`
        CREATE TABLE endpoint_credits (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          endpoint_id TEXT NOT NULL REFERENCES project_endpoints(id) ON DELETE CASCADE,
          user_address TEXT NOT NULL,
          balance REAL NOT NULL DEFAULT 0,
          total_deposited REAL NOT NULL DEFAULT 0,
          total_spent REAL NOT NULL DEFAULT 0,
          last_topup_amount REAL,
          last_topup_tx_hash TEXT,
          created_at INTEGER,
          updated_at INTEGER
        )
      `);

      // Create indexes for performance
      await db.run(sql`
        CREATE INDEX idx_endpoint_credits_user_endpoint
        ON endpoint_credits(endpoint_id, user_address)
      `);

      await db.run(sql`
        CREATE INDEX idx_endpoint_credits_project
        ON endpoint_credits(project_id)
      `);

      console.log('   ✅ Created endpoint_credits table');
      console.log('   ✅ Created performance indexes');
    } else {
      console.log('✅ endpoint_credits table already exists');
    }

    // Enable credit system for test endpoints if they exist
    const testProjects = await db.all(sql`
      SELECT id, name FROM projects
      WHERE name LIKE '%Test%' OR name LIKE '%E2E%'
    `);

    if (testProjects.length > 0) {
      console.log('\n🧪 Enabling credits for test projects...');

      for (const project of testProjects) {
        await db.run(sql`
          UPDATE project_endpoints
          SET credits_enabled = 1, min_topup_amount = 0.01
          WHERE project_id = ${project.id}
        `);
        console.log(`   ✅ Enabled credits for project: ${project.name}`);
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    console.log('\n📊 Credit System Features:');
    console.log('   • Zero-value payment authentication');
    console.log('   • Automatic overpayment → credit conversion');
    console.log('   • Credit balance tracking');
    console.log('   • Per-endpoint credit management');
    console.log('\n🔧 To enable credits for an endpoint:');
    console.log('   UPDATE project_endpoints SET credits_enabled = 1 WHERE id = "your_endpoint_id"');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export default migrateSchema;