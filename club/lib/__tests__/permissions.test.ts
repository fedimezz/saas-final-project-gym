import { describe, it, expect, vi } from "vitest";

// permissions.ts imports the Prisma client at module scope (for the
// DB-backed hasPermission() check), but this file only tests the pure,
// DB-free helpers (PERMISSION_CATALOG, isValidPermissionKey). Mock it out
// so these tests don't require a generated Prisma client / live database.
vi.mock("@/lib/prisma", () => ({ default: {} }));

const { PERMISSION_CATALOG, PERMISSION_KEYS, isValidPermissionKey } = await import(
  "../permissions"
);

describe("PERMISSION_CATALOG", () => {
  it("has no duplicate keys", () => {
    const unique = new Set(PERMISSION_KEYS);
    expect(unique.size).toBe(PERMISSION_KEYS.length);
  });

  it("every entry has a non-empty key, label, group, and description", () => {
    for (const perm of PERMISSION_CATALOG) {
      expect(perm.key.length).toBeGreaterThan(0);
      expect(perm.label.length).toBeGreaterThan(0);
      expect(perm.group.length).toBeGreaterThan(0);
      expect(perm.description.length).toBeGreaterThan(0);
    }
  });

  it("includes the reports.view permission used by the admin reports routes", () => {
    expect(PERMISSION_KEYS).toContain("reports.view");
  });
});

describe("isValidPermissionKey", () => {
  it("returns true for a real key", () => {
    expect(isValidPermissionKey("members.write")).toBe(true);
  });

  it("returns false for an unknown key", () => {
    expect(isValidPermissionKey("not.a.real.key")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isValidPermissionKey("MEMBERS.WRITE")).toBe(false);
  });
});
