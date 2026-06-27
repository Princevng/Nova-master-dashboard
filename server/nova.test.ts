import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@serenityaesthetics.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createStaffContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "staff-user",
    email: "staff@serenityaesthetics.com",
    name: "Staff User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns the authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("admin@serenityaesthetics.com");
    expect(user?.role).toBe("admin");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx = createAdminContext();
    ctx.res.clearCookie = (name: string) => { cleared.push(name); };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared.length).toBeGreaterThan(0);
  });
});

describe("metrics.getOverview", () => {
  it("returns overview metrics for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.metrics.getOverview();
    expect(result).toHaveProperty("today");
    expect(result).toHaveProperty("week");
    expect(result).toHaveProperty("month");
    expect(result).toHaveProperty("sparkline");
    expect(typeof result.today.totalCalls).toBe("number");
    expect(typeof result.today.appointmentsBooked).toBe("number");
    expect(Array.isArray(result.sparkline)).toBe(true);
  });
});

describe("callLogs.list", () => {
  it("returns call logs array for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.callLogs.list({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("appointments.list", () => {
  it("returns appointments for all statuses", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.appointments.list({ status: "all" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("filters appointments by status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const booked = await caller.appointments.list({ status: "booked" });
    expect(Array.isArray(booked)).toBe(true);
    booked.forEach((a) => expect(a.status).toBe("booked"));
  });
});

describe("knowledge.list", () => {
  it("returns all knowledge base entries", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.knowledge.list({ type: "all" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("filters by type", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const faqs = await caller.knowledge.list({ type: "faq" });
    faqs.forEach((e) => expect(e.type).toBe("faq"));
  });
});

describe("settings.getTenant", () => {
  it("returns tenant configuration for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.getTenant();
    expect(result).toBeDefined();
  });
});

describe("team.list", () => {
  it("returns team members for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.team.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
