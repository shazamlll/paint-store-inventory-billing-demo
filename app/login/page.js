"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../../lib/supabase.js";
import {
  getSupabaseSessionSummary,
  signInWithSupabaseAuth,
  signOutSupabaseAuth
} from "../../src/auth.js";

export default function LoginPage() {
  const router = useRouter();
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const [draft, setDraft] = useState({
    email: "",
    password: "",
    rememberDevice: true
  });
  const [errors, setErrors] = useState({});
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const sessionSummary = getSupabaseSessionSummary(session);

  useEffect(() => {
    if (!authClient) {
      return undefined;
    }

    let active = true;

    authClient.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      const nextSession = data?.session ?? null;
      setSession(nextSession);

      if (nextSession?.user) {
        router.replace("/");
      }
    });

    const { data } = authClient.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        router.replace("/");
      }
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe();
    };
  }, [authClient, router]);

  function updateDraft(field, value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value
    }));
    setErrors((currentErrors) => {
      const { [field]: removed, credentials, ...rest } = currentErrors;
      return rest;
    });
  }

  async function signIn() {
    setLoading(true);
    const result = await signInWithSupabaseAuth(draft, authClient);
    const nextSession = result.session?.isAuthenticated
      ? { user: { email: result.session.userEmail, id: result.session.userId } }
      : null;

    setErrors(result.errors);
    setSession(nextSession);
    setLoading(false);

    if (nextSession?.user) {
      router.replace("/");
    }
  }

  async function signOut() {
    setLoading(true);
    await signOutSupabaseAuth(authClient);
    setSession(null);
    setLoading(false);
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-5 px-6 py-6 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      <section className="grid h-fit gap-5 rounded-md border border-[var(--border)] bg-[var(--panel)] p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--accent)]">Supabase Auth</p>
          <h1 className="mt-2 text-3xl font-semibold">门店账号登录</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            登录后进入经营首页，系统会按当前账号读取门店和角色权限。
          </p>
        </div>

        {!authClient ? (
          <p className="rounded-md bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#991b1b]">
            缺少 Supabase 公开配置，暂时无法登录。
          </p>
        ) : null}

        <label className="grid gap-1 text-sm font-semibold">
          <span>邮箱</span>
          <input
            autoComplete="email"
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => updateDraft("email", event.target.value)}
            type="email"
            value={draft.email}
          />
          {errors.email ? <span className="text-xs font-medium text-[#b91c1c]">{errors.email}</span> : null}
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          <span>密码</span>
          <input
            autoComplete="current-password"
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => updateDraft("password", event.target.value)}
            type="password"
            value={draft.password}
          />
          {errors.password ? <span className="text-xs font-medium text-[#b91c1c]">{errors.password}</span> : null}
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            checked={draft.rememberDevice}
            onChange={(event) => updateDraft("rememberDevice", event.target.checked)}
            type="checkbox"
          />
          <span>在这台设备保持登录</span>
        </label>

        {errors.credentials ? (
          <p className="rounded-md bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#991b1b]">
            {errors.credentials}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading || !authClient}
            onClick={signIn}
            type="button"
          >
            登录
          </button>
          <button
            className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            disabled={loading || !session}
            onClick={signOut}
            type="button"
          >
            退出
          </button>
        </div>
      </section>

      <section className="grid h-fit gap-4 rounded-md border border-[var(--border)] bg-[var(--panel)] p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">会话</p>
          <h2 className="mt-2 text-xl font-semibold">{sessionSummary}</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Status label="认证" value="Supabase Auth" />
          <Status label="门店权限" value="登录后读取" />
          <Status label="进入页面" value="自动跳转首页" />
        </div>

        <div className="rounded-md bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
          未登录访问任意业务页面都会回到登录页。登录成功后，系统会进入首页并展示可访问的业务入口。
        </div>
      </section>
    </main>
  );
}

function Status({ label, value }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white px-3 py-2">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
