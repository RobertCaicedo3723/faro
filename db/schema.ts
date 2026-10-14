// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const budget=sqliteTable('faro_budget',{id:text('id').primaryKey(),spent:integer('spent').notNull().default(0),reserved:integer('reserved').notNull().default(0)});
export const runs=sqliteTable('faro_runs',{id:text('id').primaryKey(),created:text('created').notNull(),charge:integer('charge').notNull().default(0),status:text('status').notNull()});
