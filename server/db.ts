import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import path from 'path'
import * as schema from '../shared/schema'

const dbPath = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'sellerdesk.db')}`

const client = createClient({ url: dbPath })

export const db = drizzle(client, { schema })

// Auto-migrate: create tables if they don't exist
export async function initializeDatabase() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('owner', 'staff')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      sale_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      customer_state TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Packed','Dispatched','Delivered','Cancelled','Returned')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      current_stock INTEGER NOT NULL DEFAULT 0,
      min_stock_level INTEGER NOT NULL DEFAULT 5,
      cost_price REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      issue_type TEXT NOT NULL CHECK(issue_type IN ('Payment delay','Wrong item','Return','Damaged')),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','In Progress','Resolved')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Seed default owner if no users exist
  const result = await client.execute('SELECT COUNT(*) as count FROM users')
  const count = Number(result.rows[0][0])
  if (count === 0) {
    await client.execute({
      sql: 'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
      args: ['Owner', '1234', 'owner']
    })
    console.log('✅ Default owner created: PIN = 1234')
  }
}
