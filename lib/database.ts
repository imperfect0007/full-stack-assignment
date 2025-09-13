import sqlite3 from 'sqlite3';
import { promisify } from 'util';

// Simple interface for our database operations
export interface Database {
  run(sql: string, params?: any[]): Promise<sqlite3.RunResult>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  close(): Promise<void>;
}

// Set up our database connection
export async function initDatabase(): Promise<Database> {
  // Using a file-based database so data persists between restarts
  const db = new sqlite3.Database('./notes.db');
  
  // Convert callback-based methods to promises for easier async/await usage
  const run = promisify(db.run.bind(db));
  const get = promisify(db.get.bind(db));
  const all = promisify(db.all.bind(db));
  const close = promisify(db.close.bind(db));

  // Create our database tables if they don't exist
  await run(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      tenant_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    )
  `);

  // Add some initial data to get us started
  await seedDatabase(run as any, get as any);

  return {
    run: run as (sql: string, params?: any[]) => Promise<sqlite3.RunResult>,
    get: get as (sql: string, params?: any[]) => Promise<any>,
    all: all as (sql: string, params?: any[]) => Promise<any[]>,
    close
  };
}

// Add some sample data to make testing easier
async function seedDatabase(run: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>, get: (sql: string, params?: any[]) => Promise<any>) {
  // Don't add data if we already have tenants
  const existingTenants = await get(`SELECT COUNT(*) as count FROM tenants`);
  
  if (existingTenants && existingTenants.count > 0) {
    console.log('Database already has data, skipping seed...');
    return;
  }

  console.log('Adding sample companies and users...');
  
  // Create our two test companies
  await run(`
    INSERT INTO tenants (slug, name, plan) VALUES 
    ('acme', 'Acme Corp', 'free'),
    ('globex', 'Globex Corp', 'free')
  `);

  // Hash the default password for all test accounts
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('password', 10);

  // Create test users for both companies
  await run(`
    INSERT INTO users (email, password_hash, role, tenant_id) VALUES 
    ('admin@acme.test', ?, 'admin', 1),
    ('user@acme.test', ?, 'member', 1),
    ('admin@globex.test', ?, 'admin', 2),
    ('user@globex.test', ?, 'member', 2)
  `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword]);
  
  console.log('Sample data added successfully!');
}
