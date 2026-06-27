import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  callLogs,
  appointments,
  knowledgeBase,
  metrics,
  teamMembers,
  tenants,
  services,
  providers,
} from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// ─── Helper: get tenant for current user ─────────────────────────────────────
async function getTenantId(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  // Use lowercase alias to avoid MySQL case-sensitivity issues
  const rows = await db.execute(sql`SELECT tenantId as tid FROM users WHERE id = ${userId} LIMIT 1`);
  const row = (rows as any)[0]?.[0];
  // Fall back to tenant 1 (demo tenant) if user has no tenantId assigned yet
  if (!row?.tid) return 1;
  return row.tid as number;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Metrics ─────────────────────────────────────────────────────────────
  metrics: router({
    getOverview: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = await getTenantId(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      const rows = await db
        .select()
        .from(metrics)
        .where(eq(metrics.tenantId, tenantId))
        .orderBy(desc(metrics.date))
        .limit(30);

      const todayRow = rows.find((r) => r.date === today);
      const weekRows = rows.filter((r) => r.date >= weekAgo);
      const monthRows = rows.filter((r) => r.date >= monthAgo);

      const sum = (arr: typeof rows, key: keyof typeof rows[0]) =>
        arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

      return {
        today: {
          totalCalls: todayRow?.totalCalls ?? 0,
          appointmentsBooked: todayRow?.appointmentsBooked ?? 0,
          afterHoursCalls: todayRow?.afterHoursCalls ?? 0,
          missedCallsPrevented: todayRow?.missedCallsPrevented ?? 0,
          escalations: todayRow?.escalations ?? 0,
        },
        week: {
          totalCalls: sum(weekRows, "totalCalls"),
          appointmentsBooked: sum(weekRows, "appointmentsBooked"),
        },
        month: {
          totalCalls: sum(monthRows, "totalCalls"),
          appointmentsBooked: sum(monthRows, "appointmentsBooked"),
        },
        sparkline: rows.slice(0, 14).reverse().map((r) => ({
          date: r.date,
          calls: r.totalCalls,
          booked: r.appointmentsBooked,
        })),
      };
    }),
  }),

  // ─── Call Logs ───────────────────────────────────────────────────────────
  callLogs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return db
          .select()
          .from(callLogs)
          .where(eq(callLogs.tenantId, tenantId))
          .orderBy(desc(callLogs.callStart))
          .limit(input.limit)
          .offset(input.offset);
      }),
  }),

  // ─── Appointments ─────────────────────────────────────────────────────────
  appointments: router({
    list: protectedProcedure
      .input(z.object({ status: z.enum(["booked", "rescheduled", "cancelled", "no_show", "all"]).default("all") }))
      .query(async ({ ctx, input }) => {
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const query = db
          .select()
          .from(appointments)
          .where(
            input.status === "all"
              ? eq(appointments.tenantId, tenantId)
              : and(eq(appointments.tenantId, tenantId), eq(appointments.status, input.status))
          )
          .orderBy(desc(appointments.startTime));
        return query;
      }),
  }),

  // ─── Knowledge Base ───────────────────────────────────────────────────────
  knowledge: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["faq", "policy", "medical", "document", "all"]).default("all") }))
      .query(async ({ ctx, input }) => {
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return db
          .select()
          .from(knowledgeBase)
          .where(
            input.type === "all"
              ? eq(knowledgeBase.tenantId, tenantId)
              : and(eq(knowledgeBase.tenantId, tenantId), eq(knowledgeBase.type, input.type))
          )
          .orderBy(desc(knowledgeBase.updatedAt));
      }),

    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        type: z.enum(["faq", "policy", "medical", "document"]),
        question: z.string().optional(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (input.id) {
          await db.update(knowledgeBase)
            .set({ question: input.question, content: input.content, embeddingStatus: "pending" })
            .where(and(eq(knowledgeBase.id, input.id), eq(knowledgeBase.tenantId, tenantId)));
        } else {
          await db.insert(knowledgeBase).values({
            tenantId,
            type: input.type,
            question: input.question,
            content: input.content,
            embeddingStatus: "pending",
          });
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(knowledgeBase)
          .where(and(eq(knowledgeBase.id, input.id), eq(knowledgeBase.tenantId, tenantId)));
        return { success: true };
      }),
  }),

  // ─── Settings ─────────────────────────────────────────────────────────────
  settings: router({
    getTenant: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = await getTenantId(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      return rows[0] ?? null;
    }),

    getServices: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = await getTenantId(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(services).where(eq(services.tenantId, tenantId));
    }),

    getProviders: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = await getTenantId(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(providers).where(eq(providers.tenantId, tenantId));
    }),

    updateTenant: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        twilioNumber: z.string().optional(),
        businessHours: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(tenants).set(input).where(eq(tenants.id, tenantId));
        return { success: true };
      }),
  }),

  // ─── Team ─────────────────────────────────────────────────────────────────
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = await getTenantId(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenantId)).orderBy(desc(teamMembers.invitedAt));
    }),

    invite: protectedProcedure
      .input(z.object({ email: z.string().email(), name: z.string().optional(), role: z.enum(["admin", "staff"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(teamMembers).values({ tenantId, email: input.email, name: input.name, role: input.role, status: "invited" });
        return { success: true };
      }),

    updateRole: protectedProcedure
      .input(z.object({ memberId: z.number(), role: z.enum(["admin", "staff"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(teamMembers)
          .set({ role: input.role })
          .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.tenantId, tenantId)));
        return { success: true };
      }),

    revoke: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = await getTenantId(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(teamMembers)
          .set({ status: "revoked" })
          .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.tenantId, tenantId)));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
