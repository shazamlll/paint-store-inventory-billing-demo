import { isOperationalRoute } from "./auth.js";

const storeMembershipSelect = "id,store_id,role,active,stores(id,name,active)";

const roleRouteRules = {
  owner: {
    allowAllOperational: true,
    denied: []
  },
  clerk: {
    allowed: ["/dashboard", "/sales", "/purchases", "/inventory", "/products", "/customers", "/search"],
    denied: ["/inventory/adjustments", "/reports"]
  },
  accountant: {
    allowed: ["/dashboard", "/reports"],
    denied: ["/sales", "/purchases", "/inventory", "/products", "/customers", "/search"]
  }
};

export async function loadStoreContext({ client, session } = {}) {
  const userId = session?.user?.id;

  if (!client?.from) {
    return emptyStoreContext("client_unavailable", userId);
  }

  if (!userId) {
    return emptyStoreContext("missing_session", null);
  }

  const { data, error } = await client
    .from("store_members")
    .select(storeMembershipSelect)
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      ready: true,
      userId,
      memberships: [],
      activeStore: null,
      role: null,
      error: error.message ?? "store_context_error"
    };
  }

  const memberships = normalizeMemberships(data);
  const activeMembership = memberships.find((membership) => membership.store?.active !== false) ?? null;

  return {
    ready: true,
    userId,
    memberships,
    activeStore: activeMembership?.store ?? null,
    role: activeMembership?.role ?? null,
    error: null
  };
}

export function buildStoreAccessGate({ pathname = "/", storeContext } = {}) {
  if (!isOperationalRoute(pathname)) {
    return {
      allowed: true,
      reason: "public_route",
      redirectTo: null
    };
  }

  if (!storeContext?.ready) {
    return {
      allowed: false,
      reason: "loading_store_context",
      redirectTo: null
    };
  }

  if (!storeContext.activeStore || !storeContext.role) {
    return {
      allowed: false,
      reason: "missing_store_context",
      redirectTo: "/"
    };
  }

  if (isRouteAllowedForRole(pathname, storeContext.role)) {
    return {
      allowed: true,
      reason: "role_allowed",
      redirectTo: null
    };
  }

  return {
    allowed: false,
    reason: "role_forbidden",
    redirectTo: "/"
  };
}

export function filterNavigationGroupsByRole(groups = [], role) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isRouteAllowedForRole(item.href, role))
    }))
    .filter((group) => group.items.length > 0);
}

export function shouldLoadStoreContext({ authReady = false, hasAuthClient = false, userId, storeContext } = {}) {
  if (!hasAuthClient || !authReady || !userId) {
    return false;
  }

  if (!storeContext?.ready) {
    return false;
  }

  return storeContext.userId !== userId;
}

export function getStoreGatePanelCopy({ storeGate = {}, storeContext = {} } = {}) {
  const loading = storeGate.reason === "loading_store_context" || !storeContext.ready;

  if (loading) {
    return {
      title: "正在加载门店权限",
      detail: "系统正在读取你的门店成员关系和角色。"
    };
  }

  if (storeContext.error) {
    return {
      title: "门店权限读取失败",
      detail: "系统暂时无法读取当前账号的门店成员关系，请稍后重试或联系管理员检查权限配置。"
    };
  }

  if (storeGate.reason === "missing_store_context") {
    return {
      title: "未找到可用门店",
      detail: "当前账号已登录，但没有关联任何可用门店。请确认门店成员关系已启用，且关联门店处于启用状态。"
    };
  }

  return {
    title: "当前角色不能访问此页面",
    detail: "当前账号已关联门店，但角色不允许访问此页面。请返回首页，或让店主调整你的门店角色。"
  };
}

export function isRouteAllowedForRole(pathname = "/", role) {
  if (!isOperationalRoute(pathname)) {
    return true;
  }

  const rules = roleRouteRules[role];

  if (!rules) {
    return false;
  }

  if (matchesAnyRoute(pathname, rules.denied ?? [])) {
    return false;
  }

  if (rules.allowAllOperational) {
    return true;
  }

  return matchesAnyRoute(pathname, rules.allowed ?? []);
}

function normalizeMemberships(rows) {
  return (rows ?? [])
    .map((row) => {
      const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;

      return {
        id: row.id,
        storeId: row.store_id,
        role: row.role,
        active: row.active,
        store: store
          ? {
              id: store.id,
              name: store.name,
              active: store.active
            }
          : null
      };
    })
    .filter((membership) => membership.active !== false && membership.store);
}

function emptyStoreContext(error, userId) {
  return {
    ready: true,
    userId,
    memberships: [],
    activeStore: null,
    role: null,
    error
  };
}

function matchesAnyRoute(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
