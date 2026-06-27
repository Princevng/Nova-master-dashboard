import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin, DEMO_TENANT_ID } from "./supabase";

// ─── Helper: resolve tenant UUID for current user ─────────────────────────────
// For now all authenticated users are scoped to the demo tenant.
// When multi-tenant auth is wired, this will look up the user's tenant_id
// from the users table in Supabase.
function getTenantId(_userId: number): string {
  return DEMO_TENANT_ID;
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

  // ─── Metrics ───────────────────────────────────────────────────────────────
  metrics: router({
    getOverview: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = getTenantId(ctx.user.id);

      const today = new Date().toISOString().split("T")[0]!;
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]!;
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]!;

      const { data: rows, error } = await supabaseAdmin
        .from("metrics")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("date", monthAgo)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const allRows = rows ?? [];
      const todayRow = allRows.find((r) => r.date === today);
      const weekRows = allRows.filter((r) => r.date >= weekAgo);
      const monthRows = allRows.filter((r) => r.date >= monthAgo);

      const sum = (arr: typeof allRows, key: string) =>
        arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

      return {
        today: {
          totalCalls: todayRow?.total_calls ?? 0,
          appointmentsBooked: todayRow?.appointments_booked ?? 0,
          afterHoursCalls: todayRow?.after_hours_calls ?? 0,
          missedCallsPrevented: todayRow?.missed_calls_prevented ?? 0,
          escalations: todayRow?.escalations ?? 0,
        },
        week: {
          totalCalls: sum(weekRows, "total_calls"),
          appointmentsBooked: sum(weekRows, "appointments_booked"),
        },
        month: {
          totalCalls: sum(monthRows, "total_calls"),
          appointmentsBooked: sum(monthRows, "appointments_booked"),
        },
        sparkline: [...allRows].reverse().slice(-14).map((r) => ({
          date: r.date,
          calls: r.total_calls,
          booked: r.appointments_booked,
        })),
      };
    }),
  }),

  // ─── Call Logs ─────────────────────────────────────────────────────────────
  callLogs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const tenantId = getTenantId(ctx.user.id);
        const { data, error } = await supabaseAdmin
          .from("call_logs")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("call_start", { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data ?? [];
      }),
  }),

  // ─── Appointments ──────────────────────────────────────────────────────────
  appointments: router({
    list: protectedProcedure
      .input(
        z.object({
          status: z.enum(["booked", "rescheduled", "cancelled", "no_show", "all"]).default("all"),
        })
      )
      .query(async ({ ctx, input }) => {
        const tenantId = getTenantId(ctx.user.id);

        // Fetch appointments without join (services.id is text, no FK for PostgREST)
        let query = supabaseAdmin
          .from("appointments")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("start_time", { ascending: false });

        if (input.status !== "all") {
          query = query.eq("status", input.status);
        }

        const { data: appts, error } = await query;
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        if (!appts || appts.length === 0) return [];

        // Enrich with service and provider names
        const serviceIds = Array.from(new Set(appts.map((a) => a.service_id).filter(Boolean)));
        const providerIds = Array.from(new Set(appts.map((a) => a.provider_id).filter(Boolean)));

        const [{ data: services }, { data: providers }] = await Promise.all([
          supabaseAdmin.from("services").select("id, name, category").in("id", serviceIds),
          supabaseAdmin.from("providers").select("id, name").in("id", providerIds),
        ]);

        const svcMap = Object.fromEntries((services ?? []).map((s) => [s.id, s]));
        const prvMap = Object.fromEntries((providers ?? []).map((p) => [p.id, p]));

        return appts.map((a) => ({
          ...a,
          service: svcMap[a.service_id] ?? null,
          provider: prvMap[a.provider_id] ?? null,
        }));
      }),
  }),

  // ─── Knowledge Base ────────────────────────────────────────────────────────
  knowledge: router({
    list: protectedProcedure
      .input(
        z.object({
          type: z.enum(["faq", "policy", "medical", "document", "all"]).default("all"),
        })
      )
      .query(async ({ ctx, input }) => {
        const tenantId = getTenantId(ctx.user.id);
        let query = supabaseAdmin
          .from("knowledge_base")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("updated_at", { ascending: false });

        if (input.type !== "all") {
          query = query.eq("type", input.type);
        }

        const { data, error } = await query;
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data ?? [];
      }),

    upsert: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid().optional(),
          type: z.enum(["faq", "policy", "medical", "document"]),
          title: z.string().optional(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantId = getTenantId(ctx.user.id);
        if (input.id) {
          const { error } = await supabaseAdmin
            .from("knowledge_base")
            .update({ title: input.title, content: input.content, embedding_status: "pending", updated_at: new Date().toISOString() })
            .eq("id", input.id)
            .eq("tenant_id", tenantId);
          if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        } else {
          const { error } = await supabaseAdmin
            .from("knowledge_base")
            .insert({ tenant_id: tenantId, type: input.type, title: input.title, content: input.content, embedding_status: "pending" });
          if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = getTenantId(ctx.user.id);
        const { error } = await supabaseAdmin
          .from("knowledge_base")
          .delete()
          .eq("id", input.id)
          .eq("tenant_id", tenantId);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),
  }),

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: router({
    getTenant: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = getTenantId(ctx.user.id);
      const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

    getServices: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = getTenantId(ctx.user.id);
      const { data, error } = await supabaseAdmin
        .from("services")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("category");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

    getProviders: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = getTenantId(ctx.user.id);
      const { data, error } = await supabaseAdmin
        .from("providers")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

    updateTenant: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          twilio_number: z.string().optional(),
          business_hours: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantId = getTenantId(ctx.user.id);
        const { error } = await supabaseAdmin
          .from("tenants")
          .update(input)
          .eq("id", tenantId);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),
  }),

  // ─── Team ──────────────────────────────────────────────────────────────────
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = getTenantId(ctx.user.id);
      const { data, error } = await supabaseAdmin
        .from("team_members")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("invited_at", { ascending: false });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

    invite: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          role: z.enum(["admin", "staff"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = getTenantId(ctx.user.id);
        const { error } = await supabaseAdmin
          .from("team_members")
          .insert({ tenant_id: tenantId, email: input.email, name: input.name, role: input.role, status: "invited" });
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),

    updateRole: protectedProcedure
      .input(z.object({ memberId: z.string().uuid(), role: z.enum(["admin", "staff"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = getTenantId(ctx.user.id);
        const { error } = await supabaseAdmin
          .from("team_members")
          .update({ role: input.role })
          .eq("id", input.memberId)
          .eq("tenant_id", tenantId);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),

    revoke: protectedProcedure
      .input(z.object({ memberId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = getTenantId(ctx.user.id);
        const { error } = await supabaseAdmin
          .from("team_members")
          .update({ status: "revoked" })
          .eq("id", input.memberId)
          .eq("tenant_id", tenantId);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
