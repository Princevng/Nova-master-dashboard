import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tenantId: int("tenantId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Tenants (Med Spa Clients) ────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  businessHours: json("businessHours"),
  twilioNumber: varchar("twilioNumber", { length: 32 }),
  novaStatus: mysqlEnum("novaStatus", ["active", "inactive", "setup"]).default("setup").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;

// ─── Services ────────────────────────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  providerType: varchar("providerType", { length: 128 }),
  dependencies: json("dependencies"),
  active: boolean("active").default(true).notNull(),
});

export type Service = typeof services.$inferSelect;

// ─── Providers (Staff) ───────────────────────────────────────────────────────
export const providers = mysqlTable("providers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  providerType: varchar("providerType", { length: 64 }).notNull(),
  skills: json("skills"),
  schedule: json("schedule"),
  gcalCalendarId: varchar("gcalCalendarId", { length: 255 }),
  active: boolean("active").default(true).notNull(),
});

export type Provider = typeof providers.$inferSelect;

// ─── Clients (Callers) ───────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;

// ─── Call Logs ───────────────────────────────────────────────────────────────
export const callLogs = mysqlTable("call_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  callerPhone: varchar("callerPhone", { length: 32 }),
  callerName: varchar("callerName", { length: 255 }),
  intent: varchar("intent", { length: 128 }),
  outcome: varchar("outcome", { length: 128 }),
  durationSeconds: int("durationSeconds"),
  transcript: text("transcript"),
  notes: text("notes"),
  isAfterHours: boolean("isAfterHours").default(false),
  wasEscalated: boolean("wasEscalated").default(false),
  callStart: timestamp("callStart").defaultNow().notNull(),
});

export type CallLog = typeof callLogs.$inferSelect;

// ─── Appointments ────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  clientId: int("clientId"),
  serviceId: int("serviceId"),
  providerId: int("providerId"),
  clientName: varchar("clientName", { length: 255 }),
  clientPhone: varchar("clientPhone", { length: 32 }),
  serviceName: varchar("serviceName", { length: 255 }),
  providerName: varchar("providerName", { length: 255 }),
  startTime: timestamp("startTime").notNull(),
  status: mysqlEnum("status", ["booked", "rescheduled", "cancelled", "no_show"]).default("booked").notNull(),
  gcalEventId: varchar("gcalEventId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;

// ─── Knowledge Base ──────────────────────────────────────────────────────────
export const knowledgeBase = mysqlTable("knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  type: mysqlEnum("type", ["faq", "policy", "medical", "document"]).notNull(),
  question: text("question"),
  content: text("content").notNull(),
  embeddingStatus: mysqlEnum("embeddingStatus", ["pending", "processing", "complete", "failed"]).default("pending"),
  sourceFileName: varchar("sourceFileName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBaseEntry = typeof knowledgeBase.$inferSelect;

// ─── Metrics (Daily Aggregates) ──────────────────────────────────────────────
export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  date: varchar("date", { length: 16 }).notNull(), // YYYY-MM-DD
  totalCalls: int("totalCalls").default(0).notNull(),
  appointmentsBooked: int("appointmentsBooked").default(0).notNull(),
  afterHoursCalls: int("afterHoursCalls").default(0).notNull(),
  escalations: int("escalations").default(0).notNull(),
  missedCallsPrevented: int("missedCallsPrevented").default(0).notNull(),
});

export type Metric = typeof metrics.$inferSelect;

// ─── Team Members ────────────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["admin", "staff"]).default("staff").notNull(),
  status: mysqlEnum("status", ["active", "invited", "revoked"]).default("invited").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
