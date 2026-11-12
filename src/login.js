export function createLoginDraft(options = {}) {
  return {
    storeName: options.storeName ?? "主门店",
    email: "",
    password: "",
    rememberDevice: false
  };
}

export function validateLoginDraft(draft) {
  const errors = {};

  if (!draft.email?.trim()) {
    errors.email = "请输入邮箱。";
  } else if (!draft.email.includes("@")) {
    errors.email = "请输入有效邮箱。";
  }

  if (!draft.password) {
    errors.password = "请输入密码。";
  } else if (draft.password.length < 6) {
    errors.password = "密码至少需要 6 位。";
  }

  return errors;
}

export function getLoginSessionSummary(session) {
  if (!session?.isAuthenticated) {
    return "已锁定：请先使用 Supabase Auth 登录。";
  }

  return `已以${session.roleLabel}身份登录 ${session.storeName}。`;
}
