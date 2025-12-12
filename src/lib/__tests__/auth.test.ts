import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only before any imports
vi.mock("server-only", () => ({}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock jose
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn(),
}));

import { getSession } from "../auth";

// Import mocked modules
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no token is present in cookies", async () => {
    // Mock cookies to return no token
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const result = await getSession();

    expect(result).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  });

  it("returns null when token value is undefined", async () => {
    // Mock cookies to return an object without a value
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({}),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const result = await getSession();

    expect(result).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  });

  it("returns session payload when token is valid", async () => {
    const mockToken = "valid.jwt.token";
    const mockPayload = {
      userId: "user123",
      email: "test@example.com",
      expiresAt: new Date("2025-12-31"),
    };

    // Mock cookies to return a token
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    // Mock jwtVerify to return valid payload
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: mockPayload,
    } as any);

    const result = await getSession();

    expect(result).toEqual(mockPayload);
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    expect(jwtVerify).toHaveBeenCalledWith(
      mockToken,
      expect.any(Uint8Array) // JWT_SECRET
    );
  });

  it("returns null when jwtVerify throws an error", async () => {
    const mockToken = "invalid.jwt.token";

    // Mock cookies to return a token
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    // Mock jwtVerify to throw an error
    vi.mocked(jwtVerify).mockRejectedValue(new Error("Invalid token"));

    const result = await getSession();

    expect(result).toBeNull();
    expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.any(Uint8Array));
  });

  it("returns null when jwtVerify throws token expired error", async () => {
    const mockToken = "expired.jwt.token";

    // Mock cookies to return a token
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    // Mock jwtVerify to throw an expired token error
    vi.mocked(jwtVerify).mockRejectedValue(
      new Error("Token has expired")
    );

    const result = await getSession();

    expect(result).toBeNull();
  });

  it("returns null when jwtVerify throws signature verification error", async () => {
    const mockToken = "tampered.jwt.token";

    // Mock cookies to return a token
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    // Mock jwtVerify to throw a signature verification error
    vi.mocked(jwtVerify).mockRejectedValue(
      new Error("Signature verification failed")
    );

    const result = await getSession();

    expect(result).toBeNull();
  });

  it("correctly handles session payload with all required fields", async () => {
    const mockToken = "complete.jwt.token";
    const expiresAt = new Date("2025-12-31T23:59:59Z");
    const mockPayload = {
      userId: "user-abc-123",
      email: "user@test.com",
      expiresAt: expiresAt,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    vi.mocked(jwtVerify).mockResolvedValue({
      payload: mockPayload,
    } as any);

    const result = await getSession();

    expect(result).toBeDefined();
    expect(result?.userId).toBe("user-abc-123");
    expect(result?.email).toBe("user@test.com");
    expect(result?.expiresAt).toEqual(expiresAt);
  });

  it("handles concurrent getSession calls correctly", async () => {
    const mockToken = "valid.jwt.token";
    const mockPayload = {
      userId: "user123",
      email: "test@example.com",
      expiresAt: new Date("2025-12-31"),
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    vi.mocked(jwtVerify).mockResolvedValue({
      payload: mockPayload,
    } as any);

    // Make multiple concurrent calls
    const results = await Promise.all([
      getSession(),
      getSession(),
      getSession(),
    ]);

    // All should return the same session
    results.forEach((result) => {
      expect(result).toEqual(mockPayload);
    });

    // cookies() should have been called 3 times
    expect(cookies).toHaveBeenCalledTimes(3);
  });

  it("does not call jwtVerify when cookie is not present", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    await getSession();

    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("handles malformed cookie structure gracefully", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ name: "auth-token" }), // Missing value property
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const result = await getSession();

    expect(result).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });
});
