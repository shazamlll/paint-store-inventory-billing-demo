import { normalizeSupabaseProjectUrl } from "./development-supabase.js";
import { readEnvValue } from "./env.js";

export const publicRoutes = ["/login"];

export const operationalRoutePrefixes = [
  "/products",
  "/customers",
  "/sales",
  "/purchases",
  "/inventory",
  "/reports",
  "/search",
  "/dashboard"
];

export function getSupabaseAuthEnvironment(env = process.env) {
  const projectUrl = normalizeSupabaseProjectUrl(readEnvValue(env, "NEXT_PUBLIC_SUPABASE_URL"));
  const anonKey = readEnvValue(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const missing = [];

  if (!projectUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    ready: missing.length === 0,
    projectUrl,
    hasAnonKey: anonKey.length > 0,
    anonKeyPreview: previewAnonKey(anonKey),
    missing
  };
}

export async function signInWithSupabaseAuth(draft, client) {
  const errors = validateAuthDraft(draft);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      session: null
    };
  }

  if (!client?.auth?.signInWithPassword) {
    return {
      errors: {
        credentials: "Supabase Auth 尚未配置，无法登录。"
      },
      session: null
    };
  }

  const email = normalizeEmail(draft.email);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: draft.password
  });

  if (error) {
    return {
      errors: {
        credentials: "邮箱或密码不正确，或账号尚未启用。"
      },
      session: null
    };
  }

  return {
    errors: {},
    session: normalizeAuthSession(data?.session)
  };
}

export async function signOutSupabaseAuth(client) {
  if (!client?.auth?.signOut) {
    return {
      signedOut: false,
      error: "Supabase Auth 尚未配置。"
    };
  }

  const { error } = await client.auth.signOut();

  return {
    signedOut: !error,
    error: error?.message ?? null
  };
}

export function buildAuthGate({ pathname = "/", authReady = false, session = null, hasAuthClient = true } = {}) {
  if (isPublicRoute(pathname)) {
    return {
      allowed: true,
      reason: "public_route",
      redirectTo: null
    };
  }

  if (!hasAuthClient) {
    return {
      allowed: false,
      reason: "auth_unavailable",
      redirectTo: "/login"
    };
  }

  if (!authReady) {
    return {
      allowed: false,
      reason: "loading_session",
      redirectTo: null
    };
  }

  if (!session?.user) {
    return {
      allowed: false,
      reason: "missing_session",
      redirectTo: "/login"
    };
  }

  return {
    allowed: true,
    reason: "authenticated",
    redirectTo: null
  };
}

export function getInitialAuthShellState() {
  return {
    authReady: false,
    session: null
  };
}

export function isOperationalRoute(pathname = "/") {
  return operationalRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicRoute(pathname = "/") {
  return publicRoutes.includes(pathname);
}

export function getSupabaseSessionSummary(session) {
  if (!session?.user) {
    return "未登录：请先使用 Supabase Auth 登录。";
  }

  return `已登录：${session.user.email ?? "当前用户"}`;
}

function validateAuthDraft(draft) {
  const errors = {};

  if (!draft?.email?.trim()) {
    errors.email = "请输入邮箱。";
  } else if (!draft.email.includes("@")) {
    errors.email = "请输入有效邮箱。";
  }

  if (!draft?.password) {
    errors.password = "请输入密码。";
  } else if (draft.password.length < 6) {
    errors.password = "密码至少需要 6 位。";
  }

  return errors;
}

function normalizeAuthSession(session) {
  if (!session?.user) {
    return null;
  }

  return {
    isAuthenticated: true,
    userEmail: session.user.email ?? "",
    userId: session.user.id ?? ""
  };
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function previewAnonKey(value) {
  if (!value) {
    return "";
  }

  if (value.startsWith("sb_publishable_")) {
    return "sb_publishable_...";
  }

  return `${value.slice(0, 6)}...`;
}
