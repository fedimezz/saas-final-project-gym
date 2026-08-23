import { describe, it, expect, vi, beforeAll } from "vitest";

// lib/auth.ts imports the Prisma client at module scope. Mock it so these
// tests exercise the real requireUser/requireAdmin/requireOwner/requireCoach
// logic without needing a live database — we control exactly what
// prisma.user.findUnique returns per test.
const findUniqueMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  default: { user: { findUnique: (...args: unknown[]) => findUniqueMock(...args) } },
}));

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-do-not-use-in-production";
});

const { generateToken, requireUser, requireAdmin, requireOwner, requireCoach } = await import(
  "../auth"
);

function makeRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers["cookie"] = `token=${token}`;
  return new Request("https://example.test/api/whatever", { headers });
}

const BASE_PAYLOAD = { id: "user_1", email: "a@b.com", role: "MEMBER", name: "Test User" };

describe("requireUser — the core account-revocation fix from this session", () => {
  it("rejects a request with no token", async () => {
    const result = await requireUser(makeRequest());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("rejects a syntactically invalid token", async () => {
    const result = await requireUser(makeRequest("not-a-real-jwt"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("accepts a valid token for an active account, using CURRENT db data", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1",
      email: "a@b.com",
      role: "MEMBER",
      name: "Test User",
      isActive: true,
    });
    const token = generateToken(BASE_PAYLOAD);
    const result = await requireUser(makeRequest(token));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.id).toBe("user_1");
  });

  // This is the exact regression this test file exists to prevent: before
  // this session, a suspended account's still-unexpired JWT kept working
  // for up to 7 days because nothing re-checked the database.
  it("REJECTS a valid, unexpired token for an account suspended after the token was issued", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1",
      email: "a@b.com",
      role: "MEMBER",
      name: "Test User",
      isActive: false, // suspended by an admin after this token was issued
    });
    const token = generateToken(BASE_PAYLOAD);
    const result = await requireUser(makeRequest(token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("rejects a token for a user that no longer exists (e.g. deleted account)", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    const token = generateToken(BASE_PAYLOAD);
    const result = await requireUser(makeRequest(token));
    expect(result.ok).toBe(false);
  });

  it("uses the CURRENT db role, not a stale JWT role claim", async () => {
    // Token was issued while this user was a MEMBER...
    const token = generateToken(BASE_PAYLOAD);
    // ...but the DB now says they've since been promoted to ADMIN.
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1",
      email: "a@b.com",
      role: "ADMIN",
      name: "Test User",
      isActive: true,
    });
    const result = await requireUser(makeRequest(token));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.role).toBe("ADMIN");
  });
});

describe("requireAdmin", () => {
  it("rejects an active MEMBER account (correct role check)", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "MEMBER", name: "Test", isActive: true,
    });
    const token = generateToken(BASE_PAYLOAD);
    const result = await requireAdmin(makeRequest(token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("accepts an active ADMIN account", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "ADMIN", name: "Test", isActive: true,
    });
    const token = generateToken({ ...BASE_PAYLOAD, role: "ADMIN" });
    const result = await requireAdmin(makeRequest(token));
    expect(result.ok).toBe(true);
  });

  // Regression: an admin demoted to MEMBER (or suspended) must lose admin
  // access even while still holding their old admin-issued token.
  it("rejects a token claiming ADMIN if the db now says the account was demoted", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "MEMBER", name: "Test", isActive: true,
    });
    const token = generateToken({ ...BASE_PAYLOAD, role: "ADMIN" }); // stale, claims admin
    const result = await requireAdmin(makeRequest(token));
    expect(result.ok).toBe(false);
  });
});

describe("requireOwner", () => {
  it("rejects an active ADMIN account (OWNER is a stricter tier)", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "ADMIN", name: "Test", isActive: true,
    });
    const token = generateToken({ ...BASE_PAYLOAD, role: "ADMIN" });
    const result = await requireOwner(makeRequest(token));
    expect(result.ok).toBe(false);
  });

  it("accepts an active OWNER account", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "OWNER", name: "Test", isActive: true,
    });
    const token = generateToken({ ...BASE_PAYLOAD, role: "OWNER" });
    const result = await requireOwner(makeRequest(token));
    expect(result.ok).toBe(true);
  });
});

describe("requireCoach", () => {
  it("rejects an ADMIN account (staff manage coaches, they don't act as one)", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "ADMIN", name: "Test", isActive: true,
    });
    const token = generateToken({ ...BASE_PAYLOAD, role: "ADMIN" });
    const result = await requireCoach(makeRequest(token));
    expect(result.ok).toBe(false);
  });

  it("accepts an active COACH account", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "COACH", name: "Test", isActive: true,
    });
    const token = generateToken({ ...BASE_PAYLOAD, role: "COACH" });
    const result = await requireCoach(makeRequest(token));
    expect(result.ok).toBe(true);
  });

  it("rejects a suspended COACH account", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1", email: "a@b.com", role: "COACH", name: "Test", isActive: false,
    });
    const token = generateToken({ ...BASE_PAYLOAD, role: "COACH" });
    const result = await requireCoach(makeRequest(token));
    expect(result.ok).toBe(false);
  });
});
