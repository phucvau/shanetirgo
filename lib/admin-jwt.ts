type AdminJwtPayload = {
  sub: string;
  username: string;
  email: string;
  role: "admin";
  iat: number;
  exp: number;
};

const DEFAULT_SECRET = "dev-admin-jwt-secret-change-in-production";

function getSecret() {
  return process.env.ADMIN_JWT_SECRET || DEFAULT_SECRET;
}

function base64UrlEncode(input: Uint8Array) {
  let str = "";
  for (let i = 0; i < input.length; i += 1) {
    str += String.fromCharCode(input[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signHmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verifyHmac(value: string, signature: string, secret: string) {
  const expected = await signHmac(value, secret);
  return expected === signature;
}

export async function createAdminJwt(input: { sub: string; username: string; email: string }, ttlSeconds = 60 * 60 * 12) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminJwtPayload = {
    sub: input.sub,
    username: input.username,
    email: input.email,
    role: "admin",
    iat: now,
    exp: now + ttlSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHmac(signingInput, getSecret());
  return `${signingInput}.${signature}`;
}

export async function verifyAdminJwt(token?: string | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const ok = await verifyHmac(signingInput, signature, getSecret());
  if (!ok) return null;

  try {
    const payloadText = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(payloadText) as AdminJwtPayload;
    if (!payload?.exp || Math.floor(Date.now() / 1000) >= payload.exp) return null;
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}
