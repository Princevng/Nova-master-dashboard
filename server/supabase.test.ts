import { describe, expect, it } from "vitest";

describe("Supabase credentials", () => {
  it("SUPABASE_URL is set and well-formed", () => {
    const url = process.env.SUPABASE_URL;
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co/);
  });

  it("SUPABASE_ANON_KEY is set and is a JWT", () => {
    const key = process.env.SUPABASE_ANON_KEY;
    expect(key).toBeTruthy();
    // JWT has 3 dot-separated base64 segments
    expect(key?.split(".").length).toBe(3);
  });

  it("SUPABASE_SERVICE_ROLE_KEY is set and is a JWT", () => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(key).toBeTruthy();
    expect(key?.split(".").length).toBe(3);
  });

  it("can connect to Supabase and query the tenants table", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await client
      .from("tenants")
      .select("id, name")
      .limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    // Serenity should be there
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.[0]?.name).toBe("Serenity Aesthetics & Wellness");
  });
});
