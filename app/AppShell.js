"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../lib/supabase.js";
import { buildAuthGate, getInitialAuthShellState } from "../src/auth.js";
import {
  buildStoreAccessGate,
  filterNavigationGroupsByRole,
  getStoreGatePanelCopy,
  loadStoreContext,
  shouldLoadStoreContext
} from "../src/store-context.js";
import { appNavigation } from "../src/ux-copy.js";

const emptyStoreContext = {
  ready: true,
  userId: null,
  memberships: [],
  activeStore: null,
  role: null,
  error: null
};

export default function AppShell({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const [authReady, setAuthReady] = useState(() => getInitialAuthShellState().authReady);
  const [session, setSession] = useState(() => getInitialAuthShellState().session);
  const [storeContext, setStoreContext] = useState(emptyStoreContext);
  const sessionUserId = session?.user?.id ?? null;
  const authGate = buildAuthGate({
    pathname,
    authReady,
    session,
    hasAuthClient: Boolean(authClient)
  });
  const storeGate = buildStoreAccessGate({
    pathname,
    storeContext
  });
  const navigationGroups = useMemo(() => {
    if (!storeContext.role) {
      return appNavigation.groups;
    }

    return filterNavigationGroupsByRole(appNavigation.groups, storeContext.role);
  }, [storeContext.role]);
  const activeStore = storeContext.activeStore;

  useEffect(() => {
    if (!authClient) {
      setAuthReady(true);
      return undefined;
    }

    let active = true;

    authClient.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data?.session ?? null);
      setAuthReady(true);
    });

    const { data } = authClient.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe();
    };
  }, [authClient]);

  useEffect(() => {
    if (!authGate.redirectTo || !authReady || pathname === authGate.redirectTo) {
      return;
    }

    router.replace(authGate.redirectTo);
  }, [authGate.redirectTo, authReady, pathname, router]);

  useEffect(() => {
    if (!authClient || !authReady || !sessionUserId) {
      setStoreContext(emptyStoreContext);
      return undefined;
    }

    if (
      !shouldLoadStoreContext({
        authReady,
        hasAuthClient: Boolean(authClient),
        userId: sessionUserId,
        storeContext
      })
    ) {
      return undefined;
    }

    let active = true;

    setStoreContext({
      ...emptyStoreContext,
      userId: sessionUserId,
      ready: false
    });

    loadStoreContext({ client: authClient, session }).then((nextStoreContext) => {
      if (!active) {
        return;
      }

      setStoreContext(nextStoreContext);
    });

    return () => {
      active = false;
    };
  }, [authClient, authReady, sessionUserId]);

  if (isLoginRoute(pathname)) {
    return children;
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="主导航">
        <AppBrand />
        <AppNavigation groups={navigationGroups} pathname={pathname} />
        <StoreStatus activeStore={activeStore} role={storeContext.role} />
      </aside>
      <div className="app-mobile-chrome">
        <AppBrand compact />
        <nav className="app-mobile-nav" aria-label="主导航">
          <FlatNavigation groups={navigationGroups} pathname={pathname} />
        </nav>
      </div>
      <div className="app-content">
        {authGate.allowed ? (
          storeGate.allowed ? (
            children
          ) : (
            <StoreGatePanel storeGate={storeGate} storeContext={storeContext} />
          )
        ) : (
          <AuthGatePanel authGate={authGate} authReady={authReady} />
        )}
      </div>
    </div>
  );
}

function AuthGatePanel({ authGate, authReady }) {
  const loading = authGate.reason === "loading_session" || !authReady;

  return (
    <main className="mx-auto grid min-h-screen max-w-3xl content-center px-6 py-10">
      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-6">
        <p className="text-xs font-semibold uppercase text-[var(--accent)]">Supabase Auth</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {loading ? "正在确认登录状态" : "请先登录"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          操作页面现在需要真实 Supabase 会话。登录后才能进入商品、客户、开单、采购、库存和报表页面。
        </p>
        {authGate.redirectTo ? (
          <Link
            className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            href={authGate.redirectTo}
          >
            前往登录
          </Link>
        ) : null}
      </section>
    </main>
  );
}

function StoreGatePanel({ storeGate, storeContext }) {
  const { title, detail } = getStoreGatePanelCopy({ storeGate, storeContext });

  return (
    <main className="mx-auto grid min-h-screen max-w-3xl content-center px-6 py-10">
      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-6">
        <p className="text-xs font-semibold uppercase text-[var(--accent)]">Store Access</p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
        {storeGate.redirectTo ? (
          <Link
            className="mt-4 inline-flex rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            href={storeGate.redirectTo}
          >
            返回首页
          </Link>
        ) : null}
      </section>
    </main>
  );
}

function AppBrand({ compact = false }) {
  return (
    <Link className={compact ? "app-brand app-brand-compact" : "app-brand"} href="/">
      <span className="app-brand-title">{appNavigation.title}</span>
      <span className="app-brand-subtitle">{appNavigation.subtitle}</span>
    </Link>
  );
}

function AppNavigation({ groups, pathname }) {
  return (
    <nav className="app-nav-groups" aria-label="主导航">
      {groups.map((group) => (
        <section className="app-nav-group" key={group.id}>
          <p className="app-nav-group-label">{group.label}</p>
          <div className="app-nav-links">
            {group.items.map((item) => (
              <AppNavLink item={item} key={item.href} pathname={pathname} />
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

function FlatNavigation({ groups, pathname }) {
  return groups.flatMap((group) =>
    group.items.map((item) => (
      <AppNavLink item={item} key={`${group.id}-${item.href}`} pathname={pathname} />
    ))
  );
}

function StoreStatus({ activeStore, role }) {
  if (!activeStore) {
    return <p className="app-sidebar-status">{appNavigation.status}</p>;
  }

  return (
    <p className="app-sidebar-status">
      当前门店：{activeStore.name}
      <br />
      当前角色：{formatRole(role)}
    </p>
  );
}

function AppNavLink({ item, pathname }) {
  const active = isActiveRoute(pathname, item);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={active ? "app-nav-link app-nav-link-active" : "app-nav-link"}
      href={item.href}
    >
      {item.label}
    </Link>
  );
}

function isActiveRoute(pathname, item) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isLoginRoute(pathname) {
  return pathname === "/login";
}

function formatRole(role) {
  const labels = {
    owner: "店主",
    clerk: "店员",
    accountant: "财务"
  };

  return labels[role] ?? "未分配";
}
