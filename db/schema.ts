import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  json,
  int,
  decimal,
  timestamp,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// MAB AI Strategies — Pricing Engine
// ---------------------------------------------------------------------------

/**
 * One row per filterable option in the pricing rubric.
 * category: location | size | industry | title | urgency | relationship | complexity
 * multiplier is applied multiplicatively to a service's baseline rate.
 */
export const rateFactors = mysqlTable("rate_factors", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 32 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  detail: varchar("detail", { length: 512 }),
  multiplier: decimal("multiplier", { precision: 5, scale: 3 })
    .notNull()
    .default("1.000"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RateFactor = typeof rateFactors.$inferSelect;

/**
 * À la carte catalog of MAB AI Strategies products & services.
 * goodDesc/betterDesc/bestDesc describe the scope delivered at each proposal tier.
 */
export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull().default("project"),
  basePrice: decimal("basePrice", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  goodDesc: text("goodDesc"),
  betterDesc: text("betterDesc"),
  bestDesc: text("bestDesc"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;

/** Saved Good / Better / Best proposals, owned by the signed-in user. */
export const proposals = mysqlTable("proposals", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }),
  /** Snapshot of the rubric inputs: { location, size, industry, title, urgency, relationship, complexity } */
  inputs: json("inputs").notNull(),
  /** Snapshot of selected service ids + computed tier prices per line item */
  lineItems: json("lineItems").notNull(),
  totals: json("totals").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Proposal = typeof proposals.$inferSelect;

// TODO: Add your tables here. See docs/Database.md for schema examples and patterns.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()
