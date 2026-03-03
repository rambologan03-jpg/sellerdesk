import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    pin: text('pin').notNull(),
    role: text('role', { enum: ['owner', 'staff'] }).notNull().default('staff'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const orders = sqliteTable('orders', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: text('order_id').notNull(),
    productName: text('product_name').notNull(),
    sku: text('sku').notNull(),
    quantity: integer('quantity').notNull(),
    salePrice: real('sale_price').notNull(),
    costPrice: real('cost_price').notNull(),
    customerState: text('customer_state').notNull(),
    status: text('status', {
        enum: ['Pending', 'Packed', 'Dispatched', 'Delivered', 'Cancelled', 'Returned']
    }).notNull().default('Pending'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const inventory = sqliteTable('inventory', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productName: text('product_name').notNull(),
    sku: text('sku').notNull().unique(),
    currentStock: integer('current_stock').notNull().default(0),
    minStockLevel: integer('min_stock_level').notNull().default(5),
    costPrice: real('cost_price').notNull(),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const tickets = sqliteTable('tickets', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: text('order_id').notNull(),
    issueType: text('issue_type', {
        enum: ['Payment delay', 'Wrong item', 'Return', 'Damaged']
    }).notNull(),
    description: text('description').notNull(),
    status: text('status', {
        enum: ['Open', 'In Progress', 'Resolved']
    }).notNull().default('Open'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export type User = typeof users.$inferSelect
export type Order = typeof orders.$inferSelect
export type InventoryItem = typeof inventory.$inferSelect
export type Ticket = typeof tickets.$inferSelect

export type InsertUser = typeof users.$inferInsert
export type InsertOrder = typeof orders.$inferInsert
export type InsertInventoryItem = typeof inventory.$inferInsert
export type InsertTicket = typeof tickets.$inferInsert
